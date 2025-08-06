import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
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
import ControlDevices from "./pages/ControlDevices";
import ControlDeviceDetail from "./pages/ControlDeviceDetail";
import Stocks from "./pages/Stocks";                 // <-- EKLENDİ
import StockDetail from "./pages/StockDetail";       // <-- EKLENDİ
import "./App.css";

const ProtectedRoutes = () => (
  <AppLayout>
    <Outlet />
  </AppLayout>
);

const App: React.FC = () => {
  const token = localStorage.getItem("token");

  return (
    <BrowserRouter>
      <Routes>
        {/* Giriş ve Kayıt ekranları */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected (korumalı) alanlar */}
        {token ? (
          <Route path="/*" element={<ProtectedRoutes />}>
            <Route path="" element={<Dashboard />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="equipment/motors" element={<Motors />} />
            <Route path="equipment/motors/:id" element={<MotorDetail />} />
            {/* ---- KONTROL CİHAZLARI ROUTE'LARI ---- */}
            <Route path="equipment/control-devices" element={<ControlDevices />} />
            <Route path="equipment/control-devices/:id" element={<ControlDeviceDetail />} />
            {/* -------------------------------------- */}
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
          // Token yoksa login ekranına yönlendir
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
