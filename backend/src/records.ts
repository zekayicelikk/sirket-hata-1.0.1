import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";
import nodemailer from "nodemailer";

const router = Router();
const prisma = new PrismaClient();

// Arıza kayıtlarını getir
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const { motorId } = req.query;
    const where: any = {};
    if (motorId && !isNaN(Number(motorId))) where.motorId = Number(motorId);

    const records = await prisma.record.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, role: true } },
        motor: true,
        faultType: true,
      },
      orderBy: { date: "desc" }
    });

    // Admin dışıysa sadece kendi kayıtlarını görebilir
    if (!motorId && req.user.role !== "admin") {
      return res.status(403).json({ error: "Tüm kayıtları yalnızca admin görebilir." });
    }

    return res.json(records);
  } catch (err: any) {
    return res.status(500).json({ error: "Arıza kayıtları getirilemedi", detail: err.message });
  }
});

// Kullanıcının kendi kayıtları
router.get("/my", authenticateToken, async (req: any, res) => {
  try {
    const userId = req.user.id;
    const records = await prisma.record.findMany({
      where: { userId: Number(userId) },
      include: { motor: true, faultType: true },
      orderBy: { date: "desc" }
    });
    res.json(records);
  } catch (err: any) {
    res.status(500).json({ error: "Kayıtlar getirilemedi", detail: err.message });
  }
});

// Yeni arıza kaydı ekle
router.post("/", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const { motorId, faultTypeId, desc, duration, date } = req.body;
  if (!motorId || !faultTypeId || !desc) {
    return res.status(400).json({ error: "Tüm alanlar zorunlu" });
  }
  try {
    const record = await prisma.record.create({
      data: {
        userId: Number(userId),
        motorId: Number(motorId),
        faultTypeId: Number(faultTypeId),
        desc,
        duration: duration ? Number(duration) : null,
        date: date ? new Date(date) : new Date(),
      }
    });

    // Eğer bu arıza tipi bu motor için 3. kez tekrarlandıysa kritik mail gönder
    const sameFaultCount = await prisma.record.count({
      where: {
        motorId: Number(motorId),
        faultTypeId: Number(faultTypeId)
      }
    });
    if (sameFaultCount === 3) {
      const motor = await prisma.motor.findUnique({ where: { id: Number(motorId) } });
      const faultType = await prisma.faultType.findUnique({ where: { id: Number(faultTypeId) } });

      // Gerekli mail işlemleri burada (istersen kaldırabilirsin)
    }

    res.status(201).json(record);
  } catch (err: any) {
    res.status(500).json({ error: "Arıza kaydı eklenemedi", detail: err.message });
  }
});

// Arıza kaydını güncelle
router.put("/:id", authenticateToken, requireAdmin, async (req: any, res) => {
  const { id } = req.params;
  const { motorId, faultTypeId, desc, duration, date } = req.body;
  try {
    const updated = await prisma.record.update({
      where: { id: Number(id) },
      data: {
        motorId: Number(motorId),
        faultTypeId: Number(faultTypeId),
        desc,
        duration: duration ? Number(duration) : null,
        date: date ? new Date(date) : undefined
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(404).json({ error: "Kayıt bulunamadı" });
  }
});

// Arıza kaydını sil
router.delete("/:id", authenticateToken, requireAdmin, async (req: any, res) => {
  const { id } = req.params;
  try {
    await prisma.record.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err: any) {
    res.status(404).json({ error: "Kayıt bulunamadı" });
  }
});

export default router;
