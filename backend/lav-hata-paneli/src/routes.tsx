import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Motors from "./pages/Motors";
import MotorDetail from "./pages/MotorDetail";
import GeneralFaultsBook from "./pages/GeneralFaultsBook";
import FaultDowntimeDashboard from "./pages/FaultDowntimeDashboard";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import AppLayout from "./components/AppLayout";

// === EKLEDİKLERİNİ BURAYA İMPORT ET ===
import ControlDevices from "./pages/ControlDevices";
import ControlDeviceDetail from "./pages/ControlDeviceDetail";

// === STOCK SAYFALARI ===
import Stocks from "./pages/Stocks";
import StockDetail from "./pages/StockDetail";

const ProtectedRoutes = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const AppRoutes = () => {
  const token = localStorage.getItem("token");
  return (
    <Routes>
      {/* Login ve Register ekranları herkese açık */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Korumalı Alanlar (token varsa) */}
      {token ? (
        <Route path="/*" element={<ProtectedRoutes />}>
          <Route path="" element={<Dashboard />} />
          <Route path="equipment" element={<Equipment />} />
          <Route path="equipment/motors" element={<Motors />} />
          <Route path="equipment/motors/:id" element={<MotorDetail />} />
          {/* ----------- YENİ SÜRÜCÜ/CONTROL DEVICE ROUTE'LARI ----------- */}
          <Route path="equipment/control-devices" element={<ControlDevices />} />
          <Route path="equipment/control-devices/:id" element={<ControlDeviceDetail />} />
          {/* ---------------------------------------------------------- */}
          <Route path="general-faults" element={<GeneralFaultsBook />} />
          <Route path="downtimes" element={<FaultDowntimeDashboard />} />
          <Route path="users" element={<Users />} />
          <Route path="settings" element={<Profile />} />
          <Route path="admin" element={<AdminPanel />} />

          {/* ======= STOCK ROUTES ======= */}
          <Route path="stocks" element={<Stocks />} />
          <Route path="stock/:id" element={<StockDetail />} />
          {/* ============================ */}

          <Route path="*" element={<Navigate to="/" />} />
        </Route>
      ) : (
        // Token yoksa, tüm korumalı sayfalarda login'e at
        <Route path="*" element={<Navigate to="/login" />} />
      )}
    </Routes>
  );
};

export default AppRoutes;
