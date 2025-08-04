import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken } from "./middleware/auth";

const router = Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || "supersecretkey123";

// Kayıt (Register)
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre zorunlu" });

  const userExists = await prisma.user.findUnique({ where: { email } });
  if (userExists) return res.status(409).json({ error: "Bu e-posta zaten kayıtlı" });

  const hashed = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: { email, password: hashed, role: role || "user" },
  });

  // Action log: kayıt işlemi
  await prisma.actionLog.create({
    data: {
      userId: user.id,
      actionType: "register",
      description: "Yeni kullanıcı kaydı yapıldı",
    },
  });

  res.json({ id: user.id, email: user.email, role: user.role });
});

// Giriş (Login)
router.post("/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "E-posta ve şifre zorunlu" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(401).json({ error: "E-posta veya şifre hatalı" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: "E-posta veya şifre hatalı" });

  const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, {
    expiresIn: "7d",
  });

  // Action log: giriş işlemi
  await prisma.actionLog.create({
    data: {
      userId: user.id,
      actionType: "login",
      description: "Kullanıcı giriş yaptı",
    },
  });

  res.json({ token, user: { id: user.id, email: user.email, role: user.role } });
});

// Şifre değiştirme endpoint'i
router.post("/change-password", authenticateToken, async (req: any, res) => {
  const userId = req.user.id;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: "Eski ve yeni şifre zorunlu." });
  }

  // Kullanıcıyı bul
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return res.status(404).json({ error: "Kullanıcı bulunamadı." });

  // Eski şifreyi kontrol et
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) {
    return res.status(401).json({ error: "Eski şifre hatalı." });
  }

  // Yeni şifreyi hash'le ve kaydet
  const hashed = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({
    where: { id: userId },
    data: { password: hashed }
  });

  // Action log: şifre değişikliği
  await prisma.actionLog.create({
    data: {
      userId,
      actionType: "change_password",
      description: "Kullanıcı şifresini değiştirdi",
    },
  });

  res.json({ success: true, message: "Şifre başarıyla değiştirildi." });
});

export default router;
