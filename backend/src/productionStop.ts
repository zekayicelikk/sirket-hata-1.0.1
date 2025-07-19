import { Router } from "express";
import { PrismaClient } from "@prisma/client";

const router = Router();
const prisma = new PrismaClient();

// ÜRETİM DURUŞU EKLE
router.post("/", async (req, res) => {
  try {
    const {
      line, startTime, endTime, duration, reason, faultId, createdById
    } = req.body;
    const stop = await prisma.productionStop.create({
      data: {
        line,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        reason,
        faultId,
        createdById
      }
    });
    res.status(201).json(stop);
  } catch (e: any) {
    res.status(500).json({ error: "Duruş kaydedilemedi", detail: e.message });
  }
});

// TÜM DURUŞLARI LİSTELE
router.get("/", async (_req, res) => {
  try {
    const stops = await prisma.productionStop.findMany({
      include: {
        fault: true,
        createdBy: true
      },
      orderBy: { startTime: "desc" }
    });
    res.json(stops);
  } catch (e: any) {
    res.status(500).json({ error: "Duruşlar getirilemedi", detail: e.message });
  }
});

// DURUŞ GÜNCELLE
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { line, startTime, endTime, duration, reason, faultId, createdById } = req.body;
    const stop = await prisma.productionStop.update({
      where: { id },
      data: {
        line,
        startTime: new Date(startTime),
        endTime: new Date(endTime),
        duration,
        reason,
        faultId,
        createdById
      }
    });
    res.json(stop);
  } catch (e: any) {
    res.status(500).json({ error: "Güncellenemedi", detail: e.message });
  }
});

// DURUŞ SİL
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.productionStop.delete({ where: { id } });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ error: "Silinemedi", detail: e.message });
  }
});

export default router;
