import React from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Equipment from "./pages/Equipment";
import Motors from "./pages/Motors";
import MotorDetail from "./pages/MotorDetail";
import GeneralFaultsBook from "./pages/GeneralFaultsBook"; // YENİ, bunu ekle
import FaultDowntimeDashboard from "./pages/FaultDowntimeDashboard"; // YENİ, ekle!
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import AdminPanel from "./pages/AdminPanel";
import AppLayout from "./components/AppLayout";

// Korumalı alanlar için bir component
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
        {/* Giriş ve Kayıt ekranları herkese açık */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Protected (korumalı) alanlar */}
        {token ? (
          <Route path="/*" element={<ProtectedRoutes />}>
            <Route path="" element={<Dashboard />} />
            <Route path="equipment" element={<Equipment />} />
            <Route path="equipment/motors" element={<Motors />} />
            <Route path="equipment/motors/:id" element={<MotorDetail />} />
            <Route path="general-faults" element={<GeneralFaultsBook />} />
            <Route path="downtimes" element={<FaultDowntimeDashboard />} /> {/* YENİ */}
            <Route path="users" element={<Users />} />
            <Route path="settings" element={<Profile />} />
            <Route path="admin" element={<AdminPanel />} />
            {/* Tanımsız url'de ana sayfaya */}
            <Route path="*" element={<Navigate to="/" />} />
          </Route>
        ) : (
          // Eğer token yoksa, protected url'lerde login'e at!
          <Route path="*" element={<Navigate to="/login" />} />
        )}
      </Routes>
    </BrowserRouter>
  );
};

export default App;
