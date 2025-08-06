import React, { useEffect, useState } from "react";
import {
  Table, Button, Input, Space, Tag, Modal, Form, message, Tooltip, Popconfirm, Card, Statistic, Row, Col, Spin, Empty,
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, FileExcelOutlined,
  SearchOutlined, ReloadOutlined, ExclamationCircleTwoTone,
  WarningTwoTone, ArrowRightOutlined, MinusOutlined, PlusCircleOutlined
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import type { ColumnsType } from "antd/es/table";

interface Stock {
  id: number;
  name: string;
  description?: string;
  quantity: number;
  unit?: string;
  critical: number;
  createdAt: string;
  updatedAt: string;
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const initialForm = {
  name: "",
  description: "",
  quantity: 0,
  unit: "",
  critical: 1,
};

const Stocks: React.FC = () => {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [filtered, setFiltered] = useState<Stock[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStock, setEditStock] = useState<Stock | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantityModal, setQuantityModal] = useState(false);
  const [quantityDelta, setQuantityDelta] = useState<number>(0);
  const navigate = useNavigate();

  // Kullanıcı rolü (örnek, localstorage’dan)
  const userInfo = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch {
      return {};
    }
  }, []);
  const userRole = userInfo.role || "gözlemci";

  // Stokları getir
  const fetchStocks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/stocks`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Stok verisi alınamadı!");
      const data = await res.json();
      setStocks(data);
      setFiltered(data);
    } catch {
      message.error("Stoklar yüklenemedi!");
      setStocks([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchStocks(); }, []);

  // Arama & filtre
  useEffect(() => {
    let data = [...stocks];
    if (search)
      data = data.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.description || "").toLowerCase().includes(search.toLowerCase())
      );
    setFiltered(data);
  }, [stocks, search]);

  // Modal aç
  const openModal = (stock?: Stock) => {
    if (stock) {
      setEditStock(stock);
      form.setFieldsValue(stock);
    } else {
      setEditStock(null);
      form.setFieldsValue(initialForm);
    }
    setModalOpen(true);
  };

  // Ekle/düzenle submit
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      values.quantity = Number(values.quantity);
      values.critical = Number(values.critical);
      if (editStock) {
        // Düzenle
        const res = await fetch(`${API_BASE}/stocks/${editStock.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız!");
        message.success("Stok başarıyla güncellendi!");
      } else {
        // Ekle
        const res = await fetch(`${API_BASE}/stocks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Ekleme başarısız!");
        message.success("Stok başarıyla eklendi!");
      }
      setModalOpen(false);
      fetchStocks();
    } catch (err: any) {
      message.error(err?.message || "İşlem başarısız!");
    }
  };

  // Stok sil (sadece admin)
  const handleDelete = async (stock: Stock) => {
    try {
      const res = await fetch(`${API_BASE}/stocks/${stock.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Silme başarısız!");
      message.success("Stok silindi!");
      fetchStocks();
    } catch {
      message.error("Stok silinemedi!");
    }
  };

  // Miktar arttır/azalt modalı aç
  const openQuantityModal = (stock: Stock, type: "add" | "subtract") => {
    setSelectedStock(stock);
    setQuantityModal(true);
    setQuantityDelta(type === "add" ? 1 : -1);
  };

  // Miktar arttır/azalt işlemini uygula
  const handleQuantityChange = async () => {
    if (!selectedStock) return;
    const newQuantity = selectedStock.quantity + quantityDelta;
    if (newQuantity < 0) {
      message.error("Stok miktarı sıfırın altına inemez!");
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/stocks/${selectedStock.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          ...selectedStock,
          quantity: newQuantity,
        }),
      });
      if (!res.ok) throw new Error("Miktar güncellenemedi!");
      message.success("Stok miktarı güncellendi!");
      setQuantityModal(false);
      setSelectedStock(null);
      fetchStocks();
    } catch {
      message.error("İşlem başarısız!");
    }
  };

  // Excel aktar
  const exportExcel = () => {
    if (!filtered.length) {
      message.info("Gösterilecek stok yok!");
      return;
    }
    const header = ["Malzeme", "Açıklama", "Miktar", "Birim", "Kritik Seviye", "Eklenme", "Güncelleme"];
    const rows = filtered.map((s) => [
      s.name,
      s.description || "-",
      s.quantity,
      s.unit || "-",
      s.critical,
      new Date(s.createdAt).toLocaleString("tr-TR"),
      new Date(s.updatedAt).toLocaleString("tr-TR"),
    ]);
    const csv =
      "\uFEFF" + [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "stoklar.csv");
  };

  // Tablo kolonları
  const columns: ColumnsType<Stock> = [
    {
      title: "Malzeme",
      dataIndex: "name",
      key: "name",
      render: (text, record) => (
        <Space>
          <Button
            type="link"
            style={{ fontWeight: 600, color: "#7c0e7a" }}
            onClick={e => { e.stopPropagation(); navigate(`/stock/${record.id}`); }}
            tabIndex={0}
          >
            {text}
          </Button>
          {record.quantity < record.critical && (
            <Tooltip title="Kritik stok seviyesi altında">
              <ExclamationCircleTwoTone twoToneColor="#ff4d4f" />
            </Tooltip>
          )}
        </Space>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name, "tr"),
    },
    {
      title: "Açıklama",
      dataIndex: "description",
      key: "description",
      render: (t: string) => t || <span style={{ color: "#aaa" }}>-</span>,
      responsive: ["md"]
    },
    {
      title: "Mevcut",
      dataIndex: "quantity",
      key: "quantity",
      render: (val: number, r) => (
        <b style={val < r.critical ? { color: "#ff4d4f" } : {}}>{val}</b>
      ),
      sorter: (a, b) => a.quantity - b.quantity,
    },
    {
      title: "Birim",
      dataIndex: "unit",
      key: "unit",
      render: (unit: string) => unit || <Tag color="gray">-</Tag>,
      responsive: ["md"]
    },
    {
      title: "Kritik",
      dataIndex: "critical",
      key: "critical",
      render: (v: number) => <Tag color={v > 0 ? "orange" : "gray"}>{v}</Tag>,
      sorter: (a, b) => a.critical - b.critical,
    },
    {
      title: "Güncelle",
      key: "actions",
      render: (_: any, s: Stock) => (
        <Space>
          {(userRole === "admin" || userRole === "teknisyen") && (
            <>
              <Tooltip title="Düzenle">
                <Button
                  icon={<EditOutlined />}
                  size="small"
                  onClick={e => { e.stopPropagation(); openModal(s); }}
                />
              </Tooltip>
              <Tooltip title="Miktar Arttır">
                <Button
                  icon={<PlusCircleOutlined />}
                  size="small"
                  onClick={e => { e.stopPropagation(); openQuantityModal(s, "add"); }}
                />
              </Tooltip>
              <Tooltip title="Miktar Azalt">
                <Button
                  icon={<MinusOutlined />}
                  size="small"
                  onClick={e => { e.stopPropagation(); openQuantityModal(s, "subtract"); }}
                />
              </Tooltip>
            </>
          )}
          {userRole === "admin" && (
            <Popconfirm
              title="Bu stoğu silmek istediğinize emin misiniz?"
              onConfirm={e => { e && (e.stopPropagation && e.stopPropagation()); handleDelete(s); }}
              okText="Sil"
              cancelText="Vazgeç"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Sil">
                <Button icon={<DeleteOutlined />} danger size="small"
                  onClick={e => e.stopPropagation()}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip title="Detay">
            <Button
              icon={<ArrowRightOutlined />}
              size="small"
              onClick={e => { e.stopPropagation(); navigate(`/stock/${s.id}`); }}
            />
          </Tooltip>
        </Space>
      ),
    },
    {
      title: "Güncellenme",
      dataIndex: "updatedAt",
      key: "updatedAt",
      render: (d: string) => new Date(d).toLocaleString("tr-TR"),
      responsive: ["md"]
    },
  ];

  // Satır tıklama: Detaya git
  const onRow = (stock: Stock) => ({
    onClick: (event: React.MouseEvent) => {
      if (
        !(event.target as HTMLElement).closest("button") &&
        !(event.target as HTMLElement).closest("a")
      ) {
        navigate(`/stock/${stock.id}`);
      }
    },
    style: { cursor: "pointer" }
  });

  // Sayfa istatistik kutuları
  const criticalCount = stocks.filter((s) => s.quantity < s.critical).length;
  const total = stocks.length;
  const totalQuantity = stocks.reduce((sum, s) => sum + s.quantity, 0);

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: "30px 0" }}>
      <Card
        title={
          <Row align="middle" gutter={16}>
            <Col>
              <span style={{ fontSize: 28, fontWeight: 800, color: "#232545" }}>Stok Yönetimi</span>
            </Col>
            <Col>
              <Tooltip title="Yenile">
                <Button shape="circle" icon={<ReloadOutlined />} onClick={fetchStocks} />
              </Tooltip>
            </Col>
          </Row>
        }
        extra={
          <Space>
            {(userRole === "admin" || userRole === "teknisyen") && (
              <Button
                icon={<PlusOutlined />}
                type="primary"
                onClick={() => openModal()}
                style={{ fontWeight: 600, borderRadius: 9 }}
              >
                Malzeme Ekle
              </Button>
            )}
            {userRole === "admin" && (
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportExcel}
                style={{ fontWeight: 500, borderRadius: 9 }}
              >
                Excel’e Aktar
              </Button>
            )}
            <Input
              placeholder="Ara (isim veya açıklama)"
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 220 }}
            />
          </Space>
        }
        style={{
          borderRadius: 20,
          marginBottom: 22,
          boxShadow: "0 4px 20px #ac47a425",
        }}
        bodyStyle={{ padding: "28px 16px" }}
      >
        <Row gutter={20} style={{ marginBottom: 28 }}>
          <Col md={8} xs={24}>
            <Statistic title="Toplam Malzeme" value={total} />
          </Col>
          <Col md={8} xs={24}>
            <Statistic title="Toplam Adet" value={totalQuantity} valueStyle={{ color: "#7928ca" }} />
          </Col>
          <Col md={8} xs={24}>
            <Statistic
              title="Kritik Altı"
              value={criticalCount}
              prefix={<WarningTwoTone twoToneColor="#ff4d4f" />}
              valueStyle={{ color: "#ff4d4f" }}
            />
          </Col>
        </Row>
        {loading ? (
          <Spin style={{ margin: "40px auto", display: "block" }} size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            bordered
            pagination={{ pageSize: 12, showSizeChanger: true, pageSizeOptions: [10, 20, 50] }}
            locale={{
              emptyText: (
                <Empty description={search ? "Sonuç bulunamadı" : "Henüz stok yok"} />
              ),
            }}
            scroll={{ x: 900 }}
            onRow={onRow}
          />
        )}
      </Card>

      {/* Stok ekle/düzenle modalı */}
      <Modal
        title={editStock ? "Stok Düzenle" : "Yeni Malzeme Ekle"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        okText={editStock ? "Güncelle" : "Ekle"}
        cancelText="İptal"
        maskClosable={false}
        destroyOnClose
        okButtonProps={{
          style: { fontWeight: 600 },
          disabled: !(userRole === "admin" || userRole === "teknisyen"),
        }}
      >
        <Form
          layout="vertical"
          form={form}
          initialValues={initialForm}
          autoComplete="off"
        >
          <Form.Item
            label="Malzeme Adı"
            name="name"
            rules={[{ required: true, message: "Malzeme adı zorunlu!" }]}
          >
            <Input maxLength={48} disabled={userRole === "gözlemci"} />
          </Form.Item>
          <Form.Item label="Açıklama" name="description">
            <Input.TextArea maxLength={80} rows={2} disabled={userRole === "gözlemci"} />
          </Form.Item>
          <Form.Item label="Birim" name="unit">
            <Input maxLength={8} disabled={userRole === "gözlemci"} />
          </Form.Item>
          <Form.Item
            label="Mevcut Miktar"
            name="quantity"
            rules={[
              { required: true, message: "Miktar zorunlu!" },
              { type: "number", min: 0, message: "Negatif olamaz!" },
            ]}
            getValueFromEvent={e => Number(e.target.value)}
          >
            <Input
              type="number"
              min={0}
              max={1000000}
              disabled={userRole === "gözlemci"}
            />
          </Form.Item>
          <Form.Item
            label="Kritik Seviye"
            name="critical"
            rules={[
              { required: true, message: "Kritik seviye zorunlu!" },
              { type: "number", min: 0, message: "Negatif olamaz!" },
            ]}
            getValueFromEvent={e => Number(e.target.value)}
          >
            <Input
              type="number"
              min={0}
              max={100000}
              disabled={userRole === "gözlemci"}
            />
          </Form.Item>
        </Form>
      </Modal>

      {/* Miktar arttır/azalt modalı */}
      <Modal
        title={quantityDelta > 0 ? "Miktar Arttır" : "Miktar Azalt"}
        open={quantityModal}
        onCancel={() => setQuantityModal(false)}
        onOk={handleQuantityChange}
        okText="Uygula"
        cancelText="İptal"
        maskClosable={false}
        destroyOnClose
      >
                <div>
          <b>
            {selectedStock?.name} (Mevcut: {selectedStock?.quantity} {selectedStock?.unit || ""})
          </b>
          <Input
            type="number"
            min={1}
            max={quantityDelta > 0 ? 100000 : (selectedStock ? selectedStock.quantity : 0)}
            defaultValue={Math.abs(quantityDelta)}
            style={{ width: 140, marginTop: 12 }}
            onChange={e => {
              const val = Number(e.target.value);
              setQuantityDelta(quantityDelta > 0 ? val : -val);
            }}
          />
        </div>
      </Modal>
    </div>
  );
};

export default Stocks;
