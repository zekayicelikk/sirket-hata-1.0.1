import React, { useEffect, useState } from "react";
import {
  Row, Col, Card, Statistic, Typography, List, Table, Alert, Spin,
} from "antd";
import {
  ThunderboltOutlined, UserOutlined, ApiOutlined, ClockCircleOutlined,
} from "@ant-design/icons";

const { Title, Text } = Typography;

//! Kendi backend API adresini buraya yaz (gerekirse portunu değiştir)
const API_BASE = "http://localhost:5000";

const Dashboard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [motors, setMotors] = useState<any[]>([]);
  const [recentFaults, setRecentFaults] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<number>(0); // Şimdilik 0, ileride ekleyebilirsin
  const [transformers, setTransformers] = useState<number>(0); // Şimdilik 0
  const [lunchMenu] = useState(["Mercimek Çorbası", "Tavuk Sote", "Pilav", "Ayran"]);
  const [shifters] = useState(["Ahmet Yılmaz", "Ayşe Demir", "Fatih Öz"]);

  const time = new Date().toLocaleString();

  // --- Backend'den veri çek ---
  useEffect(() => {
    setLoading(true);
    setError("");
    const token = localStorage.getItem("token");

    Promise.all([
      fetch(`${API_BASE}/motors`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json()),
      fetch(`${API_BASE}/records/my`, {
        headers: { Authorization: `Bearer ${token}` }
      }).then(r => r.json())
    ])
      .then(([motorsData, faultsData]) => {
        if (!Array.isArray(motorsData)) throw new Error("Motor verisi alınamadı");
        setMotors(motorsData);

        // Son 5 arıza kaydı (eğer adminsen /records kullanabilirsin, yoksa sadece kendi kayıtların)
        setRecentFaults(
          Array.isArray(faultsData)
            ? faultsData.slice(0, 5)
            : []
        );
      })
      .catch(err => {
        setError("Dashboard verisi yüklenemedi.");
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div
      style={{
        maxWidth: 1320,
        margin: "0 auto",
        padding: "32px 0 64px 0",
        background: "#f6f8fa",
        minHeight: "100vh",
      }}
    >
      <div style={{ marginBottom: 40 }}>
        <Title level={2} style={{ marginBottom: 0 }}>Kontrol Paneli</Title>
        <Text type="secondary">
          <ClockCircleOutlined /> {time}
        </Text>
      </div>

      {error && (
        <Alert
          message={error}
          type="error"
          showIcon
          style={{ marginBottom: 24 }}
        />
      )}

      {loading ? (
        <Spin size="large" style={{ margin: "80px auto", display: "block" }} />
      ) : (
        <>
          <Row gutter={24} style={{ marginBottom: 48 }}>
            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  boxShadow: "0 4px 24px rgba(76,0,62,0.08)",
                  background: "linear-gradient(135deg,#e8e0f6,#ac47a4 80%)",
                }}
              >
                <Statistic
                  title={<Text style={{ color: "#fff", fontWeight: 600 }}>Toplam Motor</Text>}
                  value={motors.length}
                  prefix={<ThunderboltOutlined style={{ color: "#fff" }} />}
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 38 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  boxShadow: "0 4px 24px rgba(76,0,62,0.08)",
                  background: "linear-gradient(135deg,#eceff7,#7e57c2 90%)",
                }}
              >
                <Statistic
                  title={<Text style={{ color: "#fff", fontWeight: 600 }}>Toplam Sürücü</Text>}
                  value={drivers}
                  prefix={<UserOutlined style={{ color: "#fff" }} />}
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 38 }}
                />
              </Card>
            </Col>
            <Col xs={24} sm={8}>
              <Card
                bordered={false}
                style={{
                  borderRadius: 18,
                  boxShadow: "0 4px 24px rgba(76,0,62,0.08)",
                  background: "linear-gradient(135deg,#ffe4ed,#ff7eb3 85%)",
                }}
              >
                <Statistic
                  title={<Text style={{ color: "#fff", fontWeight: 600 }}>Toplam Trafo</Text>}
                  value={transformers}
                  prefix={<ApiOutlined style={{ color: "#fff" }} />}
                  valueStyle={{ color: "#fff", fontWeight: 700, fontSize: 38 }}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={24}>
            <Col xs={24} md={7}>
              <Card
                title="Yemek Menüsü"
                bordered={false}
                style={{
                  borderRadius: 16,
                  marginBottom: 28,
                  boxShadow: "0 4px 18px #ac47a41a",
                  minHeight: 210,
                }}
              >
                <List
                  dataSource={lunchMenu}
                  renderItem={(item) => (
                    <List.Item style={{ padding: 8, fontWeight: 500 }}>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
              <Card
                title="Bugünkü Vardiyadakiler"
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 18px #ac47a41a",
                  minHeight: 210,
                }}
              >
                <List
                  dataSource={shifters}
                  renderItem={(item) => (
                    <List.Item style={{ padding: 8, fontWeight: 500 }}>
                      {item}
                    </List.Item>
                  )}
                />
              </Card>
            </Col>
            <Col xs={24} md={17}>
              <Card
                title="Son 5 Arıza Kaydı"
                bordered={false}
                style={{
                  borderRadius: 16,
                  boxShadow: "0 4px 18px #ac47a41a",
                  minHeight: 448,
                }}
              >
                <Table
                  dataSource={recentFaults}
                  rowKey="id"
                  pagination={false}
                  columns={[
                    { title: 'ID', dataIndex: 'id', width: 60 },
                    { title: 'Motor', dataIndex: 'motor', render: (val: any, row: any) => row.motor?.name || val },
                    { title: 'Arıza Tipi', dataIndex: 'faultType', render: (val: any, row: any) => row.faultType?.name || val },
                    { title: 'Tarih', dataIndex: 'date', render: (date: any) => date ? new Date(date).toLocaleString() : "-" },
                  ]}
                  locale={{
                    emptyText: "Kayıt bulunamadı",
                  }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  );
};

export default Dashboard;
