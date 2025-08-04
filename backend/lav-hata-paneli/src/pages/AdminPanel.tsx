import React, { useEffect, useState } from "react";
import { Card, Row, Col, Statistic, Table, Button, Space, Modal, Form, Input, message, Tooltip, Tag, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, ReloadOutlined, BellOutlined } from "@ant-design/icons";
import FaultTypes from "./FaultTypes";
import api from "../api";

const AdminPanel: React.FC = () => {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [annModal, setAnnModal] = useState(false);
  const [annForm] = Form.useForm();

  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [summary, setSummary] = useState({ userCount: 0, logCount: 0, announcementCount: 0 });

  const fetchAnnouncements = async () => {
    try {
      const res = await api.get("/announcements");
      setAnnouncements(res.data);
      setSummary(s => ({ ...s, announcementCount: res.data.length }));
    } catch {
      message.error("Duyurular yüklenemedi!");
    }
  };

  const addAnnouncement = async () => {
    try {
      const values = await annForm.validateFields();
      await api.post("/announcements", values);
      message.success("Duyuru yayınlandı!");
      setAnnModal(false);
      annForm.resetFields();
      fetchAnnouncements();
    } catch (err: any) {
      message.error(err.response?.data?.error || "Duyuru eklenemedi!");
    }
  };

  const deleteAnnouncement = async (id: number) => {
    try {
      await api.delete(`/announcements/${id}`);
      message.success("Duyuru silindi!");
      fetchAnnouncements();
    } catch {
      message.error("Duyuru silinemedi!");
    }
  };

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await api.get("/action-logs");
      setLogs(res.data);
      setSummary(s => ({ ...s, logCount: res.data.length }));
    } catch {
      message.error("Loglar yüklenemedi!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
    fetchLogs();
  }, []);

  const announcementColumns = [
    { title: "Başlık", dataIndex: "title" },
    { title: "Açıklama", dataIndex: "desc" },
    {
      title: "Tarih",
      dataIndex: "date",
      render: (d: string) => d ? new Date(d).toLocaleString("tr-TR") : "-"
    },
    {
      title: "Sil",
      dataIndex: "id",
      width: 70,
      render: (_: any, rec: any) =>
        <Popconfirm
          title="Duyuru silinsin mi?"
          okText="Evet"
          cancelText="Vazgeç"
          onConfirm={() => deleteAnnouncement(rec.id)}
        >
          <Tooltip title="Sil">
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Tooltip>
        </Popconfirm>
    }
  ];

  const logColumns = [
    {
      title: "Tarih",
      dataIndex: "createdAt",
      render: (d: string) => new Date(d).toLocaleString("tr-TR")
    },
    {
      title: "Kullanıcı",
      dataIndex: ["user", "email"],
      render: (_: any, rec: any) => rec.user?.email || "-"
    },
    {
      title: "İşlem",
      dataIndex: "actionType",
      render: (t: string) => <Tag>{t}</Tag>
    },
    {
      title: "Açıklama",
      dataIndex: "description"
    }
  ];

  return (
    <div style={{ maxWidth: 1300, margin: "0 auto", padding: 30 }}>
      <Row gutter={20} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 18 }}>
            <Statistic title="Toplam Duyuru" value={summary.announcementCount} prefix={<BellOutlined />} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered style={{ borderRadius: 18 }}>
            <Statistic title="Toplam Log" value={summary.logCount} />
          </Card>
        </Col>
      </Row>

      <Card
        title="Duyurular"
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => setAnnModal(true)}>Duyuru Ekle</Button>}
        style={{ borderRadius: 18, marginBottom: 26 }}
      >
        <Table
          dataSource={announcements}
          columns={announcementColumns}
          rowKey="id"
          pagination={false}
          locale={{ emptyText: "Henüz duyuru yok" }}
        />
      </Card>
      <Modal
        title="Duyuru Yayınla"
        open={annModal}
        onOk={addAnnouncement}
        onCancel={() => setAnnModal(false)}
        okText="Yayınla"
        cancelText="İptal"
        destroyOnClose
      >
        <Form form={annForm} layout="vertical">
          <Form.Item label="Başlık" name="title" rules={[{ required: true, message: "Başlık girin" }]}>
            <Input maxLength={50} />
          </Form.Item>
          <Form.Item label="Açıklama" name="desc" rules={[{ required: true, message: "Açıklama girin" }]}>
            <Input.TextArea rows={3} maxLength={300} />
          </Form.Item>
        </Form>
      </Modal>

      <Card
        title="Sistem Aktivite Logları"
        extra={<Button icon={<ReloadOutlined />} onClick={fetchLogs}>Yenile</Button>}
        style={{ borderRadius: 18, marginBottom: 30 }}
      >
        <Table
          dataSource={logs}
          columns={logColumns}
          loading={loading}
          rowKey="id"
          pagination={{ pageSize: 12 }}
          bordered
          locale={{ emptyText: "Log kaydı yok" }}
        />
      </Card>

      <Card title="Arıza Tipleri" style={{ borderRadius: 18 }}>
        <FaultTypes />
      </Card>
    </div>
  );
};

export default AdminPanel;
