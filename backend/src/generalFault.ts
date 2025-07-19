import express from "express";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// === TÜM ARIZALARI GETİR (filtrelenebilir) ===
router.get("/", async (req, res) => {
  try {
    const { line, productionImpact, start, end } = req.query;
    const where: any = {};

    // Üretim etkisiyle filtre
    if (productionImpact !== undefined) {
      where.productionImpact = productionImpact === "true";
    }
    // Tarih aralığı filtrelemesi
    if (start && end) {
      where.date = {
        gte: new Date(start as string),
        lte: new Date(end as string),
      };
    }
    // Hata bir hattı içeriyor mu (id ile)
    if (line) {
      where.lines = {
        some: { lineId: Number(line) }
      };
    }

    const faults = await prisma.generalFault.findMany({
      where,
      include: {
        user: true,
        lines: { include: { line: true } },
        files: true
      },
      orderBy: { date: "desc" },
    });
    res.json(faults);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Arızalar alınamadı" });
  }
});

// === YENİ ARIZA EKLE ===
router.post("/", async (req, res) => {
  try {
    const {
      description,
      location,
      productionImpact,
      userId,
      lines, // [{ lineId: 1, downtimeMin: 10 }, ...] gibi çoklu
      files, // [{ url, fileName }]
      date
    } = req.body;

    // 1. Ana arıza kaydını ekle
    const generalFault = await prisma.generalFault.create({
      data: {
        description,
        location,
        productionImpact,
        date: date ? new Date(date) : undefined,
        user: { connect: { id: userId } },
        lines: {
          create: lines?.map((l: any) => ({
            line: { connect: { id: l.lineId } },
            downtimeMin: l.downtimeMin,
          })) || [],
        },
        files: {
          create: files?.map((f: any) => ({
            url: f.url,
            fileName: f.fileName,
          })) || [],
        }
      },
      include: {
        lines: { include: { line: true } },
        files: true,
        user: true
      }
    });
    res.status(201).json(generalFault);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Arıza kaydı eklenemedi" });
  }
});

// === TEKİL ARIZA DETAYI ===
router.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const fault = await prisma.generalFault.findUnique({
      where: { id: Number(id) },
      include: {
        user: true,
        lines: { include: { line: true } },
        files: true
      }
    });
    if (!fault) return res.status(404).json({ error: "Arıza bulunamadı" });
    res.json(fault);
  } catch (err) {
    res.status(500).json({ error: "Detay alınamadı" });
  }
});

// === ARIZA SİL ===
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.generalFault.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Silinemedi" });
  }
});

export default router;
