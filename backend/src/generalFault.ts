import express from "express";
import { PrismaClient } from "@prisma/client";
import nodemailer from "nodemailer";
import moment from "moment";

const router = express.Router();
const prisma = new PrismaClient();

// --- Nodemailer Transporter Setup ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: "zek4345@gmail.com",
    pass: "vmejmfkvqmwsivcf"
  },
});

// === TÜM ARIZALARI GETİR (status, closedAt dahil filtrelenebilir) ===
router.get("/", async (req, res) => {
  try {
    const { line, productionImpact, start, end, status, includeClosed } = req.query;
    const where: any = {};

    if (productionImpact !== undefined) {
      where.productionImpact = productionImpact === "true";
    }

    if (status) {
      where.status = String(status);
    } else if (includeClosed !== 'true') {
      where.status = "open";
    }

    if (typeof start === "string" && typeof end === "string") {
      where.date = {
        gte: new Date(start),
        lte: new Date(end),
      };
    }

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
    console.error("Arızalar alınamadı:", err);
    res.status(500).json({ error: "Arızalar alınamadı" });
  }
});

// === YENİ ARIZA EKLE (Kullanılan stokları da otomatik düşer!) ===
router.post("/", async (req, res) => {
  try {
    const {
      description,
      location,
      productionImpact,
      userId,
      lines,
      files,
      date,
      usedStocks // [{ stockId, amount, note }]
    } = req.body;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Arıza kaydını oluştur
      const generalFault = await tx.generalFault.create({
        data: {
          description,
          location,
          productionImpact,
          date: date ? new Date(date) : new Date(),
          user: { connect: { id: userId } },
          status: "open",
          closedAt: null,
          lines: {
            create: lines?.map((l: { lineId: any; downtimeMin: any; }) => ({
              line: { connect: { id: l.lineId } },
              downtimeMin: l.downtimeMin,
            })) || [],
          },
          files: {
            create: files?.map((f: { url: any; fileName: any; }) => ({
              url: f.url,
              fileName: f.fileName,
            })) || [],
          },
        },
        include: {
          lines: { include: { line: true } },
          files: true,
          user: true,
        },
      });

      // 2. Kullanılan stoklar (varsa) için stockUsage ekle ve stoktan düş
      if (Array.isArray(usedStocks) && usedStocks.length > 0) {
        for (const s of usedStocks) {
          // 2.1 Yeterli stok var mı kontrol et
          const stock = await tx.stock.findUnique({ where: { id: s.stockId } });
          if (!stock || stock.quantity < s.amount) {
            throw new Error(`${stock?.name || "Ürün"} için yeterli stok yok!`);
          }

          // 2.2 StockUsage kaydı oluştur
          await tx.stockUsage.create({
            data: {
              stockId: s.stockId,
              amount: s.amount,
              generalFaultId: generalFault.id,
              userId: userId,
              note: s.note || null,
            },
          });

          // 2.3 Stoktan düş
          await tx.stock.update({
            where: { id: s.stockId },
            data: { quantity: { decrement: s.amount } },
          });
        }
      }

      return generalFault;
    });

    // (Mail gönderme kısmı aynen duruyor)
    if (result.productionImpact) {
      const impactedLines = result.lines.filter(
        (l) => l.downtimeMin && l.downtimeMin > 15
      );

      if (impactedLines.length > 0) {
        const lineDetails = impactedLines.map(
          (l) => `${l.line?.name || l.line?.code || "Hat Bilgisi Yok"} (${l.downtimeMin} dakika)`
        ).join(", ");

        const mailOptions = {
          from: "zek4345@gmail.com",
          to: "serkancicekogluiu@gmail.com",
          subject: `ACİL: Üretim Hattı Kritik Duruş Bildirimi - ${location || "Bilinmiyor"}`,
          html: `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
              <h2 style="color: #FF0000;">🚨 ACİL BİLDİRİM: Kritik Üretim Duruşu! 🚨</h2>
              <p><b>Konum:</b> <span style="font-size: 1.1em; color: #007bff;">${location || "Konum Bilgisi Yok"}</span></p>
              <p>Yeni bir genel arıza kaydedildi ve bu arıza aşağıdaki üretim hatlarında <b>15 dakikadan uzun bir duruşa</b> neden oldu:</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p><b>Arıza Açıklaması:</b> ${description}</p>
              <p><b>Üretim Etkisi:</b> <span style="font-weight: bold; color: ${productionImpact ? '#dc3545' : '#28a745'};">${productionImpact ? "VAR" : "YOK"}</span></p>
              <h4>Etkilenen Hatlar ve Duruş Süreleri:</h4>
              <ul style="list-style-type: disc; padding-left: 20px;">
                ${impactedLines.map(l => `<li><strong>${l.line?.name || l.line?.code || "Hat"}:</strong> ${l.downtimeMin} dakika</li>`).join('')}
              </ul>
              <p><b>Arızayı Kaydeden Kullanıcı:</b> ${result.user?.firstName || result.user?.email || "Bilinmiyor"}</p>
              <p><b>Kayıt Zamanı:</b> ${moment(result.date).format("DD MMMM YYYY, HH:mm:ss")}</p>
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
              <p style="font-size: 1.1em; font-weight: bold; color: #dc3545;">Lütfen acilen durumu değerlendirin ve gerekli aksiyonları alın!</p>
              <br>
              <p>Saygılarımızla,</p>
              <p><i>Arıza Takip Sistemi</i></p>
            </div>
          `
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error("Mail gönderilemedi:", error);
          } else {
            console.log("Kritik genel arıza bildirimi başarıyla gönderildi:", info.response);
          }
        });
      }
    }

    res.status(201).json(result);
  } catch (err: any) {
    console.error("Arıza kaydı eklenemedi:", err);
    res.status(500).json({ error: "Arıza kaydı eklenemedi", detail: err?.message });
  }
});

// === TEK ARIZA DETAYI (status, closedAt dahil!) ===
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
    console.error("Detay alınamadı:", err);
    res.status(500).json({ error: "Detay alınamadı" });
  }
});

// === ARIZAYI KAPAT (status: closed, closedAt: now) ===
router.patch("/:id/close", async (req, res) => {
  try {
    const { id } = req.params;
    const closedFault = await prisma.generalFault.update({
      where: { id: Number(id) },
      data: {
        status: "closed",
        closedAt: new Date()
      },
      include: {
        user: true,
        lines: { include: { line: true } },
        files: true
      }
    });

    await prisma.actionLog.create({
      data: {
        generalFaultId: closedFault.id,
        userId: req.body.closedByUserId || null,
        actionType: "Arıza Kapatıldı",
        description: `Arıza ID ${closedFault.id} kapatıldı.`,
      },
    });

    res.json(closedFault);
  } catch (err: any) {
    console.error("Arıza kapatılamadı:", err);
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: "Kapatılacak arıza bulunamadı." });
    }
    res.status(500).json({ error: "Arıza kapatılamadı" });
  }
});

// === ARIZA SİL ===
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.generalFault.delete({ where: { id: Number(id) } });

    await prisma.actionLog.create({
      data: {
        generalFaultId: Number(id),
        userId: req.body.deletedByUserId || null,
        actionType: "Arıza Silindi",
        description: `Arıza ID ${id} silindi.`,
      },
    });
    res.json({ success: true, message: "Arıza başarıyla silindi." });
  } catch (err: any) {
    console.error("Silinemedi:", err);
    if (err?.code === 'P2025') {
      return res.status(404).json({ error: "Silinecek arıza bulunamadı." });
    }
    res.status(500).json({ error: "Silinemedi" });
  }
});

export default router;
