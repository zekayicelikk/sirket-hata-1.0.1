import React from "react";
import { Row, Col, Card, Typography } from "antd";
import { DeploymentUnitOutlined, PoweroffOutlined } from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title } = Typography;

// Modern motor SVG ikonu (LAV ve Şişecam paletlerinde)
const MotorSVG = (
  <svg width="54" height="54" viewBox="0 0 52 52" fill="none">
    <rect x="6" y="16" width="40" height="20" rx="7" fill="#b184c8"/>
    <rect x="14" y="20" width="24" height="12" rx="4" fill="#fff"/>
    <circle cx="44" cy="26" r="4.5" fill="#ac47a4" stroke="#fff" strokeWidth="2"/>
    <rect x="2" y="22" width="6" height="8" rx="2.5" fill="#ac47a4"/>
    <rect x="44" y="22" width="6" height="8" rx="2.5" fill="#ac47a4"/>
    <rect x="22" y="13" width="8" height="4" rx="2" fill="#ac47a4"/>
    <circle cx="26" cy="26" r="3.5" fill="#ac47a4" stroke="#fff" strokeWidth="2"/>
  </svg>
);

const equipmentItems = [
  {
    key: "motors",
    label: "Motorlar",
    icon: MotorSVG,
    description: "Tüm motor ekipmanlarını görüntüle, arıza kaydı ve analiz işlemlerini başlat.",
    route: "/equipment/motors",
    bg: "linear-gradient(135deg, #f7e9ff 60%, #e1c6fa 100%)",
  },
  {
    key: "drivers",
    label: "Sürücüler",
    icon: <DeploymentUnitOutlined style={{ fontSize: 48, color: "#5d8e6e" }} />,
    description: "Frekans konvertörlerini ve sürücü cihazlarını takip et.",
    route: "/equipment/drivers",
    bg: "linear-gradient(135deg,#e8f7ed 60%,#b3eed8 100%)",
  },
  {
    key: "transformers",
    label: "Trafolar",
    icon: <PoweroffOutlined style={{ fontSize: 48, color: "#d4a40b" }} />,
    description: "Trafo envanterini ve son bakım durumunu kontrol et.",
    route: "/equipment/transformers",
    bg: "linear-gradient(135deg,#fff5d5 60%,#ffeeb8 100%)",
  },
];

const Equipment: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div
      style={{
        maxWidth: 1200,
        margin: "0 auto",
        padding: "36px 0",
        background: "#f7f8fa",
        minHeight: "88vh",
      }}
    >
      <Title level={2} style={{ fontWeight: 800, marginBottom: 36, color: "#32324d" }}>
        Ekipmanlar
      </Title>
      <Row gutter={[32, 32]} justify="center">
        {equipmentItems.map((item) => (
          <Col key={item.key} xs={24} sm={12} md={8}>
            <Card
              hoverable
              onClick={() => navigate(item.route)}
              style={{
                textAlign: "center",
                borderRadius: 22,
                minHeight: 260,
                background: item.bg,
                boxShadow:
                  "0 8px 32px rgba(172, 71, 164, 0.07), 0 1.5px 7px #ac47a42a",
                border: "none",
                transition: "box-shadow 0.22s, transform 0.22s",
              }}
              bodyStyle={{
                padding: "36px 26px 30px 26px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ marginBottom: 18 }}>{item.icon}</div>
              <Title level={4} style={{ margin: 0, fontWeight: 700, color: "#2d2747" }}>
                {item.label}
              </Title>
              <div style={{ marginTop: 12, color: "#666", fontSize: 15, fontWeight: 500 }}>
                {item.description}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default Equipment;
