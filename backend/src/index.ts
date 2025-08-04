import express from "express";
import cors from "cors";
import dotenv from "dotenv";

// ROUTERLARI İMPORT ET
import authRouter from "./auth";
import motorRouter from "./motor";
import faultTypeRouter from "./faultType";
import recordRouter from "./records";
import userRouter from "./users";
import announcementRouter from "./announcement";
import generalFaultRouter from "./generalFault";
import productionLineRouter from "./productionLine"; 
import controlDeviceRouter from "./controlDevice";
import actionLogRouter from "./actionLog";
dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

// === ROUTERLARI /api ALTINDA KULLAN ===
app.use("/api/auth", authRouter);
app.use("/api/motors", motorRouter);
app.use("/api/fault-types", faultTypeRouter);
app.use("/api/records", recordRouter);
app.use("/api/users", userRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/general-faults", generalFaultRouter);
app.use("/api/control-devices", controlDeviceRouter);
app.use("/api/production-lines", productionLineRouter); // HAT CRUD/LIST
app.use("/api/action-logs", actionLogRouter);
// Basit sağlık kontrol endpoint'i
app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "sirket-hata-2" });
});

// 404 fallback
app.use((req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

// Global hata yakalayıcı middleware (isteğe bağlı, enterprise seviye için önerilir)
/*
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});
*/

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
