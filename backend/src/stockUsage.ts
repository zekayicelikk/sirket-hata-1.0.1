import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import nodemailer from "nodemailer";

const router = Router();
const prisma = new PrismaClient();

// Nodemailer ayarları (örnek)
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "zek4345@gmail.com",
    pass: "vmejmfkvqmwsivcf"
  },
});

// Tüm stok kullanımları (filtre opsiyonlu)
router.get("/", authenticateToken, async (req: any, res) => {
  try {
    const { stockId, userId } = req.query;
    const where: any = {};
    if (stockId) where.stockId = Number(stockId);
    if (userId) where.userId = Number(userId);

    const usages = await prisma.stockUsage.findMany({
      where,
      include: {
        stock: true,
        user: true,
        generalFault: true,
        record: true,
      },
      orderBy: { usedAt: "desc" },
    });
    res.json(usages);
  } catch (e) {
    res.status(500).json({ error: "Stok kullanımları alınamadı" });
  }
});

// Tek stok kullanım detayı
router.get("/:id", authenticateToken, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const usage = await prisma.stockUsage.findUnique({
      where: { id },
      include: {
        stock: true,
        user: true,
        generalFault: true,
        record: true,
      },
    });
    if (!usage) return res.status(404).json({ error: "Stok kullanımı bulunamadı." });
    res.json(usage);
  } catch (e) {
    res.status(500).json({ error: "Stok kullanımı alınamadı." });
  }
});

// Yeni stok kullanımı ekle — KRİTİK SEVİYE ALTINA DÜŞERSE MAIL GÖNDER!
router.post("/", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const {
    stockId,
    amount,
    usedAt,
    generalFaultId,
    recordId,
    note,
  } = req.body;

  if (!stockId || !amount || amount <= 0) {
    return res.status(400).json({ error: "Geçerli stockId ve amount gerekli" });
  }

  try {
    // 1. Stok kontrol
    const stock = await prisma.stock.findUnique({ where: { id: Number(stockId) } });
    if (!stock) return res.status(404).json({ error: "Stok bulunamadı" });
    if (stock.quantity < amount) {
      return res.status(400).json({ error: "Yeterli stok yok" });
    }

    // 2. Kullanım kaydı oluştur
    const usage = await prisma.stockUsage.create({
      data: {
        stockId: Number(stockId),
        amount,
        usedAt: usedAt ? new Date(usedAt) : new Date(),
        generalFaultId: generalFaultId || null,
        recordId: recordId || null,
        userId: userId || null,
        note: note || null,
      },
      include: {
        stock: true,
        user: true,
        generalFault: true,
        record: true,
      },
    });

    // 3. Stok adedini düşür
    const updatedStock = await prisma.stock.update({
      where: { id: Number(stockId) },
      data: { quantity: { decrement: amount } },
    });

    // 4. Kritik altına düştüyse otomatik mail gönder
    if (updatedStock.quantity < updatedStock.critical) {
      const mailOptions = {
        from: "zek4345@gmail.com",
        to: "zekayiclk43@firma.com, diger.sorumlu@firma.com",
        subject: `[KRİTİK] Stok seviyesi kritik altında: ${updatedStock.name}`,
        html: `
          <h2>Stok Kritik Uyarı!</h2>
          <ul>
            <li><b>Stok Adı:</b> ${updatedStock.name}</li>
            <li><b>Kalan Miktar:</b> ${updatedStock.quantity}</li>
            <li><b>Kritik Seviye:</b> ${updatedStock.critical}</li>
            <li><b>Son Kullanım Notu:</b> ${note || "-"}</li>
            <li><b>Kullanımı Yapan:</b> ${req.user.firstName || ""} ${req.user.lastName || ""} (${req.user.email})</li>
            <li><b>Kullanım Tarihi:</b> ${(usedAt ? new Date(usedAt) : new Date()).toLocaleString("tr-TR")}</li>
          </ul>
          <p>En kısa sürede stok tedariği gereklidir!</p>
        `
      };
      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("Kritik stok maili gönderilemedi:", error);
        } else {
          console.log("Kritik stok bildirimi gönderildi:", info.response);
        }
      });
    }

    res.status(201).json(usage);
  } catch (e) {
    res.status(500).json({ error: "Stok kullanımı oluşturulamadı" });
  }
});

// Kullanım kaydını sil (stok geri eklensin)
router.delete("/:id", authenticateToken, async (req: any, res) => {
  try {
    const id = Number(req.params.id);
    const usage = await prisma.stockUsage.findUnique({ where: { id } });
    if (!usage) return res.status(404).json({ error: "Stok kullanımı bulunamadı." });

    await prisma.stock.update({
      where: { id: usage.stockId },
      data: { quantity: { increment: usage.amount } },
    });

    await prisma.stockUsage.delete({ where: { id } });
    res.json({ message: "Kullanım kaydı silindi, stok geri eklendi." });
  } catch (e) {
    res.status(500).json({ error: "Kullanım kaydı silinemedi." });
  }
});

export default router;
