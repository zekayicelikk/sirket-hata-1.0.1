import React, { useEffect, useState } from "react";
import {
  Row, Col, Card, List, Avatar, Statistic, Typography, Empty, Skeleton, Tooltip, Divider, Button, Space, Table, Tag
} from "antd";
import {
  ThunderboltOutlined, ExclamationCircleOutlined, PauseCircleOutlined,
  UserOutlined, LineChartOutlined, StarOutlined, ReloadOutlined,
} from "@ant-design/icons";
import { Line, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, BarElement
} from "chart.js";
import moment from "moment";
import axios from "axios";
import Modal from "antd/es/modal/Modal";

ChartJS.register(
  ArcElement, ChartTooltip, Legend, LineElement, CategoryScale, LinearScale, PointElement, BarElement
);

const { Title, Text } = Typography;
moment.locale("tr");

const API = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const token = localStorage.getItem("token");

const fetcher = async (url: string) => {
  const { data } = await axios.get(API + url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  return data;
};

const Dashboard = () => {
  const [username, setUsername] = useState("");
  const [clock, setClock] = useState("");
  const [motors, setMotors] = useState<any[]>([]);
  const [motorFaults, setMotorFaults] = useState<any[]>([]);
  const [generalFaults, setGeneralFaults] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [faultTypes, setFaultTypes] = useState<any[]>([]);
  const [lines, setLines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [zoomChart, setZoomChart] = useState<"trend" | "lines" | null>(null);

  useEffect(() => {
    const tick = () => setClock(moment().format("DD MMMM YYYY dddd – HH:mm:ss"));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchAll = async () => {
    setRefreshing(true);
    try {
      const userRes = await fetcher("/users/me");
      setUsername(userRes?.firstName || userRes?.name || userRes?.username || "");
      const [
        motorsData, motorFaultsData, generalFaultsData, usersData, faultTypesData, linesData
      ] = await Promise.all([
        fetcher("/motors"),
        fetcher("/records?type=fault"),
        fetcher("/general-faults"),
        fetcher("/users"),
        fetcher("/fault-types"),
        fetcher("/production-lines"),
      ]);
      setMotors(motorsData);
      setMotorFaults(motorFaultsData);
      setGeneralFaults(generalFaultsData);
      setUsers(usersData);
      setFaultTypes(faultTypesData);
      setLines(linesData);
    } catch (error) {
      setUsername("");
      setMotors([]);
      setMotorFaults([]);
      setGeneralFaults([]);
      setUsers([]);
      setFaultTypes([]);
      setLines([]);
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  // KPI Calculations
  const todayStr = moment().format("YYYY-MM-DD");
  const todayMotorFaults = motorFaults.filter((r) =>
    moment(r.createdAt).format("YYYY-MM-DD") === todayStr
  );
  let todayStops = 0;
  const todayGeneralFaults = generalFaults.filter((r) => {
    const isToday = moment(r.createdAt).format("YYYY-MM-DD") === todayStr;
    if (isToday && Array.isArray(r.lines)) {
      r.lines.forEach((line: { downtimeMin: number; }) => {
        if (line.downtimeMin && line.downtimeMin > 0) todayStops += 1;
      });
    }
    return isToday;
  });

  // --- ANALİZ TABLOLARI HAZIRLIK ---

  // Son 5 motor arızası (Motor Arızası: motorFaults)
  const last5MotorFaults = motorFaults
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  // Son 5 genel arıza (GeneralFault: generalFaults)
  const last5GeneralFaults = generalFaults
    .slice()
    .sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt))
    .slice(0, 5);

  // Son 5 duruş (hat duruşları: generalFaults içinde lines downtimeMin > 0 olanlar)
  let allStops: any[] = [];
  generalFaults.forEach((fault) => {
    if (Array.isArray(fault.lines)) {
      fault.lines.forEach((l: any) => {
        if (l.downtimeMin && l.downtimeMin > 0) {
          allStops.push({
            faultId: fault.id,
            description: fault.description,
            line: l.line,
            downtimeMin: l.downtimeMin,
            date: fault.date || fault.createdAt,
            productionImpact: fault.productionImpact,
            location: fault.location,
          });
        }
      });
    }
  });
  allStops = allStops.sort((a, b) => +new Date(b.date) - +new Date(a.date)).slice(0, 5);

  // En çok arıza ekleyen 3 kullanıcı (motorFaults içinde userId'ye göre say)
  const userFaultCounts: Record<string, { id: any, name: string, count: number }> = {};
  motorFaults.forEach((f) => {
    if (f.user && f.user.id) {
      const key = f.user.id;
      const name = f.user.firstName || f.user.username || f.user.email || "-";
      if (!userFaultCounts[key]) userFaultCounts[key] = { id: key, name, count: 0 };
      userFaultCounts[key].count += 1;
    }
  });
  const top3Users = Object.values(userFaultCounts).sort((a, b) => b.count - a.count).slice(0, 3);

  // En çok arıza veren 3 motor
  const motorFaultCounts: Record<string, { id: any, name: string, count: number }> = {};
  motorFaults.forEach((f) => {
    if (f.motor && f.motor.id) {
      const key = f.motor.id;
      const name = f.motor.name || f.motor.serial || "-";
      if (!motorFaultCounts[key]) motorFaultCounts[key] = { id: key, name, count: 0 };
      motorFaultCounts[key].count += 1;
    }
  });
  const top3Motors = Object.values(motorFaultCounts).sort((a, b) => b.count - a.count).slice(0, 3);

  // En çok gerçekleşen 3 motor arızası (tipine göre)
  const typeFaultCounts: Record<string, { id: any, name: string, count: number }> = {};
  motorFaults.forEach((f) => {
    if (f.faultType && f.faultType.id) {
      const key = f.faultType.id;
      const name = f.faultType.name || "-";
      if (!typeFaultCounts[key]) typeFaultCounts[key] = { id: key, name, count: 0 };
      typeFaultCounts[key].count += 1;
    }
  });
  const top3FaultTypes = Object.values(typeFaultCounts).sort((a, b) => b.count - a.count).slice(0, 3);

  // Trend Chart
  const dailyTrend: Record<string, number> = {};
  motorFaults.forEach((r) => {
    const day = moment(r.createdAt).format("YYYY-MM-DD");
    dailyTrend[day] = (dailyTrend[day] || 0) + 1;
  });
  const trendData = {
    labels: Object.keys(dailyTrend).sort(),
    datasets: [{
      label: "Motor Arıza Sayısı",
      data: Object.values(dailyTrend),
      fill: true,
      borderColor: "#1e5bbf",
      backgroundColor: "rgba(30,91,191,0.13)",
      tension: 0.18,
      pointRadius: 3,
      pointBackgroundColor: "#1e5bbf"
    }]
  };

  // Hat bazlı duruş analizi
  const lineStopCount: Record<string, { name: string, count: number }> = {};
  generalFaults.forEach((fault) => {
    if (Array.isArray(fault.lines)) {
      fault.lines.forEach((l: any) => {
        if (l.line && (l.line.name || l.line.code)) {
          const key = l.line.id;
          if (!lineStopCount[key]) lineStopCount[key] = { name: l.line.name || l.line.code, count: 0 };
          if (l.downtimeMin && l.downtimeMin > 0) lineStopCount[key].count += 1;
        }
      });
    }
  });
  const topFaultLines = Object.values(lineStopCount)
    .sort((a, b) => b.count - a.count)
    .slice(0, 7);

  const linesBarData = {
    labels: topFaultLines.map(x => x.name),
    datasets: [{
      label: "Duruş/Arıza Kaydı",
      data: topFaultLines.map(x => x.count),
      backgroundColor: "#fbbf24"
    }]
  };

  if (loading) {
    return (
      <div style={{ padding: 40, background: "#f0f2f5" }}>
        <Skeleton active paragraph={{ rows: 18 }} />
      </div>
    );
  }

  // TABLOLAR (Ant Design Table)
  const motorFaultColumns = [
    { title: "Motor", dataIndex: ["motor", "name"], key: "motor", render: (v: string) => <b>{v}</b>, width: 120 },
    { title: "Tipi", dataIndex: ["faultType", "name"], key: "type", width: 130 },
    { title: "Açıklama", dataIndex: "desc", key: "desc", width: 230, ellipsis: true },
    { title: "Kullanıcı", dataIndex: ["user", "firstName"], key: "user", render: (v: string, rec: any) => <span>{v || rec.user?.email}</span>, width: 130 },
    { title: "Tarih", dataIndex: "createdAt", key: "date", render: (v: string) => moment(v).format("DD.MM.YYYY HH:mm"), width: 130 },
  ];
  const generalFaultColumns = [
    { title: "Lokasyon", dataIndex: "location", key: "loc", width: 100 },
    { title: "Açıklama", dataIndex: "description", key: "desc", width: 200, ellipsis: true },
    { title: "Etkisi", dataIndex: "productionImpact", key: "impact", render: (v: boolean) => v ? <Tag color="red">Etkiledi</Tag> : <Tag color="green">Etkilemedi</Tag>, width: 90 },
    { title: "Hat(lar)", dataIndex: "lines", key: "lines", render: (lines: any[]) => <>{lines?.map((l, i) => <Tag key={i}>{l.line.code}</Tag>)}</>, width: 130 },
    { title: "Tarih", dataIndex: "createdAt", key: "date", render: (v: string) => moment(v).format("DD.MM.YYYY HH:mm"), width: 130 },
  ];
  const stopsColumns = [
    { title: "Hat", dataIndex: ["line", "code"], key: "line", width: 80 },
    { title: "Açıklama", dataIndex: "description", key: "desc", width: 200, ellipsis: true },
    { title: "Duruş (dk)", dataIndex: "downtimeMin", key: "dt", width: 90, align: "center" as any },
    { title: "Etki", dataIndex: "productionImpact", key: "impact", render: (v: boolean) => v ? <Tag color="red">Etkiledi</Tag> : <Tag color="green">Etkilemedi</Tag>, width: 90 },
    { title: "Tarih", dataIndex: "date", key: "date", render: (v: string) => moment(v).format("DD.MM.YYYY HH:mm"), width: 130 },
  ];

  return (
    <div style={{
      minHeight: "100vh",
      background: "linear-gradient(120deg, #e0eafc 80%, #f8fafc 100%)",
      padding: "0 20px",
      fontFamily: "Inter, 'Segoe UI', Arial, sans-serif",
    }}>
      {/* HEADER */}
      <Row justify="center" align="middle" style={{ minHeight: 120, padding: "20px 0" }}>
        <Col span={24} style={{ textAlign: "center" }}>
          <Title level={2} style={{
            fontWeight: 900, color: "#1e5bbf",
            letterSpacing: 0.6, marginBottom: 8, textShadow: "0 1px 0 #fff"
          }}>
            {moment().hour() < 12 ? "Günaydın" : moment().hour() < 18 ? "İyi Günler" : "İyi Akşamlar"}, {username }!
          </Title>
          <Text style={{ fontSize: 16, color: "#656c8a", fontWeight: 500 }}>
            {clock}
            <Tooltip title="Verileri Yenile">
              <Button
                shape="circle"
                size="small"
                icon={<ReloadOutlined />}
                onClick={fetchAll}
                loading={refreshing}
                style={{ marginLeft: 15, background: "#fff", boxShadow: "0 2px 8px rgba(221, 230, 241, 0.5)", borderColor: "#e0e7ee" }}
              />
            </Tooltip>
          </Text>
        </Col>
      </Row>

      {/* KPI CARDS */}
      <Row gutter={[24, 24]} style={{ marginBottom: 12 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{
            borderRadius: 20,
            minHeight: 110,
            background: "linear-gradient(100deg, #1856e6 70%, #bcdffb 100%)",
            boxShadow: "0 4px 18px 0 rgba(43, 77, 144, 0.09)",
            textAlign: "center"
          }}
            bodyStyle={{ padding: 25, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <ThunderboltOutlined style={{ fontSize: 36, color: "#fff" }} />
            <Statistic title={<span style={{ color: "#dbeafe", fontSize: 14 }}>Bugünkü Motor Arızası</span>}
              value={todayMotorFaults.length}
              valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{
            borderRadius: 20,
            minHeight: 110,
            background: "linear-gradient(100deg, #fbbf24 60%, #fef9c3 100%)",
            boxShadow: "0 4px 18px 0 rgba(251, 191, 36, 0.09)",
            textAlign: "center"
          }}
            bodyStyle={{ padding: 25, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <ExclamationCircleOutlined style={{ fontSize: 36, color: "#fff7cb" }} />
            <Statistic title={<span style={{ color: "#fffde7", fontSize: 14 }}>Bugünkü Genel Arıza</span>}
              value={todayGeneralFaults.length}
              valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 800 }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{
            borderRadius: 20,
            minHeight: 110,
            background: "linear-gradient(100deg, #24bfbf 60%, #b8fff7 100%)",
            boxShadow: "0 4px 18px 0 rgba(36,191,191,0.09)",
            textAlign: "center"
          }}
            bodyStyle={{ padding: 25, display: "flex", alignItems: "center", justifyContent: "center", gap: 16 }}
          >
            <PauseCircleOutlined style={{ fontSize: 36, color: "#fff" }} />
            <Statistic title={<span style={{ color: "#e0f7fa", fontSize: 14 }}>Bugünkü Duruş</span>}
              value={todayStops}
              valueStyle={{ color: "#fff", fontSize: 32, fontWeight: 800 }} />
          </Card>
        </Col>
      </Row>

      {/* TABLO & CHARTLAR BLOĞU */}
      <Row gutter={[24, 32]} style={{ marginTop: 5 }}>
        {/* Sol: 3 tablo üst üste */}
        <Col xs={24} md={14}>
          <Row gutter={[0, 22]}>
            <Col span={24}>
              <Card
                title={<><ThunderboltOutlined /> Son 5 Motor Arızası</>}
                style={{ borderRadius: 20, boxShadow: "0 2px 8px #e5edfa" }}
                bodyStyle={{ padding: "13px 18px" }}
              >
                <Table
                  dataSource={last5MotorFaults}
                  columns={motorFaultColumns}
                  size="small"
                  bordered
                  pagination={false}
                  rowKey="id"
                  scroll={{ x: 720 }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card
                title={<><ExclamationCircleOutlined /> Son 5 Genel Arıza</>}
                style={{ borderRadius: 20, boxShadow: "0 2px 8px #f6e9ef" }}
                bodyStyle={{ padding: "13px 18px" }}
              >
                <Table
                  dataSource={last5GeneralFaults}
                  columns={generalFaultColumns}
                  size="small"
                  bordered
                  pagination={false}
                  rowKey="id"
                  scroll={{ x: 700 }}
                />
              </Card>
            </Col>
            <Col span={24}>
              <Card
                title={<><PauseCircleOutlined /> Son 5 Duruş</>}
                style={{ borderRadius: 20, boxShadow: "0 2px 8px #c6f6f6" }}
                bodyStyle={{ padding: "13px 18px" }}
              >
                <Table
                  dataSource={allStops}
                  columns={stopsColumns}
                  size="small"
                  bordered
                  pagination={false}
                  rowKey={(r) => r.faultId + "-" + r.line?.id}
                  scroll={{ x: 570 }}
                />
              </Card>
            </Col>
          </Row>
        </Col>
        {/* Sağ: 3 analiz kutusu + 2 chart */}
        <Col xs={24} md={10}>
          <Card
            title={<span><UserOutlined /> En Çok Arıza Ekleyen 3 Kullanıcı</span>}
            style={{ marginBottom: 16, borderRadius: 20, boxShadow: "0 2px 8px #e4f1fa" }}
            bodyStyle={{ padding: "13px 18px" }}
          >
            <List
              dataSource={top3Users}
              renderItem={(u, idx) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ background: "#f0e1ff", color: "#6f42c1" }} icon={<UserOutlined />} />}
                    title={<Text strong>{u.name}</Text>}
                    description={<Text>Arıza Kaydı: <b style={{ color: "#a13aff" }}>{u.count}</b></Text>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: "Kullanıcı yok" }}
            />
          </Card>
          <Card
            title={<span><StarOutlined /> En Çok Arıza Veren 3 Motor</span>}
            style={{ marginBottom: 16, borderRadius: 20, boxShadow: "0 2px 8px #f9e8e3" }}
            bodyStyle={{ padding: "13px 18px" }}
          >
            <List
              dataSource={top3Motors}
              renderItem={(m, idx) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ background: "#ffe4e1", color: "#e04b38" }} icon={<ThunderboltOutlined />} />}
                    title={<Text strong>{m.name}</Text>}
                    description={<Text>Arıza Sayısı: <b style={{ color: "#e04b38" }}>{m.count}</b></Text>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: "Motor yok" }}
            />
          </Card>
          <Card
            title={<span><LineChartOutlined /> En Çok Gerçekleşen 3 Motor Arızası</span>}
            style={{ marginBottom: 16, borderRadius: 20, boxShadow: "0 2px 8px #e1fff3" }}
            bodyStyle={{ padding: "13px 18px" }}
          >
            <List
              dataSource={top3FaultTypes}
              renderItem={(t, idx) => (
                <List.Item>
                  <List.Item.Meta
                    avatar={<Avatar style={{ background: "#e0ffe1", color: "#219a6e" }} icon={<LineChartOutlined />} />}
                    title={<Text strong>{t.name}</Text>}
                    description={<Text>Görülme: <b style={{ color: "#219a6e" }}>{t.count}</b></Text>}
                  />
                </List.Item>
              )}
              locale={{ emptyText: "Arıza tipi yok" }}
            />
          </Card>
          <Card
            title={<span><PauseCircleOutlined /> En Çok Duruş Yaşayan Hatlar</span>}
            style={{ marginBottom: 20, borderRadius: 20, boxShadow: "0 2px 8px #f7fbe9" }}
            bodyStyle={{ padding: "13px 10px" }}
            extra={<a onClick={() => setZoomChart("lines")}>Büyüt</a>}
          >
            <Bar data={linesBarData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { display: true, grid: { display: false } },
                y: { display: true, beginAtZero: true, grid: { color: "#e0e0e0" } }
              }
            }}  />
          </Card>
          <Card
            title={<span><ThunderboltOutlined /> Motor Arıza Trend</span>}
            style={{ borderRadius: 20, boxShadow: "0 2px 8px #f5f8fa" }}
            bodyStyle={{ padding: "13px 12px" }}
            extra={<a onClick={() => setZoomChart("trend")}>Büyüt</a>}
          >
            <Line data={trendData} options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: { legend: { display: false } },
              scales: {
                x: { display: true, grid: { display: false } },
                y: { display: true, beginAtZero: true, grid: { color: "#e0e0e0" } }
              }
            }}  />
          </Card>
        </Col>
      </Row>
      <Divider dashed style={{ margin: "24px 0 12px 0" }} />
      {/* Footer */}
      <div style={{
        textAlign: "center", margin: "36px 0 0 0",
        color: "#adb7ca", fontSize: 13, letterSpacing: 0.4
      }}>
        {new Date().getFullYear()} &nbsp;|&nbsp; {username }
      </div>
      {/* --- ZOOM MODAL --- */}
      <Modal
        open={!!zoomChart}
        footer={null}
        onCancel={() => setZoomChart(null)}
        width={zoomChart === "lines" ? 600 : 750}
        bodyStyle={{ padding: 24 }}
        centered
        destroyOnClose
      >
        {zoomChart === "trend" ? (
          <Line data={trendData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, grid: { display: false } },
              y: { display: true, beginAtZero: true, grid: { color: "#e0e0e0" } }
            }
          }}  />
        ) : zoomChart === "lines" ? (
          <Bar data={linesBarData} options={{
            responsive: true,
            maintainAspectRatio: false,
            plugins: { legend: { display: false } },
            scales: {
              x: { display: true, grid: { display: false } },
              y: { display: true, beginAtZero: true, grid: { color: "#e0e0e0" } }
            }
          }}  />
        ) : null}
      </Modal>
    </div>
  );
};

export default Dashboard;