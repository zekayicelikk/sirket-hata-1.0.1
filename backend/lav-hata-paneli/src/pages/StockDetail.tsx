import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Typography, Spin, message, Button, Modal, Form, Input, Space, Tag,
  Statistic, Tooltip, Row, Col, Table, Popconfirm
} from "antd";
import {
  EditOutlined, DeleteOutlined, ReloadOutlined, FileExcelOutlined,
  PlusCircleOutlined, MinusOutlined, ArrowLeftOutlined
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import type { ColumnsType } from "antd/es/table";

const { Title, Text } = Typography;

interface Stock {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  critical: number;
  createdAt: string;
  updatedAt: string;
  usages?: StockUsage[];
}
interface StockUsage {
  id: number;
  amount: number;
  usedAt: string;
  note?: string;
  user?: { email?: string };
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const StockDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();
  const [qtyModal, setQtyModal] = useState<"add" | "sub" | null>(null);
  const [qtyVal, setQtyVal] = useState(1);

  const userInfo = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("userInfo") || "{}"); }
    catch { return {}; }
  }, []);
  const userRole = userInfo.role || "gözlemci";

  const fetchStock = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stocks/${id}`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      // Kullanım geçmişi çek
      const usageRes = await fetch(`${API_BASE}/stock-usages?stockId=${id}`);
      const usages = usageRes.ok ? await usageRes.json() : [];
      setStock({ ...data, usages });
    } catch {
      message.error("Stok verisi yüklenemedi");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStock(); }, [id]);

  // İstatistikler
  const critical = stock && stock.quantity < stock.critical;

  // Export
  const handleExportExcel = () => {
    if (!stock?.usages?.length) {
      message.info("Geçmiş yok!");
      return;
    }
    const header = ["Tarih", "Kullanıcı", "Miktar", "Not"];
    const rows = stock.usages.map(u => [
      new Date(u.usedAt).toLocaleString("tr-TR"),
      u.user?.email || "-",
      u.amount,
      u.note || ""
    ]);
    const csv = "\uFEFF" + [header, ...rows].map(r => r.join(";")).join("\n");
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8;" }), `stok_${stock.name}_gecmis.csv`);
  };

  // Düzenle işlemi
  const handleEdit = async () => {
    try {
      const values = await form.validateFields();
      await fetch(`${API_BASE}/stocks/${stock!.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify(values)
      });
      setEditModal(false);
      message.success("Stok güncellendi!");
      fetchStock();
    } catch { message.error("Hata!"); }
  };

  // Miktar arttır/azalt
  const handleQty = async () => {
    if (!stock) return;
    const newQty = qtyModal === "add" ? stock.quantity + qtyVal : stock.quantity - qtyVal;
    if (newQty < 0) return message.error("Negatif olamaz!");
    try {
      await fetch(`${API_BASE}/stocks/${stock.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("token")}` },
        body: JSON.stringify({ ...stock, quantity: newQty })
      });
      setQtyModal(null); setQtyVal(1);
      message.success("Miktar güncellendi!");
      fetchStock();
    } catch { message.error("İşlem hatası"); }
  };

  // Kullanım geçmişi
  const columns: ColumnsType<StockUsage> = [
    { title: "Tarih", dataIndex: "usedAt", render: d => new Date(d).toLocaleString("tr-TR"), width: 160 },
    { title: "Kullanıcı", dataIndex: ["user", "email"], render: (_: any, u) => u.user?.email || "-", width: 120 },
    { title: "Miktar", dataIndex: "amount", render: v => <b>{v}</b>, width: 80 },
    { title: "Not", dataIndex: "note", width: 180 }
  ];

  if (loading) return <Spin style={{ margin: 64, display: "block" }} size="large" />;

  if (!stock) return (
    <Card style={{ margin: 48 }}><Title level={4}>Stok bulunamadı</Title></Card>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: 30 }}>
      <Button
        type="link"
        icon={<ArrowLeftOutlined />}
        style={{ marginBottom: 14, fontWeight: 600 }}
        onClick={() => navigate(-1)}
      >Geri</Button>
      <Card
        title={<span style={{ fontWeight: 700, fontSize: 24 }}>{stock.name}</span>}
        extra={
          <Space>
            <Tooltip title="Yenile"><Button icon={<ReloadOutlined />} onClick={fetchStock} /></Tooltip>
            {(userRole === "admin" || userRole === "teknisyen") && (
              <>
                <Tooltip title="Düzenle"><Button icon={<EditOutlined />} onClick={() => { setEditModal(true); form.setFieldsValue(stock); }} /></Tooltip>
                <Tooltip title="Miktar Arttır"><Button icon={<PlusCircleOutlined />} onClick={() => { setQtyModal("add"); setQtyVal(1); }} /></Tooltip>
                <Tooltip title="Miktar Azalt"><Button icon={<MinusOutlined />} onClick={() => { setQtyModal("sub"); setQtyVal(1); }} /></Tooltip>
              </>
            )}
            <Tooltip title="Excel'e Aktar"><Button icon={<FileExcelOutlined />} onClick={handleExportExcel} /></Tooltip>
          </Space>
        }
        style={{ borderRadius: 22, marginBottom: 28, boxShadow: "0 6px 24px #e8d5ff18" }}
        bodyStyle={{ fontSize: 17, padding: "30px 20px" }}
      >
        <Row gutter={32}>
          <Col md={14} xs={24}>
            <Text strong>Açıklama: </Text> {stock.description || "-"} <br />
            <Text strong>Birim: </Text> {stock.unit || "-"} <br />
            <Text strong>Kritik Seviye: </Text> <Tag color="orange">{stock.critical}</Tag> <br />
            <Text strong>Eklenme: </Text> {new Date(stock.createdAt).toLocaleString("tr-TR")} <br />
            <Text strong>Son Güncelleme: </Text> {new Date(stock.updatedAt).toLocaleString("tr-TR")} <br />
            <Text strong>Mevcut: </Text>
            <Tag color={critical ? "red" : "green"} style={{ fontSize: 17, fontWeight: 700 }}>
              {stock.quantity} {stock.unit}
              {critical && <span style={{ marginLeft: 10, color: "#e80046" }}>(Kritik Altı!)</span>}
            </Tag>
          </Col>
          <Col md={10} xs={24}>
            <Statistic title="Kullanım Geçmişi" value={stock.usages?.length || 0} />
            <Statistic
              title="Toplam Harcama"
              value={stock.usages?.reduce((sum, u) => sum + u.amount, 0) || 0}
              valueStyle={{ color: "#b80070" }}
              style={{ marginTop: 24 }}
            />
          </Col>
        </Row>
      </Card>

      {/* Kullanım Geçmişi Tablosu */}
      <Card title="Kullanım Geçmişi" style={{ borderRadius: 18 }}>
        <Table
          dataSource={stock.usages || []}
          columns={columns}
          rowKey="id"
          pagination={{ pageSize: 8 }}
          bordered
          locale={{ emptyText: "Bu malzemenin kullanım geçmişi yok." }}
        />
      </Card>

      {/* Düzenleme Modalı */}
      <Modal
        title="Stok Bilgilerini Düzenle"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleEdit}
        okText="Kaydet"
        cancelText="İptal"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Ad" name="name" rules={[{ required: true, message: "Ad zorunlu" }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Açıklama" name="description"><Input /></Form.Item>
          <Form.Item label="Birim" name="unit"><Input /></Form.Item>
          <Form.Item label="Miktar" name="quantity" rules={[{ required: true, message: "Miktar zorunlu" }]}>
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="Kritik Seviye" name="critical" rules={[{ required: true, message: "Kritik zorunlu" }]}>
            <Input type="number" min={0} />
          </Form.Item>
        </Form>
      </Modal>

      {/* Miktar Modalı */}
      <Modal
        title={qtyModal === "add" ? "Miktar Arttır" : "Miktar Azalt"}
        open={!!qtyModal}
        onCancel={() => setQtyModal(null)}
        onOk={handleQty}
        okText="Uygula"
        cancelText="İptal"
        destroyOnClose
      >
        <b>{stock.name} - Mevcut: {stock.quantity} {stock.unit}</b>
        <Input
          type="number"
          min={1}
          max={qtyModal === "sub" ? stock.quantity : 100000}
          value={qtyVal}
          onChange={e => setQtyVal(Number(e.target.value))}
          style={{ width: 140, marginTop: 12 }}
        />
      </Modal>
    </div>
  );
};

export default StockDetail;
