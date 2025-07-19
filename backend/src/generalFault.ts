import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ARIZA EKLE (POST /api/generalFault)
router.post("/", async (req, res) => {
  try {
    const {
      description, location, duration, userId, equipmentType, equipmentId,
      importance, status, line, productionImpact, downtimeMinutes,
      closedAt, productionStopId
    } = req.body;

    const fault = await prisma.generalFault.create({
      data: {
        description,
        location,
        duration,
        date: new Date(),
        userId,
        equipmentType,
        equipmentId,
        importance,
        status,
        line,
        productionImpact,
        downtimeMinutes,
        closedAt: closedAt ? new Date(closedAt) : undefined,
        productionStopId
      },
    });
    res.status(201).json(fault);
  } catch (e: any) {
    res.status(500).json({ error: "Arıza kaydedilemedi", detail: e.message });
  }
});

// ARIZA GÜNCELLE (PUT /api/generalFault/:id)
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const data = req.body;
    if (data.closedAt) data.closedAt = new Date(data.closedAt);
    const updated = await prisma.generalFault.update({
      where: { id },
      data
    });
    res.json(updated);
  } catch (e: any) {
    res.status(500).json({ error: "Güncellenemedi", detail: e.message });
  }
});

// TÜM ARIZALARI LİSTELE (GET /api/generalFault)
router.get("/", async (req, res) => {
  try {
    const filter: any = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.line) filter.line = req.query.line;
    if (req.query.importance) filter.importance = req.query.importance;
    if (req.query.equipmentType) filter.equipmentType = req.query.equipmentType;
    // Tarih aralığı gibi daha fazla filtre ekleyebilirsin

    const data = await prisma.generalFault.findMany({
      where: filter,
      include: {
        user: true,
        productionStop: true,
        files: true,
        actions: true
      },
      orderBy: { createdAt: "desc" }
    });
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: "Arızalar alınamadı", detail: e.message });
  }
});

// ARIZA DETAY (GET /api/generalFault/:id)
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const fault = await prisma.generalFault.findUnique({
      where: { id },
      include: {
        user: true,
        productionStop: true,
        files: true,
        actions: true
      }
    });
    if (!fault) return res.status(404).json({ error: "Bulunamadı" });
    res.json(fault);
  } catch (e: any) {
    res.status(500).json({ error: "Detay alınamadı", detail: e.message });
  }
});

// ARIZA SİL (DELETE /api/generalFault/:id)
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.generalFault.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Silinemedi", detail: e.message });
  }
});

export default router;
