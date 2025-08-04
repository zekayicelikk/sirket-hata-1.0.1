import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateToken } from "./middleware/auth";

const router = Router();
const prisma = new PrismaClient();

// Tüm logları listele (son 100 veya filtreli olabilir)
router.get("/", authenticateToken, async (req, res) => {
  try {
    const logs = await prisma.actionLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: {
        user: {
          select: { id: true, email: true }
        },
        generalFault: {
          select: { id: true, description: true }
        }
      }
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: "Loglar getirilemedi" });
  }
});

export default router;
