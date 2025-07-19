import { Router, Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

const router = Router();
const prisma = new PrismaClient();

const generalFaultDTO = (g: any) => ({
  id: g.id,
  description: g.description,
  location: g.location,
  duration: g.duration,   // <-- YENİ ALAN
  date: g.date,
  user: g.user ? { id: g.user.id, email: g.user.email, role: g.user.role } : null,
  createdAt: g.createdAt,
});

router.get("/", authenticateToken, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { q, location, userId, start, end, skip = 0, limit = 20 } = req.query;
    const where: any = {};

    if (q && typeof q === "string") {
      where.OR = [
        { description: { contains: q, mode: "insensitive" } },
        { location: { contains: q, mode: "insensitive" } }
      ];
    }
    if (location && typeof location === "string")
      where.location = { contains: location, mode: "insensitive" };
    if (userId) where.userId = Number(userId);
    if (start || end) {
      where.date = {};
      if (start) where.date.gte = new Date(start as string);
      if (end) where.date.lte = new Date(end as string);
    }

    const faults = await prisma.generalFault.findMany({
      where,
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { date: "desc" },
      skip: Number(skip) || 0,
      take: Number(limit) || 20,
    });

    const total = await prisma.generalFault.count({ where });

    res.status(200).json({
      success: true,
      total,
      data: faults.map(generalFaultDTO)
    });
  } catch (error) {
    next(error);
  }
});

router.get("/my", authenticateToken, async (req: any, res, next) => {
  try {
    const userId = req.user.id;
    const faults = await prisma.generalFault.findMany({
      where: { userId: Number(userId) },
      include: { user: { select: { id: true, email: true, role: true } } },
      orderBy: { date: "desc" }
    });
    res.status(200).json({ success: true, data: faults.map(generalFaultDTO) });
  } catch (error) {
    next(error);
  }
});

router.get("/:id", authenticateToken, async (req, res, next) => {
  try {
    const fault = await prisma.generalFault.findUnique({
      where: { id: Number(req.params.id) },
      include: { user: { select: { id: true, email: true, role: true } } },
    });
    if (!fault) return res.status(404).json({ error: "Arıza bulunamadı" });
    res.json({ success: true, data: generalFaultDTO(fault) });
  } catch (error) {
    next(error);
  }
});

router.post("/", authenticateToken, async (req: any, res, next) => {
  try {
    const userId = req.user.id;
    const userExists = await prisma.user.findUnique({ where: { id: Number(userId) } });
    if (!userExists) {
      return res.status(400).json({ error: "Kullanıcı bulunamadı, lütfen tekrar giriş yapın." });
    }
    const { description, location, duration, date } = req.body;
    if (!description || !location)
      return res.status(400).json({ error: "Açıklama ve konum zorunlu" });

    const newFault = await prisma.generalFault.create({
      data: {
        userId: Number(userId),
        description,
        location,
        duration,  // <-- YENİ ALAN
        date: date ? new Date(date) : new Date(),
      },
      include: { user: { select: { id: true, email: true, role: true } } }
    });

    res.status(201).json({ success: true, data: generalFaultDTO(newFault) });
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    const { description, location, duration, date } = req.body;
    const updated = await prisma.generalFault.update({
      where: { id: Number(req.params.id) },
      data: {
        description, location, duration, date: date ? new Date(date) : undefined
      }
    });
    res.json({ success: true, data: updated });
  } catch (error) {
    next(error);
  }
});

router.delete("/:id", authenticateToken, requireAdmin, async (req, res, next) => {
  try {
    await prisma.generalFault.delete({ where: { id: Number(req.params.id) } });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
});

export default router;
