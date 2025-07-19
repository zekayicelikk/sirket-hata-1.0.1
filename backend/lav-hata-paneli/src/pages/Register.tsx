import React, { useState } from "react";
import { Form, Input, Button, Typography, Card, message } from "antd";
import { useNavigate } from "react-router-dom";
import { UserOutlined, MailOutlined, LockOutlined, LoadingOutlined } from "@ant-design/icons";

const { Title, Link } = Typography;

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

const Register: React.FC = () => {
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
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg,#d3aeea,#ac47a4 70%,#fff 100%)",
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 18,
          boxShadow: "0 6px 32px #ac47a433",
        }}
        bodyStyle={{ padding: 32 }}
      >
        <Title level={3} style={{ textAlign: "center", marginBottom: 24, fontWeight: 900, color: "#7a34a9", letterSpacing: 1 }}>
          Kayıt Ol
        </Title>
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
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <Link onClick={goToLogin}>Giriş Ekranına Dön</Link>
          </div>
        </Form>
      </Card>
    </div>
  );
};

export default Register;
