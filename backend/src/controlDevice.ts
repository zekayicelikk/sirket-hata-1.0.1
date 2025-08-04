import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

const prisma = new PrismaClient();
const router = Router();

/**
 * GET /api/control-devices
 * Tüm cihazları getir (motor dahil)
 */
router.get("/", authenticateToken, async (req, res) => {
  try {
    const devices = await prisma.controlDevice.findMany({
      include: { motor: true }
    });
    res.json(devices);
  } catch (err) {
    res.status(500).json({ error: "Cihazlar getirilemedi", detail: String(err) });
  }
});

/**
 * GET /api/control-devices/:id
 * Tek cihaz getir
 */
router.get("/:id", authenticateToken, async (req, res) => {
  try {
    const device = await prisma.controlDevice.findUnique({
      where: { id: Number(req.params.id) },
      include: { motor: true }
    });
    if (!device) return res.status(404).json({ error: "Cihaz bulunamadı" });
    res.json(device);
  } catch (err) {
    res.status(500).json({ error: "Cihaz getirilemedi", detail: String(err) });
  }
});

/**
 * POST /api/control-devices
 * Yeni cihaz ekle
 */
router.post("/", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      type, serial, brand, model, powerKW, voltage, status, isSpare,
      activeMotorId, spareForMotors, location, protection, commProtocol,
      controlType, firmware, rampUpTime, rampDownTime, bypassContact, year,
      lastService, nextService, notes, imageUrl, qrCode
    } = req.body;

    const created = await prisma.controlDevice.create({
      data: {
        type,
        serial,
        brand,
        model,
        powerKW: Number(powerKW),
        voltage: Number(voltage),
        status,
        isSpare: !!isSpare,
        activeMotorId: activeMotorId ? Number(activeMotorId) : undefined,
        spareForMotors,
        location,
        protection,
        commProtocol,
        controlType,
        firmware,
        rampUpTime: rampUpTime ? Number(rampUpTime) : undefined,
        rampDownTime: rampDownTime ? Number(rampDownTime) : undefined,
        bypassContact,
        year: year ? Number(year) : undefined,
        lastService: lastService ? new Date(lastService) : undefined,
        nextService: nextService ? new Date(nextService) : undefined,
        notes,
        imageUrl,
        qrCode
      }
    });
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ error: "Cihaz eklenemedi", detail: err.message });
  }
});

/**
 * PUT /api/control-devices/:id
 * Cihaz güncelle
 */
router.put("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      type, serial, brand, model, powerKW, voltage, status, isSpare,
      activeMotorId, spareForMotors, location, protection, commProtocol,
      controlType, firmware, rampUpTime, rampDownTime, bypassContact, year,
      lastService, nextService, notes, imageUrl, qrCode
    } = req.body;

    const updated = await prisma.controlDevice.update({
      where: { id: Number(req.params.id) },
      data: {
        type,
        serial,
        brand,
        model,
        powerKW: Number(powerKW),
        voltage: Number(voltage),
        status,
        isSpare: !!isSpare,
        activeMotorId: activeMotorId ? Number(activeMotorId) : undefined,
        spareForMotors,
        location,
        protection,
        commProtocol,
        controlType,
        firmware,
        rampUpTime: rampUpTime ? Number(rampUpTime) : undefined,
        rampDownTime: rampDownTime ? Number(rampDownTime) : undefined,
        bypassContact,
        year: year ? Number(year) : undefined,
        lastService: lastService ? new Date(lastService) : undefined,
        nextService: nextService ? new Date(nextService) : undefined,
        notes,
        imageUrl,
        qrCode
      }
    });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ error: "Cihaz güncellenemedi", detail: err.message });
  }
});

/**
 * DELETE /api/control-devices/:id
 * Cihaz sil
 */
router.delete("/:id", authenticateToken, requireAdmin, async (req, res) => {
  try {
    await prisma.controlDevice.delete({
      where: { id: Number(req.params.id) }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(404).json({ error: "Cihaz bulunamadı" });
  }
});

export default router;
