import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// TÜM HATLARI GETİR
router.get("/", async (req, res) => {
  try {
    const lines = await prisma.line.findMany();
    res.json(lines);
  } catch (err) {
    res.status(500).json({ error: "Hatlar alınamadı" });
  }
});

// (Opsiyonel) YENİ HAT EKLE
router.post("/", async (req, res) => {
  const { code, name } = req.body;
  try {
    const line = await prisma.line.create({
      data: { code, name },
    });
    res.json(line);
  } catch (err) {
    res.status(500).json({ error: "Hat eklenemedi" });
  }
});

// (Opsiyonel) HAT SİL
router.delete("/:id", async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.line.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Hat silinemedi" });
  }
});

export default router;
