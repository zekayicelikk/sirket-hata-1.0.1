import React, { useState, useRef } from "react";
import {
  Form,
  Input,
  Button,
  Typography,
  Card,
  message,
  Checkbox,
  Tooltip,
} from "antd";
import {
  EyeTwoTone,
  EyeInvisibleOutlined,
  LockOutlined,
  MailOutlined,
  LoadingOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";

const { Title, Link, Text } = Typography;

const Login: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [showPassword, setShowPassword] = useState(false);
  const [shake, setShake] = useState(false);
  const passwordInputRef = useRef<any>(null);
  const navigate = useNavigate();

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 450);
  };

  const handleSuccess = (token: string, user: any, remember: boolean) => {
    if (remember) {
      localStorage.setItem("token", token);
      localStorage.setItem("userInfo", JSON.stringify(user));
    } else {
      sessionStorage.setItem("token", token);
      sessionStorage.setItem("userInfo", JSON.stringify(user));
    }
    message.success("Başarıyla giriş yapıldı!");
    setTimeout(() => {
      navigate("/");
    }, 700);
  };

  const handleApiError = (errorText: string) => {
    message.error(errorText);
    form.setFields([
      { name: "password", errors: [errorText] },
      { name: "email", errors: [] },
    ]);
    triggerShake();
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  };

  const handleFinish = async (values: any) => {
    setLoading(true);
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/login`, // <--- ENDPOINT DÜZELTİLDİ
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: values.email,
            password: values.password,
          }),
        }
      );
      const data = await response.json();
      if (response.ok && data.token && data.user) {
        handleSuccess(data.token, data.user, values.rememberMe);
      } else {
        handleApiError(
          data.error === "User not found"
            ? "Bu e-posta ile kayıt bulunamadı."
            : data.error === "Incorrect password"
            ? "Şifre yanlış, tekrar deneyin."
            : data.error || "Giriş başarısız!"
        );
      }
    } catch (err) {
      handleApiError("Sunucuya ulaşılamadı. Lütfen tekrar deneyin.");
    }
    setLoading(false);
  };

  const goToRegister = () => navigate("/register");

  const togglePassword = () => setShowPassword((prev) => !prev);

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100vw",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background:
          "radial-gradient(ellipse at 70% 30%, #f1eaff 0%, #a37fc6 100%)",
      }}
    >
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
        <Title
          level={3}
          style={{
            textAlign: "center",
            marginBottom: 22,
            fontWeight: 900,
            letterSpacing: "2px",
            color: "#7a34a9",
          }}
        >
          LAV Hata Paneli Giriş
        </Title>
        <Form
          layout="vertical"
          form={form}
          onFinish={handleFinish}
          initialValues={{ rememberMe: true }}
          style={{ marginTop: 10 }}
          autoComplete="on"
        >
          <Form.Item
            label={
              <span>
                E-posta{" "}
                <Tooltip title="Şirket e-posta adresinizi giriniz.">
                  <InfoCircleOutlined style={{ color: "#a37fc6" }} />
                </Tooltip>
              </span>
            }
            name="email"
            rules={[
              { required: true, message: "E-posta gerekli!" },
              { type: "email", message: "Geçerli bir e-posta girin!" },
            ]}
          >
            <Input
              prefix={<MailOutlined />}
              placeholder="ad.soyad@lav.com"
              size="large"
              autoFocus
              autoComplete="username"
              maxLength={64}
              aria-label="E-posta adresi"
            />
          </Form.Item>
          <Form.Item
            label={
              <span>
                Şifre{" "}
                <Tooltip title="Harf, rakam ve özel karakter içermelidir.">
                  <InfoCircleOutlined style={{ color: "#a37fc6" }} />
                </Tooltip>
              </span>
            }
            name="password"
            rules={[{ required: true, message: "Şifre gerekli!" }]}
          >
            <Input.Password
              ref={passwordInputRef}
              prefix={<LockOutlined />}
              placeholder="••••••••"
              size="large"
              autoComplete="current-password"
              aria-label="Şifre"
              maxLength={32}
              iconRender={visible =>
                visible ? <EyeTwoTone /> : <EyeInvisibleOutlined />
              }
              className={shake ? "animate-shake" : ""}
              onPressEnter={() => form.submit()}
            />
          </Form.Item>
          <Form.Item style={{ marginBottom: 4 }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <Form.Item
                name="rememberMe"
                valuePropName="checked"
                noStyle
              >
                <Checkbox>Beni hatırla</Checkbox>
              </Form.Item>
            </div>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0 }}>
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              size="large"
              style={{
                width: "100%",
                borderRadius: 12,
                fontWeight: 700,
                letterSpacing: 1,
                marginTop: 8,
                boxShadow: "0 3px 12px #a37fc622",
                background: "linear-gradient(90deg,#a37fc6 60%,#7a34a9 100%)",
                border: "none",
              }}
              aria-label="Giriş Yap"
            >
              {loading ? <LoadingOutlined /> : "Giriş Yap"}
            </Button>
          </Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 10 }}>
            <div style={{ textAlign: "right" }}>
              <Text type="secondary" style={{ fontSize: 14 }}>
                Hesabınız yok mu?{" "}
              </Text>
              <Link
                onClick={goToRegister}
                style={{
                  color: "#a37fc6",
                  fontWeight: 600,
                  fontSize: 14,
                  marginLeft: 2,
                }}
                aria-label="Kayıt Ol"
              >
                Kayıt Ol
              </Link>
            </div>
          </Form.Item>
        </Form>
      </Card>
      <style>
        {`
        .animate-shake {
          animation: shake 0.36s cubic-bezier(.36,.07,.19,.97) both;
        }
        @keyframes shake {
          10%, 90% { transform: translateX(-1px); }
          20%, 80% { transform: translateX(2px); }
          30%, 50%, 70% { transform: translateX(-4px); }
          40%, 60% { transform: translateX(4px); }
        }
        `}
      </style>
    </div>
  );
};

export default Login;
