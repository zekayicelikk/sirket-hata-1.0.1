import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

const router = Router();
const prisma = new PrismaClient();

// Tüm motorları listele
router.get("/", authenticateToken, async (req, res) => {
  try {
    const motors = await prisma.motor.findMany({
      orderBy: { createdAt: "desc" }
    });
    res.json(motors);
  } catch (err) {
    res.status(500).json({ error: "Motorlar getirilemedi", detail: String(err) });
  }
});

// Motor detayını getir
router.get("/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const motor = await prisma.motor.findUnique({
      where: { id: Number(id) }
    });
    if (!motor) return res.status(404).json({ error: "Motor bulunamadı" });
    res.json(motor);
  } catch (err) {
    res.status(500).json({ error: "Motor getirilemedi", detail: String(err) });
  }
});

// Motor ekle
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  const {
    serial,
    name,
    tag,
    description,
    status,
    location,
    powerKW,
    voltage,
    current,
    phase,
    manufacturer,
    modelNo,
    year,
    rpm,
    protection,
    connectionType,
    lastService,
    nextService,
    isActive,
    qrCode,
    imageUrl,
    notes
  } = req.body;

  if (!serial || !name) return res.status(400).json({ error: "Seri no ve isim zorunlu" });

  try {
    const newMotor = await prisma.motor.create({
      data: {
        serial,
        name,
        tag,
        description,
        status,
        location,
        powerKW: powerKW !== undefined ? Number(powerKW) : undefined,
        voltage: voltage !== undefined ? Number(voltage) : undefined,    // SAYISAL
        current: current !== undefined ? Number(current) : undefined,    // SAYISAL
        phase: phase !== undefined ? Number(phase) : undefined,          // SAYISAL
        manufacturer,
        modelNo,
        year: year !== undefined ? Number(year) : undefined,
        rpm: rpm !== undefined ? Number(rpm) : undefined,
        protection,
        connectionType,
        lastService: lastService ? new Date(lastService) : undefined,
        nextService: nextService ? new Date(nextService) : undefined,
        isActive: typeof isActive === "boolean" ? isActive : true,
        qrCode,
        imageUrl,
        notes
      }
    });
    res.status(201).json(newMotor);
  } catch (err: any) {
    res.status(500).json({ error: "Motor eklenemedi", detail: err.message });
  }
});

// Motoru sil
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.motor.delete({ where: { id: Number(id) } });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Motor bulunamadı" });
  }
});

// Motor güncelle
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const {
    serial,
    name,
    tag,
    description,
    status,
    location,
    powerKW,
    voltage,
    current,
    phase,
    manufacturer,
    modelNo,
    year,
    rpm,
    protection,
    connectionType,
    lastService,
    nextService,
    isActive,
    qrCode,
    imageUrl,
    notes
  } = req.body;

  try {
    const updated = await prisma.motor.update({
      where: { id: Number(id) },
      data: {
        serial,
        name,
        tag,
        description,
        status,
        location,
        powerKW: powerKW !== undefined ? Number(powerKW) : undefined,
        voltage: voltage !== undefined ? Number(voltage) : undefined,    // SAYISAL
        current: current !== undefined ? Number(current) : undefined,    // SAYISAL
        phase: phase !== undefined ? Number(phase) : undefined,          // SAYISAL
        manufacturer,
        modelNo,
        year: year !== undefined ? Number(year) : undefined,
        rpm: rpm !== undefined ? Number(rpm) : undefined,
        protection,
        connectionType,
        lastService: lastService ? new Date(lastService) : undefined,
        nextService: nextService ? new Date(nextService) : undefined,
        isActive: typeof isActive === "boolean" ? isActive : true,
        qrCode,
        imageUrl,
        notes
      }
    });
    res.json(updated);
  } catch (err) {
    res.status(404).json({ error: "Motor bulunamadı" });
  }
});

export default router;
