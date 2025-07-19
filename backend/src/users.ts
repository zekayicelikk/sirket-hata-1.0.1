import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

const router = Router();
const prisma = new PrismaClient();

// Kendi profilini gör/güncelle (az önce eklediğimiz kodlar, aynı kalsın)
router.get("/me", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      department: true,
      createdAt: true,
    }
  });
  res.json(user);
});

router.put("/me", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const { firstName, lastName, phone, department } = req.body;

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { firstName, lastName, phone, department }
  });
  res.json({
    id: updated.id,
    email: updated.email,
    role: updated.role,
    firstName: updated.firstName,
    lastName: updated.lastName,
    phone: updated.phone,
    department: updated.department,
    createdAt: updated.createdAt
  });
});

// --- YENİ EKLENENLER ---

// [1] Tüm kullanıcıları listele (admin)
router.get("/", authenticateToken, requireAdmin, async (req, res) => {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      firstName: true,
      lastName: true,
      phone: true,
      department: true,
      createdAt: true,
    }
  });
  res.json(users);
});

// [2] Belirli kullanıcıyı güncelle (admin)
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { firstName, lastName, phone, department, role } = req.body;

  try {
    const updated = await prisma.user.update({
      where: { id: Number(id) },
      data: { firstName, lastName, phone, department, role },
      select: {
        id: true,
        email: true,
        role: true,
        firstName: true,
        lastName: true,
        phone: true,
        department: true,
        createdAt: true,
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
  }
});

// [3] Kullanıcı sil (admin)
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Kullanıcı bulunamadı" });
  }
});
// Yeni kullanıcı oluştur
router.post("/", authenticateToken, async (req: any, res) => {
  const { email, password, role, firstName, lastName, phone, department } = req.body;

  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, şifre ve rol zorunludur." });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ message: "Bu email zaten kayıtlı." });
    }

    const newUser = await prisma.user.create({
      data: {
        email,
        password, // Şifreleme gerekiyorsa bcrypt kullanabilirsin
        role,
        firstName,
        lastName,
        phone,
        department,
      },
    });

    res.status(201).json({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      department: newUser.department,
      createdAt: newUser.createdAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Sunucu hatası oluştu." });
  }
});

export default router;
