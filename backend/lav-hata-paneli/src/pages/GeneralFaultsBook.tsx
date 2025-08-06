import React, { useEffect, useState } from "react";
import {
  Table, Modal, Form, Input, Button, DatePicker, Select, message,
  Space, Tag, Statistic, Card, Row, Col, Tooltip, Popconfirm
} from "antd";
import {
  PlusOutlined, ReloadOutlined, FileExcelOutlined,
  InfoCircleOutlined, DeleteOutlined
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import api from "../api";
import moment from "moment";

interface Line { id: number; code: string; name: string; }
interface User { id: number; email: string; role: string; }
interface Stock { id: number; name: string; quantity: number; critical: number; }
interface StockUsage { stockId: number; amount: number; name?: string; }
interface GeneralFault {
  id: number;
  description: string;
  date: string;
  location: string;
  productionImpact: boolean;
  lines: { line: Line; downtimeMin: number }[];
  user: User;
  createdAt: string;
  stockUsages?: { amount: number; stock: { name: string; id: number; }; }[];
}

const FaultBookEnterprise: React.FC = () => {
  const [faults, setFaults] = useState<GeneralFault[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();
  const [detail, setDetail] = useState<GeneralFault | null>(null);
  const [search, setSearch] = useState("");
  const [filterLine, setFilterLine] = useState<number[]>([]);
  const [filterImpact, setFilterImpact] = useState<null | boolean>(null);
  const [stats, setStats] = useState({ total: 0, affected: 0, notAffected: 0 });

  // Kullanıcı rolü
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
    setIsAdmin(user?.role === "admin");
  }, []);

  // Hatlar & Stoklar çek
  const fetchLines = async () => {
    try {
      const res = await api.get<Line[]>("/production-lines");
      setLines(res.data);
    } catch { message.error("Hatlar alınamadı."); }
  };
  const fetchStocks = async () => {
    try {
      const res = await api.get<Stock[]>("/stocks");
      setStocks(res.data);
    } catch { message.error("Stoklar alınamadı."); }
  };

  // Arızalar
  const fetchFaults = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (filterLine.length > 0) params.line = filterLine[0];
      if (filterImpact !== null) params.productionImpact = filterImpact;
      const res = await api.get<GeneralFault[]>("/general-faults", { params });
      let data = res.data;
      if (search)
        data = data.filter((f) =>
          f.description?.toLowerCase().includes(search.toLowerCase())
        );
      setFaults(data);
      calcStats(data);
    } catch { message.error("Arızalar alınamadı."); }
    finally { setLoading(false); }
  };

  // İstatistik
  const calcStats = (data: GeneralFault[]) => {
    const total = data.length;
    const affected = data.filter((f) => f.productionImpact).length;
    const notAffected = data.filter((f) => !f.productionImpact).length;
    setStats({ total, affected, notAffected });
  };

  // Excel
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      faults.map((f) => ({
        Açıklama: f.description,
        Lokasyon: f.location,
        "Üretimi Etkiledi": f.productionImpact ? "Evet" : "Hayır",
        "Hat(lar)": f.lines.map((l) => `${l.line.code} (${l.downtimeMin}dk)`).join(", "),
        "Kullanıcı": f.user?.email,
        Tarih: moment(f.date).format("DD.MM.YYYY HH:mm"),
        "Kullanılan Malzemeler": f.stockUsages
          ? f.stockUsages.map(su => `${su.stock.name} (${su.amount} adet)`).join(", ")
          : "-"
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Arizalar");
    XLSX.writeFile(wb, "ariza-defteri.xlsx");
  };

  // Modal/hat/stoklar
  const [impact, setImpact] = useState(true);
  const [selectedLines, setSelectedLines] = useState<number[]>([]);
  const [usedStocks, setUsedStocks] = useState<StockUsage[]>([]);
  useEffect(() => {
    if (!modalOpen) {
      setImpact(true); setSelectedLines([]); setUsedStocks([]);
      form.resetFields();
    }
  }, [modalOpen]);

  useEffect(() => { fetchLines(); fetchStocks(); }, []);
  useEffect(() => { fetchFaults(); }, [search, filterLine, filterImpact]);

  // Stok ekle/kaldır
  const addStockUsage = () => setUsedStocks([...usedStocks, { stockId: undefined as any, amount: 1 }]);
  const updateStockUsage = (idx: number, field: "stockId" | "amount", value: any) => {
    const updated = [...usedStocks];
    updated[idx][field] = value;
    setUsedStocks(updated);
  };
  const removeStockUsage = (idx: number) => setUsedStocks(usedStocks.filter((_, i) => i !== idx));

  // Yeni arıza ekle
  const handleAdd = async () => {
    try {
      const user = JSON.parse(localStorage.getItem("userInfo") || "{}");
      const userId = user?.id || 1;
      const values = await form.validateFields();

      // Kullanılan stoklar ekle
      const stocksToSend = usedStocks
        .filter((s) => !!s.stockId && s.amount > 0)
        .map((s) => ({
          stockId: s.stockId,
          amount: Number(s.amount),
          note: `Arıza ile kullanıldı`
        }));

      await api.post("/general-faults", {
        description: values.description,
        location: values.location,
        date: values.date ? values.date.toISOString() : undefined,
        userId,
        productionImpact: values.productionImpact,
        lines:
          values.productionImpact && Array.isArray(values.lines)
            ? values.lines.map((lineId: number) => ({
                lineId,
                downtimeMin: Number(values[`downtimeMin_${lineId}`]) || 0,
              }))
            : [],
        usedStocks: stocksToSend
      });
      message.success("Arıza eklendi! Stoklar otomatik güncellendi.");
      setModalOpen(false); form.resetFields(); setUsedStocks([]);
      fetchFaults(); fetchStocks();
    } catch (e: any) {
      message.error("Ekleme başarısız: " + (e?.response?.data?.error || ""));
    }
  };

  // Silme (sadece admin için)
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/general-faults/${id}`);
      message.success("Arıza silindi.");
      fetchFaults();
    } catch { message.error("Silme başarısız."); }
  };

  // Tablo sütunları
  const columns = [
    {
      title: "Açıklama",
      dataIndex: "description",
      render: (desc: string, record: GeneralFault) => (
        <a style={{ fontWeight: 500, fontSize: 15 }} onClick={() => setDetail(record)}>{desc}</a>
      ),
      ellipsis: true, width: 240,
    },
    { title: "Lokasyon", dataIndex: "location", width: 110, render: (loc: string) => <span style={{ color: "#6d6d6d" }}>{loc}</span> },
    {
      title: "Üretim Etkisi",
      dataIndex: "productionImpact",
      render: (v: boolean) =>
        v ? <Tag color="error">Etkiledi</Tag> : <Tag color="success">Etkilemedi</Tag>,
      width: 120,
    },
    {
      title: "Hat(lar)",
      dataIndex: "lines",
      render: (lines: any[]) =>
        lines?.length ? (
          <Space>
            {lines.map((l) => (
              <Tag key={l.line.id} color="geekblue">
                {l.line.code} <span style={{ fontWeight: 500 }}>{l.downtimeMin}dk</span>
              </Tag>
            ))}
          </Space>
        ) : (
          <Tag color="default">-</Tag>
        ),
      width: 200,
    },
    {
      title: "Kullanıcı",
      dataIndex: ["user", "email"],
      render: (v: string) => <span style={{ color: "#343f58" }}>{v || "-"}</span>,
      width: 170,
    },
    {
      title: "Tarih",
      dataIndex: "date",
      render: (d: string) => (
        <span style={{
          fontWeight: 600, color: "#24292f", background: "#fafafa",
          padding: "3px 12px", borderRadius: 8, fontSize: 15
        }}>
          {moment(d).format("DD.MM.YYYY HH:mm")}
        </span>
      ),
      width: 150,
      fixed: "right" as any
    },
    {
      title: "",
      width: 120,
      render: (_: any, record: GeneralFault) => (
        <Space>
          <Tooltip title="Detay">
            <Button
              size="small"
              icon={<InfoCircleOutlined />}
              onClick={() => setDetail(record)}
              style={{ borderColor: "#a6c1ee", color: "#1e40af" }}
            />
          </Tooltip>
          {isAdmin && (
            <Popconfirm
              title="Bu arızayı silmek istediğinize emin misiniz?"
              onConfirm={() => handleDelete(record.id)}
              okText="Evet"
              cancelText="İptal"
            >
              <Button
                size="small"
                danger
                icon={<DeleteOutlined />}
                style={{ background: "#f2e4e4", color: "#b71c1c", borderColor: "#cfd8dc" }}
              />
            </Popconfirm>
          )}
        </Space>
      ),
    },
  ];

  // Kullanılan stokları formda göstermek için UI
  const renderStockUsages = () => (
    <div style={{ marginTop: 10 }}>
      <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
        Kullanılan Malzemeler:
        <Button
          icon={<PlusOutlined />}
          size="small"
          style={{ marginLeft: 10, fontWeight: 500 }}
          onClick={addStockUsage}
          type="dashed"
        >
          Ekle
        </Button>
      </div>
      {usedStocks.length === 0 && <Tag color="default">Malzeme eklenmedi</Tag>}
      {usedStocks.map((us, idx) => (
        <Space key={idx} style={{ marginBottom: 6 }}>
          <Select
            placeholder="Malzeme seç"
            style={{ width: 180 }}
            value={us.stockId}
            onChange={v => updateStockUsage(idx, "stockId", v)}
            showSearch
            optionFilterProp="children"
          >
            {stocks.map(st => (
              <Select.Option key={st.id} value={st.id} disabled={st.quantity <= 0}>
                {st.name} <span style={{ color: "#888" }}>({st.quantity} adet)</span>
              </Select.Option>
            ))}
          </Select>
          <Input
            type="number"
            min={1}
            max={stocks.find(s => s.id === us.stockId)?.quantity || 99}
            placeholder="Adet"
            style={{ width: 80 }}
            value={us.amount}
            onChange={e => updateStockUsage(idx, "amount", e.target.value)}
          />
          <Button danger type="link" onClick={() => removeStockUsage(idx)}>Sil</Button>
        </Space>
      ))}
    </div>
  );

  // Kullanılan stokları detayda göster
  const renderStockUsageDetail = (fault: GeneralFault) =>
    fault.stockUsages && fault.stockUsages.length > 0 && (
      <div style={{ marginTop: 10 }}>
        <b>Kullanılan Malzemeler:</b>
        <ul style={{ paddingLeft: 20 }}>
          {fault.stockUsages.map(su => (
            <li key={su.stock.id}>
              <Tag color="purple">{su.stock.name}</Tag>
              <span style={{ fontWeight: 500 }}> x {su.amount} adet</span>
            </li>
          ))}
        </ul>
      </div>
    );

  return (
    <div style={{ maxWidth: 960, margin: "40px auto" }}>
      {/* İstatistik kutuları */}
      <Row gutter={16} style={{ marginBottom: 18 }}>
        <Col flex={1}><Card variant="borderless"><Statistic title="Toplam Arıza" value={stats.total} /></Card></Col>
        <Col flex={1}><Card variant="borderless"><Statistic title="Üretimi Etkileyen" value={stats.affected} valueStyle={{ color: "#cf1322" }} /></Card></Col>
        <Col flex={1}><Card variant="borderless"><Statistic title="Üretimi Etkilemeyen" value={stats.notAffected} valueStyle={{ color: "#3f8600" }} /></Card></Col>
      </Row>
      {/* Filtreler */}
      <Space style={{ marginBottom: 18, flexWrap: "wrap" }}>
        <Input.Search allowClear style={{ width: 220 }} placeholder="Açıklama ara..." onSearch={setSearch} />
        <Select mode="multiple" style={{ width: 180 }} allowClear placeholder="Hat seç" onChange={setFilterLine} options={lines.map((l) => ({ value: l.id, label: l.code }))} />
        <Select allowClear style={{ width: 160 }} placeholder="Üretim Etkisi" onChange={setFilterImpact} options={[{ value: true, label: "Etkiledi" }, { value: false, label: "Etkilemedi" }]} />
        <Button icon={<ReloadOutlined />} onClick={fetchFaults}>Yenile</Button>
        <Button icon={<PlusOutlined />} type="primary" onClick={() => setModalOpen(true)}>Yeni Arıza</Button>
        <Button icon={<FileExcelOutlined />} onClick={exportExcel}>Excel</Button>
      </Space>
      {/* Tablo */}
      <Table
        dataSource={faults}
        columns={columns}
        rowKey="id"
        loading={loading}
        bordered
        size="middle"
        pagination={{ pageSize: 10, showSizeChanger: true }}
        scroll={{ x: 950 }}
        style={{ background: "#f8fafd", borderRadius: 18 }}
        rowClassName={(_, i) => (i % 2 === 0 ? "even-row" : "odd-row")}
      />
      {/* Ekle Modal */}
      <Modal
        open={modalOpen}
        title="Yeni Arıza"
        onCancel={() => setModalOpen(false)}
        onOk={() => form.submit()}
        okText="Kaydet"
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ productionImpact: true }}
          onFinish={handleAdd}
        >
          <Form.Item label="Açıklama" name="description" rules={[{ required: true, message: "Açıklama girin" }]}>
            <Input.TextArea />
          </Form.Item>
          <Form.Item label="Lokasyon" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="Tarih" name="date" rules={[{ required: true, message: "Tarih seçin" }]}>
            <DatePicker showTime style={{ width: "100%" }} format="DD.MM.YYYY HH:mm" />
          </Form.Item>
          <Form.Item label="Üretimi Etkiledi mi?" name="productionImpact" rules={[{ required: true, message: "Bu alan zorunlu" }]}>
            <Select
              onChange={v => {
                setImpact(v);
                if (!v) { setSelectedLines([]); form.setFieldsValue({ lines: [] }); }
              }}
            >
              <Select.Option value={true}>Evet</Select.Option>
              <Select.Option value={false}>Hayır</Select.Option>
            </Select>
          </Form.Item>
          {impact && (
            <>
              <Form.Item label="Etkilenen Hat(lar)" name="lines" rules={[{ required: true, message: "Hat seçin", type: "array" }]}>
                <Select mode="multiple" onChange={setSelectedLines} options={lines.map((l) => ({ value: l.id, label: l.code }))} />
              </Form.Item>
              {selectedLines.map((lid) => (
                <Form.Item
                  key={lid}
                  label={`Duruş Süresi (dk) - ${lines.find((l) => l.id === lid)?.code}`}
                  name={`downtimeMin_${lid}`}
                  rules={[
                    { required: true, message: "Süre girin" },
                    { pattern: /^[0-9]+$/, message: "Pozitif tam sayı girin" },
                  ]}
                >
                  <Input />
                </Form.Item>
              ))}
            </>
          )}
          {/* --- MALZEME KULLANIMI ALANI --- */}
          {renderStockUsages()}
        </Form>
      </Modal>
      {/* Detay Modalı */}
      <Modal
        title="Arıza Detayı"
        open={!!detail}
        onCancel={() => setDetail(null)}
        footer={null}
        width={600}
      >
        {detail && (
          <div>
            <p><b>Açıklama:</b> {detail.description}</p>
            <p><b>Tarih:</b> {moment(detail.date).format("DD.MM.YYYY HH:mm")}</p>
            <p><b>Lokasyon:</b> {detail.location}</p>
            <p>
              <b>Üretim Etkisi:</b>{" "}
              {detail.productionImpact ? (
                <Tag color="red">Etkiledi</Tag>
              ) : (
                <Tag color="green">Etkilemedi</Tag>
              )}
            </p>
            <p>
              <b>Hat(lar):</b>{" "}
              {detail.lines.map((l) => (
                <Tag key={l.line.id}>{l.line.code} ({l.downtimeMin}dk)</Tag>
              ))}
            </p>
            <p>
              <b>Kullanıcı:</b> {detail.user?.email || "-"}
            </p>
            <p>
              <b>Kayıt Tarihi:</b> {moment(detail.createdAt).format("DD.MM.YYYY HH:mm")}
            </p>
            {renderStockUsageDetail(detail)}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default FaultBookEnterprise;
