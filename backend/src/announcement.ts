import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth"; // (admin için)

const router = Router();
const prisma = new PrismaClient();

// GET: Listele
router.get("/", async (req, res) => {
  const announcements = await prisma.announcement.findMany({
    orderBy: { date: "desc" }
  });
  res.json(announcements);
});

// POST: Ekle (sadece admin)
router.post("/", authenticateToken, async (req: any, res) => {
  const user = req.user;
  if (!user || user.role !== "admin") return res.status(403).json({ error: "Yetkisiz" });

  const { title, desc } = req.body;
  if (!title || !desc) return res.status(400).json({ error: "Başlık ve açıklama gerekli" });

  const ann = await prisma.announcement.create({
    data: {
      title,
      desc,
      createdById: user.id,
    }
  });
  res.status(201).json(ann);
});

export default router;
