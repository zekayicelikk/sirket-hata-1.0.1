import React, { useState } from "react";
import { Form, Input, Button, Typography, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, MailOutlined, LockOutlined, LoadingOutlined } from "@ant-design/icons";

const { Title, Link } = Typography;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Register: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: values.email,
          password: values.password,
          firstName: values.firstName,
          lastName: values.lastName,
        }),
      });
      const data = await response.json();

      if (response.ok && data.id) {
        message.success("Kayıt başarılı, giriş yapabilirsiniz!");
        setTimeout(() => navigate("/login"), 1500); // login ekranına dön
      }
      else if (
        response.status === 409 ||
        (data.message && data.message.toLowerCase().includes("kayıtlı")) ||
        (data.error && data.error.toLowerCase().includes("kayıtlı"))
      ) {
        message.error(data.message || data.error || "Bu e-posta zaten kayıtlı!");
        // Kayıtlıysa ekranda bırak
      }
      else {
        message.error(data.message || data.error || "Kayıt başarısız!");
      }
    } catch (err) {
      message.error("Sunucuya bağlanılamadı!");
    }
    setLoading(false);
  };

  const goToLogin = () => navigate("/login");

  return (
    <Card
      style={{
        width: 400,
        borderRadius: 20,
        boxShadow: "0 8px 40px #7a34a966",
        border: "none",
        background: "linear-gradient(135deg, #ffffff 50%, #f4e2ff 120%)",
        padding: 0,
      }}
      bodyStyle={{ padding: 36, paddingTop: 28 }}
    >
      <Title level={3} style={{ textAlign: "center", marginBottom: 24, fontWeight: 900, color: "#7a34a9", letterSpacing: 1 }}>
        Kayıt Ol
      </Title>
      <Button
        type="default"
        onClick={onBack}
        style={{
          marginBottom: 22,
          padding: "0 18px",
          height: 38,
          fontWeight: 700,
          fontSize: 16,
          color: "#a13b97",
          border: "1.5px solid #a13b97",
          background: "rgba(255,255,255,0.85)",
          borderRadius: 8,
          boxShadow: "0 2px 8px #a13b9722",
          display: "flex",
          alignItems: "center",
          gap: 8,
          transition: "all 0.18s cubic-bezier(.36,.07,.19,.97)",
        }}
        onMouseOver={e => {
          e.currentTarget.style.background = "#f9e6fa";
          e.currentTarget.style.color = "#fe0094";
          e.currentTarget.style.borderColor = "#fe0094";
        }}
        onMouseOut={e => {
          e.currentTarget.style.background = "rgba(255,255,255,0.85)";
          e.currentTarget.style.color = "#a13b97";
          e.currentTarget.style.borderColor = "#a13b97";
        }}
      >
        <span style={{ fontSize: 20, lineHeight: 1, marginRight: 4 }}>←</span>
        Girişe Dön
      </Button>
      <Form layout="vertical" form={form} onFinish={handleFinish} autoComplete="on">
        <Form.Item
          label="Ad"
          name="firstName"
          rules={[{ required: true, message: "Ad gerekli!" }]}
        >
          <Input
            placeholder="Adınız"
            prefix={<UserOutlined />}
            size="large"
            autoFocus
          />
        </Form.Item>
        <Form.Item
          label="Soyad"
          name="lastName"
          rules={[{ required: true, message: "Soyad gerekli!" }]}
        >
          <Input
            placeholder="Soyadınız"
            prefix={<UserOutlined />}
            size="large"
          />
        </Form.Item>
        <Form.Item
          label="E-posta"
          name="email"
          rules={[
            { required: true, message: "E-posta gerekli!" },
            { type: "email", message: "Geçerli bir e-posta girin!" },
          ]}
        >
          <Input
            placeholder="ad.soyad@lav.com"
            prefix={<MailOutlined />}
            size="large"
            autoComplete="username"
          />
        </Form.Item>
        <Form.Item
          label="Şifre"
          name="password"
          rules={[{ required: true, message: "Şifre gerekli!" }]}
        >
          <Input.Password
            placeholder="Şifre"
            prefix={<LockOutlined />}
            size="large"
            autoComplete="new-password"
          />
        </Form.Item>
        <Form.Item>
          <Button
            type="primary"
            htmlType="submit"
            loading={loading}
            style={{ width: "100%", marginTop: 8, fontWeight: 600 }}
            size="large"
          >
            {loading ? <LoadingOutlined /> : "Kayıt Ol"}
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default Register;
