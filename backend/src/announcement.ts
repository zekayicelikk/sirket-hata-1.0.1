import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth"; // Admin için token doğrulama

const router = Router();
const prisma = new PrismaClient();

// GET: Duyuruları listele (tarihine göre azalan)
router.get("/", async (req, res) => {
  try {
    const announcements = await prisma.announcement.findMany({
      orderBy: { date: "desc" }
    });
    res.json(announcements);
  } catch (error) {
    res.status(500).json({ error: "Duyurular getirilemedi" });
  }
});

// POST: Yeni duyuru ekle (sadece admin)
router.post("/", authenticateToken, async (req: any, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }

  const { title, desc } = req.body;
  if (!title || !desc) {
    return res.status(400).json({ error: "Başlık ve açıklama gerekli" });
  }

  try {
    const ann = await prisma.announcement.create({
      data: {
        title,
        desc,
        createdById: user.id,
      }
    });
    res.status(201).json(ann);
  } catch (error) {
    res.status(500).json({ error: "Duyuru eklenemedi" });
  }
});

// DELETE: Duyuru sil (sadece admin)
router.delete("/:id", authenticateToken, async (req: any, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Yetkisiz erişim" });
  }

  const id = Number(req.params.id);
  if (isNaN(id)) {
    return res.status(400).json({ error: "Geçersiz duyuru ID'si" });
  }

  try {
    await prisma.announcement.delete({
      where: { id }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(404).json({ error: "Duyuru bulunamadı" });
  }
});

export default router;
