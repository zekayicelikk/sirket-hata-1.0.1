import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRouter from "./auth";
import motorRouter from "./motor";
import faultTypeRouter from "./faultType";
import recordRouter from "./records";
import userRouter from "./users";
import announcementRouter from "./announcement";
import generalFaultRouter from "./generalFault"; // BUNU EKLE

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// ROUTERLARIN HEPSİNİ /api ALTINDA KULLAN!
app.use("/api/auth", authRouter);
app.use("/api/motors", motorRouter);
app.use("/api/fault-types", faultTypeRouter);
app.use("/api/records", recordRouter);
app.use("/api/users", userRouter);
app.use("/api/announcements", announcementRouter);
app.use("/api/general-faults", generalFaultRouter); // BUNU EKLE

app.get("/health", (req, res) => {
  res.json({ status: "ok", app: "sirket-hata-2" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
