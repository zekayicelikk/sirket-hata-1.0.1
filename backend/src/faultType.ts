import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

const router = Router();
const prisma = new PrismaClient();

// Tüm arıza tipleri (herkes görebilir)
router.get("/", authenticateToken, async (req, res) => {
  const faultTypes = await prisma.faultType.findMany({ orderBy: { createdAt: "desc" } });
  res.json(faultTypes);
});

// Yeni arıza tipi ekle (sadece admin)
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "İsim zorunlu" });

  try {
    const newFaultType = await prisma.faultType.create({
      data: { name }
    });
    res.status(201).json(newFaultType);
  } catch (err: any) {
    res.status(500).json({ error: "Arıza tipi eklenemedi", detail: err.message });
  }
});

// Arıza tipi güncelle (sadece admin)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;
  try {
    const updated = await prisma.faultType.update({
      where: { id: Number(id) },
      data: { name }
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Arıza tipi bulunamadı" });
  }
});

// Arıza tipi sil (sadece admin)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.faultType.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Arıza tipi bulunamadı" });
  }
});

export default router;
