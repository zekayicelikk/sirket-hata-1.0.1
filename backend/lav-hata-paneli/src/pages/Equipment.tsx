import React from "react";
import { Row, Col, Card, Typography } from "antd";
import { useNavigate } from "react-router-dom";

// PNG/SVG dosyalarını import et (dosya yollarını kendi dizinine göre ayarla!)
import motorIcon from "../assets/motor-icon-2.png";
import driverIcon from "../assets/sürücü.png"; // sürücü görselinin adını ve yolunu kontrol et!

const { Title } = Typography;

const equipmentItems = [
  {
    key: "motors",
    label: "Motorlar",
    icon: (
      <img
        src={motorIcon}
        alt="Motor Icon"
        style={{
          width: 90,
          height: 90,
          marginBottom: 8,
          filter: "drop-shadow(0 3px 16px #a878ec44)",
        }}
      />
    ),
    description:
      "Tüm motor ekipmanlarını görüntüle, arıza kaydı ve analiz işlemlerini başlat.",
    route: "/equipment/motors",
    bg: "linear-gradient(135deg,#ffe5f4 55%, #e3c9f9 100%)",
  },
  {
    key: "drivers",
    label: "Motor Kontrol Cihazları",
    icon: (
      <img
        src={driverIcon}
        alt="Sürücü Icon"
        style={{
          width: 90,
          height: 90,
          marginBottom: 8,
          filter: "drop-shadow(0 3px 16px #7de5c855)",
        }}
      />
    ),
    description:
      "Tüm motor kontrol cihazlarını ve bağlantılarını kolayca takip edin.",
    route: "/equipment/control-devices", // <--- DÜZELTİLDİ!
    bg: "linear-gradient(135deg,#e8f7ed 60%,#b3eed8 100%)",
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
                cursor: "pointer",
              }}
              bodyStyle={{
                padding: "36px 26px 30px 26px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <div style={{ marginBottom: 18 }}>{item.icon}</div>
              <Title
                level={4}
                style={{ margin: 0, fontWeight: 700, color: "#2d2747" }}
              >
                {item.label}
              </Title>
              <div
                style={{
                  marginTop: 12,
                  color: "#666",
                  fontSize: 15,
                  fontWeight: 500,
                }}
              >
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
