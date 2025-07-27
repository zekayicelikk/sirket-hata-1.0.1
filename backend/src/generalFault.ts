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
  } catch (err: unknown) { // Explicitly declare err as unknown (good practice)
    if (err instanceof Error) { // Type Narrowing
      console.error("Error fetching general faults:", err.message);
    } else {
      console.error("An unknown error occurred while fetching general faults:", err);
    }
    res.status(500).json({ error: "Arızalar alınamadı" });
  }
});

// === YENİ ARIZA EKLE (status: "open" default, closedAt null) ===
router.post("/", async (req, res) => {
  try {
    const {
      description,
      location,
      productionImpact,
      userId,
      lines,
      files,
      date
    } = req.body;

    const generalFault = await prisma.generalFault.create({
      data: {
        description,
        location,
        productionImpact,
        date: date ? new Date(date) : new Date(),
        user: { connect: { id: userId } },
        status: "open",
        closedAt: null,
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

    if (generalFault.productionImpact) {
      const impactedLines = generalFault.lines.filter(
        (l: any) => l.downtimeMin && l.downtimeMin > 15
      );

      if (impactedLines.length > 0) {
        const lineDetails = impactedLines.map(
          (l: any) => `${l.line?.name || l.line?.code || "Hat Bilgisi Yok"} (${l.downtimeMin} dakika)`
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

              <p><b>Arızayı Kaydeden Kullanıcı:</b> ${generalFault.user?.firstName || generalFault.user?.email || "Bilinmiyor"}</p>
              <p><b>Kayıt Zamanı:</b> ${moment(generalFault.date).format("DD MMMM YYYY, HH:mm:ss")}</p>
              
              <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">

              <p style="font-size: 1.1em; font-weight: bold; color: #dc3545;">Lütfen acilen durumu değerlendirin ve gerekli aksiyonları alın!</p>
              <br>
              <p>Saygılarımızla,</p>
              <p><i>Arıza Takip Sistemi</i></p>
            </div>
          `
        };

        transporter.sendMail(mailOptions, (error, info) => {
          if (error) { // 'error' here is already typed correctly by Nodemailer
            console.error("Mail gönderilemedi:", error);
          } else {
            console.log("Kritik genel arıza bildirimi başarıyla gönderildi:", info.response);
          }
        });
      }
    }

    res.status(201).json(generalFault);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Arıza kaydı eklenemedi:", err.message);
    } else {
      console.error("An unknown error occurred while adding fault record:", err);
    }
    res.status(500).json({ error: "Arıza kaydı eklenemedi" });
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("Error fetching general fault details:", err.message);
    } else {
      console.error("An unknown error occurred while fetching fault details:", err);
    }
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error closing fault ${req.params.id}:`, err.message);
      // Check if the error is due to a non-existent record
      if ((err as any).code === 'P2025') { // Prisma's error code for record not found
        return res.status(404).json({ error: "Kapatılacak arıza bulunamadı." });
      }
    } else {
      console.error(`An unknown error occurred while closing fault ${req.params.id}:`, err);
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
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error(`Error deleting fault ${req.params.id}:`, err.message);
      if ((err as any).code === 'P2025') {
        return res.status(404).json({ error: "Silinecek arıza bulunamadı." });
      }
    } else {
      console.error(`An unknown error occurred while deleting fault ${req.params.id}:`, err);
    }
    res.status(500).json({ error: "Silinemedi" });
  }
});

export default router;