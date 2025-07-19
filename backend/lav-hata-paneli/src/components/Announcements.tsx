import React, { useState, useEffect } from "react";
import axios from "axios";
import { Button, Modal, Form, Input, message, Spin } from "antd";
import { PlusOutlined } from "@ant-design/icons";

type Announcement = {
  id: number;
  title: string;
  desc: string;
  date: string;
};

const API_URL = "http://localhost:5000/api/announcements";

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [form] = Form.useForm();

  // userInfo'yu component içinde ve render'da oku!
  const [userInfo, setUserInfo] = useState<{ role: string }>({ role: "user" });

  useEffect(() => {
    const stored = localStorage.getItem("userInfo");
    if (stored) setUserInfo(JSON.parse(stored));
  }, []);

  const fetchAnnouncements = () => {
    setLoading(true);
    axios.get(API_URL)
      .then(res => setAnnouncements(res.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const showAddModal = () => setIsModalOpen(true);
  const handleCancel = () => setIsModalOpen(false);

  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      setAdding(true);
      await axios.post(API_URL, values, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      message.success("Duyuru eklendi");
      setIsModalOpen(false);
      form.resetFields();
      fetchAnnouncements();
    } catch (err: any) {
      message.error(err?.response?.data?.error || "Duyuru eklenemedi");
    } finally {
      setAdding(false);
    }
  };

  return (
    <div
      style={{
        background: "linear-gradient(95deg, #f2e3f5 70%, #e9b7e4 120%)",
        borderRadius: 18,
        boxShadow: "0 2px 18px #e9b7e413",
        padding: "20px 28px 16px 28px",
        marginBottom: 24,
        display: "flex",
        flexDirection: "column"
      }}
    >
      <div style={{
        fontWeight: 700, fontSize: 20, color: "#a13b97", marginBottom: 8, letterSpacing: 0.5, display: "flex", alignItems: "center"
      }}>
        <span role="img" aria-label="megaphone" style={{ marginRight: 8 }}>📢</span>
        Duyurular
        {/* Sadece admin'e göster */}
        {userInfo.role === "admin" && (
          <Button
            icon={<PlusOutlined />}
            size="small"
            style={{ marginLeft: "auto", background: "#ac47a4", color: "#fff" }}
            onClick={showAddModal}
          >
            Duyuru Ekle
          </Button>
        )}
      </div>
      <div>
        {loading ? (
          <Spin />
        ) : announcements.length === 0 ? (
          <div style={{ color: "#666", fontSize: 15, opacity: 0.8 }}>Duyuru yok.</div>
        ) : (
          announcements.map(a => (
            <div key={a.id} style={{
              borderBottom: "1px solid #e7d9ea",
              padding: "8px 0",
              display: "flex",
              alignItems: "center"
            }}>
              <span style={{ fontWeight: 600, color: "#722b87", marginRight: 10 }}>{a.title}:</span>
              <span style={{ color: "#3a2150" }}>{a.desc}</span>
              <span style={{ marginLeft: "auto", color: "#ac47a480", fontSize: 13 }}>
                {new Date(a.date).toLocaleString("tr-TR")}
              </span>
            </div>
          ))
        )}
      </div>
      <Modal
        title="Yeni Duyuru Ekle"
        open={isModalOpen}
        confirmLoading={adding}
        onCancel={handleCancel}
        onOk={handleAdd}
        okText="Ekle"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Başlık" name="title" rules={[{ required: true, message: "Başlık girin" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Açıklama" name="desc" rules={[{ required: true, message: "Açıklama girin" }]}>
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Announcements;
