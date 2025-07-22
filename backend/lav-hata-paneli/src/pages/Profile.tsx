import React, { useEffect, useState } from "react";
import { Card, Row, Col, Form, Input, Button, message, Tag, Divider, Modal } from "antd";
import { UserOutlined, MailOutlined, PhoneOutlined, EditOutlined, SafetyOutlined } from "@ant-design/icons";
import api from "../api";
import moment from "moment";

interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [passwordModal, setPasswordModal] = useState(false);
  const [pwForm] = Form.useForm();

  // Kullanıcı bilgisi çek
  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await api.get<User>("/users/me");
      setUser(res.data);
      form.setFieldsValue(res.data);
    } catch {
      message.error("Profil bilgileri alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
    // eslint-disable-next-line
  }, []);

  // Profil bilgilerini güncelle
  const handleSave = async (values: any) => {
    setLoading(true);
    try {
      await api.put("/users/me", values);
      message.success("Profil başarıyla güncellendi");
      fetchProfile();
    } catch {
      message.error("Profil güncellenemedi");
    } finally {
      setLoading(false);
    }
  };

  // Şifre değiştir
  const handleChangePw = async (values: any) => {
    try {
      await api.put("/auth/change-password", values);
      message.success("Şifre başarıyla değiştirildi. Lütfen tekrar giriş yapın.");
      setPasswordModal(false);
      pwForm.resetFields();
      // Otomatik çıkış yapılabilir (isteğe bağlı)
      // localStorage.clear();
      // window.location.href = "/login";
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Şifre değiştirilemedi.");
    }
  };

  return (
    <div style={{ maxWidth: 600, margin: "32px auto", padding: "24px" }}>
      <Card
        bordered={false}
        style={{ borderRadius: 18, boxShadow: "0 2px 12px #b47ac34c" }}
        bodyStyle={{ padding: "32px 34px" }}
      >
        <Row gutter={24}>
          <Col xs={24} sm={8} style={{ textAlign: "center" }}>
            <div style={{
              background: "linear-gradient(135deg, #a993ff 65%, #fb7b9e 120%)",
              borderRadius: "50%",
              width: 86, height: 86,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 36, color: "#fff", fontWeight: 700, margin: "0 auto 14px"
            }}>
              {user ? ((user.firstName?.[0] || "") + (user.lastName?.[0] || "")).toUpperCase() : <UserOutlined />}
            </div>
            <b>{user?.firstName} {user?.lastName}</b>
            <br />
            <span style={{ color: "#575757" }}>
              <MailOutlined /> {user?.email}
            </span>
            <br />
            <Tag color="geekblue" style={{ marginTop: 8 }}>
              <SafetyOutlined /> {user?.role?.toUpperCase()}
            </Tag>
            <Divider />
            <span>
              Kayıt: <b>{user && moment(user.createdAt).format("DD.MM.YYYY")}</b>
            </span>
          </Col>
          <Col xs={24} sm={16}>
            <Form
              layout="vertical"
              form={form}
              onFinish={handleSave}
              initialValues={user || {}}
              style={{ marginTop: 0 }}
            >
              <Form.Item label="Ad" name="firstName">
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item label="Soyad" name="lastName">
                <Input prefix={<UserOutlined />} />
              </Form.Item>
              <Form.Item label="Telefon" name="phone">
                <Input prefix={<PhoneOutlined />} />
              </Form.Item>
              <Form.Item label="Departman" name="department">
                <Input />
              </Form.Item>
              <Row gutter={14}>
                <Col>
                  <Button type="primary" htmlType="submit" loading={loading} icon={<EditOutlined />}>
                    Güncelle
                  </Button>
                </Col>
                <Col>
                  <Button
                    onClick={() => setPasswordModal(true)}
                    icon={<SafetyOutlined />}
                  >Şifre Değiştir</Button>
                </Col>
              </Row>
            </Form>
          </Col>
        </Row>
      </Card>

      {/* Şifre değiştirme modalı */}
      <Modal
        open={passwordModal}
        title="Şifre Değiştir"
        onCancel={() => setPasswordModal(false)}
        onOk={() => pwForm.submit()}
        okText="Şifreyi Güncelle"
        destroyOnClose
      >
        <Form form={pwForm} layout="vertical" onFinish={handleChangePw}>
          <Form.Item
            label="Mevcut Şifre"
            name="oldPassword"
            rules={[{ required: true, message: "Mevcut şifrenizi girin" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Yeni Şifre"
            name="newPassword"
            rules={[{ required: true, message: "Yeni şifreyi girin" }, { min: 6, message: "En az 6 karakter olmalı" }]}
          >
            <Input.Password />
          </Form.Item>
          <Form.Item
            label="Yeni Şifre Tekrar"
            name="newPasswordAgain"
            dependencies={['newPassword']}
            rules={[
              { required: true, message: "Tekrar girin" },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  if (!value || getFieldValue('newPassword') === value) return Promise.resolve();
                  return Promise.reject("Şifreler uyuşmuyor");
                }
              })
            ]}
          >
            <Input.Password />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Profile;
