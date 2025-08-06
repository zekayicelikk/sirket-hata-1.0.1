import express from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
const router = express.Router();

// Tüm stokları getir
router.get("/", async (req, res) => {
  try {
    // Arama için query ekleyebilirsin
    const stocks = await prisma.stock.findMany({
      orderBy: { name: "asc" },
    });
    res.json(stocks);
  } catch (e) {
    res.status(500).json({ error: "Stoklar alınamadı" });
  }
});

// Tek stok detayı
router.get("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const stock = await prisma.stock.findUnique({
      where: { id },
    });
    if (!stock) return res.status(404).json({ error: "Stok bulunamadı" });
    res.json(stock);
  } catch (e) {
    res.status(500).json({ error: "Stok detayı alınamadı" });
  }
});

// Yeni stok ekle
router.post("/", async (req, res) => {
  try {
    const { name, description, quantity, unit, critical } = req.body;
    if (!name || quantity == null || critical == null) {
      return res.status(400).json({ error: "Zorunlu alanlar eksik" });
    }
    const stock = await prisma.stock.create({
      data: {
        name,
        description: description || null,
        quantity,
        unit: unit || null,
        critical,
      },
    });
    res.status(201).json(stock);
  } catch (e) {
    res.status(500).json({ error: "Stok eklenemedi" });
  }
});

// Stok güncelle
router.put("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    const { name, description, quantity, unit, critical } = req.body;
    const stock = await prisma.stock.update({
      where: { id },
      data: { name, description, quantity, unit, critical },
    });
    res.json(stock);
  } catch (e) {
    res.status(500).json({ error: "Stok güncellenemedi" });
  }
});

// Stok sil (kalıcı)
router.delete("/:id", async (req, res) => {
  try {
    const id = Number(req.params.id);
    await prisma.stock.delete({ where: { id } });
    res.json({ message: "Stok silindi." });
  } catch (e) {
    res.status(500).json({ error: "Stok silinemedi." });
  }
});

export default router;
