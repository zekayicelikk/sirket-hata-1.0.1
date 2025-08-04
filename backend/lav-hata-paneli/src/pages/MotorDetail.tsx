import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Card, Typography, Spin, message, Button, Modal,
  Form, Input, Select, DatePicker, Space, Alert, Table, Row, Col, Tag, Statistic, Tooltip, Popconfirm
} from "antd";
import {
  PlusOutlined, PieChartOutlined, FileExcelOutlined, FilePdfOutlined, WarningOutlined,
  EditOutlined, DeleteOutlined, BarChartOutlined, EnvironmentOutlined, PrinterOutlined, HistoryOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { Pie, Line, Bar } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip as ChartTooltip, Legend, CategoryScale, LinearScale, PointElement, LineElement, BarElement } from "chart.js";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import type { ColumnsType } from "antd/es/table";
import api from "../api";

ChartJS.register(
  ArcElement, ChartTooltip, Legend,
  CategoryScale, LinearScale, PointElement, LineElement, BarElement
);

const { Title, Text } = Typography;
const { Option } = Select;

interface Motor {
  id: number;
  serial: string;
  name: string;
  description?: string;
  createdAt?: string;
  status?: string;
  location?: string;
  powerKW?: number;
  voltage?: string;
  current?: number;
  phase?: number;
  manufacturer?: string;
  modelNo?: string;
  year?: number;
  rpm?: number;
  protection?: string;
  connectionType?: string;
  lastService?: string;
  nextService?: string;
  isActive?: boolean;
  qrCode?: string;
  imageUrl?: string;
  notes?: string;
}

interface FaultType {
  id: number;
  name: string;
}
interface Fault {
  id: number;
  desc: string;
  date: string;
  duration?: number | string;
  faultType?: { id: number; name: string };
  user?: { email: string };
}

const getDateString = (date?: string | null) =>
  date ? new Date(date).toLocaleString("tr-TR") : "-";

// ---- SAĞLIK SKORU FONKSİYONU ----
function calculateHealthScore({
  totalFaults,
  lastFaultDate,
  nextService,
  isActive,
  lastService
}: {
  totalFaults: number,
  lastFaultDate: string | null,
  nextService: string | null,
  isActive: boolean | undefined,
  lastService: string | null
}) {
  let score = 100;
  // Fazla arıza
  if (totalFaults >= 5) score -= 25;
  else if (totalFaults >= 3) score -= 10;
  else if (totalFaults >= 1) score -= 5;
  // Son arıza yakınsa
  if (lastFaultDate) {
    const diffDays = (Date.now() - new Date(lastFaultDate).getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays < 7) score -= 25;
    else if (diffDays < 30) score -= 10;
  }
  // Planlı bakım tarihi geçtiyse
  if (nextService && new Date(nextService).getTime() < Date.now()) score -= 25;
  // Motor pasifse
  if (isActive === false) score -= 30;
  // Son bakım eskiyse
  if (lastService) {
    const diffYear = (Date.now() - new Date(lastService).getTime()) / (1000 * 60 * 60 * 24 * 365.25);
    if (diffYear > 2) score -= 15;
  }
  // Skor min 0 max 100
  score = Math.max(0, Math.min(100, score));
  let level: "good" | "warning" | "bad";
  if (score >= 85) level = "good";
  else if (score >= 60) level = "warning";
  else level = "bad";
  return { score, level };
}

const MotorDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [motor, setMotor] = useState<Motor | null>(null);
  const [faults, setFaults] = useState<Fault[]>([]);
  const [faultTypes, setFaultTypes] = useState<FaultType[]>([]);
  const [loading, setLoading] = useState(true);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();
  const [editForm] = Form.useForm();
  const [dangerFault, setDangerFault] = useState<string | null>(null);
  const [filteredFaults, setFilteredFaults] = useState<Fault[]>([]);
  const [filterType, setFilterType] = useState<number | null>(null);

  // Grafik ve analizler
  const [chartData, setChartData] = useState<any>(null);
  const [trendData, setTrendData] = useState<any>(null);
  const [lastMaintenance, setLastMaintenance] = useState<string | null>(null);

  // --- Data Fetch ---
  const fetchAll = async () => {
    setLoading(true);
    try {
      const [motorRes, faultRes, typesRes] = await Promise.all([
        api.get<Motor>(`/motors/${id}`),
        api.get<Fault[]>(`/records?motorId=${id}`),
        api.get<FaultType[]>(`/fault-types`),
      ]);
      setMotor(motorRes.data);
      setFaults(faultRes.data);
      setFaultTypes(typesRes.data);

      // Kritik arıza
      const faultCounts = faultRes.data.reduce((acc: any, f) => {
        const name = f.faultType?.name;
        if (!name) return acc;
        acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
      const mostRepeated = Object.entries(faultCounts).find(
        ([, count]) => Number(count) >= 3
      );
      setDangerFault(mostRepeated ? mostRepeated[0] as string : null);

      setChartData({
        labels: Object.keys(faultCounts),
        datasets: [{
          label: "Arıza Sayısı",
          data: Object.values(faultCounts),
          backgroundColor: [
            "#f87171", "#a78bfa", "#60a5fa", "#facc15", "#34d399", "#fb7185",
            "#fbbf24", "#38bdf8", "#818cf8", "#f472b6", "#22d3ee", "#a3e635",
          ],
        }]
      });

      // Line chart: Günlük arıza
      const byDay: { [day: string]: number } = {};
      faultRes.data.forEach((f) => {
        const d = new Date(f.date);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
        byDay[key] = (byDay[key] || 0) + 1;
      });
      setTrendData({
        labels: Object.keys(byDay),
        datasets: [{
          label: "Günlük Arıza",
          data: Object.values(byDay),
          tension: 0.2,
          borderColor: "#4f8bff",
          backgroundColor: "#b6cafe",
        }]
      });

      const sorted = [...faultRes.data].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setLastMaintenance(sorted.length > 0 ? sorted[0].date : null);

      setFilteredFaults(faultRes.data);
    } catch {
      message.error("Motor veya arıza geçmişi yüklenemedi.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, [id]);
  useEffect(() => {
    setFilteredFaults(filterType != null ? faults.filter(f => f.faultType?.id === filterType) : faults);
  }, [filterType, faults]);

  // Sağlık skoru
  const health = useMemo(() => {
    return calculateHealthScore({
      totalFaults: faults.length,
      lastFaultDate: faults.length > 0 ? faults[faults.length - 1].date : null,
      nextService: (motor as any)?.nextService || null,
      isActive: typeof (motor as any)?.isActive === "boolean" ? (motor as any)?.isActive : true,
      lastService: (motor as any)?.lastService || null,
    });
  }, [motor, faults]);

  // --- ANALİZLER ---
  const mtbf = useMemo(() => {
    if (faults.length < 2) return "-";
    const sorted = [...faults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let total = 0, n = 0;
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) / (1000 * 60 * 60);
      total += diff;
      n++;
    }
    return n > 0 ? `${Math.round(total / n)} saat` : "-";
  }, [faults]);

  const last30days = useMemo(() => {
    const now = Date.now();
    return faults.filter(f => new Date(f.date).getTime() >= (now - 30 * 24 * 60 * 60 * 1000)).length;
  }, [faults]);
  
  // TOPLAM SÜRE
  const totalDuration = useMemo(() => {
    return faults.reduce((sum, fault) => {
      let dur: number = 0;
      if (typeof fault.duration === "string") {
        const parsed = parseInt(fault.duration);
        dur = isNaN(parsed) ? 0 : parsed;
      } else if (typeof fault.duration === "number") {
        dur = fault.duration;
      }
      return sum + (dur || 0);
    }, 0);
  }, [faults]);

  // Ortalama süre ve standart sapma
  const avgDuration = useMemo(() => {
    const durations = faults.map(f => {
      if (typeof f.duration === "number") return f.duration;
      if (typeof f.duration === "string") return parseInt(f.duration) || 0;
      return 0;
    }).filter(x => x > 0);
    if (!durations.length) return { avg: 0, std: 0 };
    const avg = durations.reduce((a, b) => a + b, 0) / durations.length;
    const std = Math.sqrt(durations.reduce((a, b) => a + Math.pow(b - avg, 2), 0) / durations.length);
    return { avg: Math.round(avg), std: Math.round(std) };
  }, [faults]);

  // En sık 3 arıza
  const topFaults = useMemo(() => {
    if (!faults.length) return [];
    const counts: Record<string, number> = {};
    faults.forEach(f => {
      if (f.faultType?.name) counts[f.faultType.name] = (counts[f.faultType.name] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 3);
  }, [faults]);

  // Bar chart için
  const barChartData = useMemo(() => {
    const counts: Record<string, number> = {};
    faults.forEach(f => {
      if (f.faultType?.name) counts[f.faultType.name] = (counts[f.faultType.name] || 0) + 1;
    });
    return {
      labels: Object.keys(counts),
      datasets: [{
        label: "Arıza Adedi",
        data: Object.values(counts),
        backgroundColor: "#4f8bff",
        borderRadius: 8,
        barPercentage: 0.7,
        categoryPercentage: 0.7
      }]
    }
  }, [faults]);

  // Kümülatif arıza trendi
  const cumulativeTrend = useMemo(() => {
    const sorted = [...faults].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    let cum = 0;
    const labels: string[] = [];
    const data: number[] = [];
    sorted.forEach(f => {
      cum += 1;
      labels.push(getDateString(f.date));
      data.push(cum);
    });
    return {
      labels,
      datasets: [{
        label: "Kümülatif Arıza Sayısı",
        data,
        fill: false,
        borderColor: "#ad7fff",
        tension: 0.2,
        pointRadius: 2,
      }]
    }
  }, [faults]);

  // Kullanıcı bazlı arıza
  const userCounts = useMemo(() => {
    const users: Record<string, number> = {};
    faults.forEach(f => {
      const email = f.user?.email || "Bilinmiyor";
      users[email] = (users[email] || 0) + 1;
    });
    return Object.entries(users).sort((a, b) => b[1] - a[1]).slice(0, 5);
  }, [faults]);

  // --- Tablo
  const columns: ColumnsType<Fault> = [
    { title: "ID", dataIndex: "id", width: 50 },
    {
      title: "Arıza Tipi",
      dataIndex: "faultType",
      width: 140,
      render: (_: any, f: Fault) =>
        <Tag color={f.faultType?.name === dangerFault ? "error" : "blue"}>
          {f.faultType?.name || "-"}
        </Tag>
    },
    { title: "Açıklama", dataIndex: "desc", width: 200 },
    {
      title: "Süre (dk)", dataIndex: "duration", width: 100,
      render: (v: number | string) => v != null && v !== "" ? `${v} dk` : "-"
    },
    {
      title: "Kullanıcı",
      dataIndex: "user",
      width: 120,
      render: (user: Fault["user"]) => user?.email || "-"
    },
    {
      title: "Tarih",
      dataIndex: "date",
      width: 150,
      render: (d: string) => getDateString(d),
      sorter: (a: Fault, b: Fault) =>
        new Date(a.date).getTime() - new Date(b.date).getTime(),
      defaultSortOrder: "descend" as const
    },
    {
      title: "Sil",
      width: 70,
      render: (_: any, record: Fault) => (
        <Popconfirm
          title="Bu arıza kaydını silmek istediğinize emin misiniz?"
          onConfirm={async () => {
            await api.delete(`/records/${record.id}`);
            message.success("Arıza kaydı silindi!");
            fetchAll();
          }}
          okText="Evet"
          cancelText="Vazgeç"
        >
          <Button danger size="small" icon={<DeleteOutlined />} />
        </Popconfirm>
      )
    }
  ];

  // --- EXPORTLAR ---
  // --- GELİŞMİŞ CSV EXPORT ---
  const handleExportCSV = () => {
    // UTF-8 BOM ve açıklamalı başlıklar
    const header = [
      "ID",
      "Arıza Tipi",
      "Açıklama",
      "Süre (dk)",
      "Kullanıcı",
      "Tarih",
      "Motor İsmi",
      "Seri No",
      "Durum",
      "Lokasyon",
      "Güç (kW)",
      "Gerilim (V)",
      "Akım (A)",
      "Faz",
      "Üretici",
      "Model No",
      "Yıl",
      "RPM",
      "Koruma",
      "Bağlantı Tipi",
      "Son Bakım",
      "Planlı Bakım",
      "Sağlık Skoru (%)"
    ];
    const rows = filteredFaults.map((f) => [
      f.id,
      f.faultType?.name || "-",
      f.desc,
      f.duration != null && f.duration !== "" ? `${f.duration}` : "-",
      f.user?.email || "-",
      getDateString(f.date),
      motor?.name || "-",
      motor?.serial || "-",
      motor?.status || "-",
      (motor as any)?.location || "-",
      (motor as any)?.powerKW || "-",
      (motor as any)?.voltage || "-",
      (motor as any)?.current || "-",
      (motor as any)?.phase || "-",
      (motor as any)?.manufacturer || "-",
      (motor as any)?.modelNo || "-",
      (motor as any)?.year || "-",
      (motor as any)?.rpm || "-",
      (motor as any)?.protection || "-",
      (motor as any)?.connectionType || "-",
      (motor as any)?.lastService ? getDateString((motor as any)?.lastService) : "-",
      (motor as any)?.nextService ? getDateString((motor as any)?.nextService) : "-",
      health?.score ?? "-"
    ]);
    // UTF-8 BOM ekle, Excel/Türkçe bozulmaz
    const csvContent =
      "\uFEFF" +
      [header, ...rows]
        .map((r) =>
          r
            .map((c) =>
              typeof c === "string"
                ? `"${c.replace(/"/g, '""')}"`
                : c == null
                ? ""
                : c
            )
            .join(";")
        )
        .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `motor_${motor?.name || "bilgi"}_arizalar.csv`);
  };

  // PDF/PRINT aynı kalabilir

  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text(`Motor: ${motor?.name} - Arıza Geçmişi`, 14, 16);
    (doc as any).autoTable({
      head: [["ID", "Tip", "Açıklama", "Süre", "Kullanıcı", "Tarih", "Sağlık Skoru"]],
      body: filteredFaults.map((f) => [
        f.id,
        f.faultType?.name || "-",
        f.desc,
        f.duration != null && f.duration !== "" ? `${f.duration} dk` : "-",
        f.user?.email || "-",
        getDateString(f.date),
        health?.score ?? "-"
      ]),
      startY: 24,
    });
    doc.save(`motor_${motor?.name}_arizalar.pdf`);
  };

  const handlePrint = () => window.print();

  const handleEdit = async () => {
    try {
      const values = await editForm.validateFields();
      await api.put(`/motors/${motor!.id}`, values);
      setEditModal(false);
      message.success("Motor güncellendi");
      fetchAll();
    } catch (e) { message.error("Güncelleme hatası"); }
  };

  if (loading) return <Spin style={{ marginTop: 64, display: "block" }} size="large" />;
  if (!motor)
    return (<div style={{ padding: 40 }}><Title level={4}>Motor bulunamadı!</Title></div>);

  return (
    <div style={{ maxWidth: 1350, margin: "0 auto", padding: 32 }}>
      <Row gutter={[24, 24]}>
        {/* SOL PANEL */}
        <Col xs={24} md={8}>
          <Card
            title={<span style={{ fontWeight: 800, fontSize: 22 }}>Motor Bilgileri</span>}
            extra={<Button icon={<ReloadOutlined />} onClick={fetchAll} />}
            bordered={false}
            style={{ borderRadius: 22, boxShadow: "0 4px 24px #cab6f82c", marginBottom: 22, minHeight: 420 }}
            bodyStyle={{ fontSize: 17, padding: "28px 18px" }}
          >
            <Text strong>ID: </Text> {motor.id} <br />
            <Text strong>Seri No: </Text> {motor.serial} <br />
            <Text strong>İsim: </Text> {motor.name} <br />
            <Text strong>Açıklama: </Text> {motor.description || "-"} <br />
            <Text strong>Eklenme: </Text> {getDateString(motor.createdAt)} <br />
            <Text strong>Durum: </Text>
            <Tag color={
              motor.status === "Aktif" ? "green"
                : motor.status === "Pasif" ? "gold"
                : "red"
            }>
              {motor.status || "Bilinmiyor"}
            </Tag>
            {motor.location && (
              <>
                <br />
                <Text strong>Lokasyon: </Text>
                <Tag color="blue" icon={<EnvironmentOutlined />}>{motor.location}</Tag>
              </>
            )}
            {/* SAĞLIK DURUMU SKORU ve BAR */}
            <div style={{ margin: "22px 0 8px 0" }}>
              <Text strong>Sağlık Durumu: </Text>
              <Tag
                color={
                  health.level === "good"
                    ? "green"
                    : health.level === "warning"
                    ? "gold"
                    : "red"
                }
                style={{
                  fontWeight: 700,
                  fontSize: 18,
                  padding: "5px 18px",
                  borderRadius: 16,
                  background:
                    health.level === "good"
                      ? "linear-gradient(90deg,#6ee7b7 60%,#10b981 100%)"
                      : health.level === "warning"
                      ? "linear-gradient(90deg,#fcd34d 60%,#f59e42 100%)"
                      : "linear-gradient(90deg,#feb2b2 60%,#f43f5e 100%)"
                }}
              >
                %{health.score} {health.level === "good"
                  ? "Sağlam"
                  : health.level === "warning"
                  ? "Dikkat"
                  : "Kritik"}
              </Tag>
              <div style={{ margin: "8px 0 16px 0" }}>
                <div style={{
                  background: "#eee",
                  borderRadius: 8,
                  height: 18,
                  width: "100%",
                  marginBottom: 4,
                  overflow: "hidden",
                }}>
                  <div
                    style={{
                      width: `${health.score}%`,
                      height: "100%",
                      background:
                        health.level === "good"
                          ? "linear-gradient(90deg,#34d399,#10b981)"
                          : health.level === "warning"
                          ? "linear-gradient(90deg,#fde68a,#fbbf24)"
                          : "linear-gradient(90deg,#fca5a5,#ef4444)",
                      transition: "width 0.5s"
                    }}
                  />
                </div>
                <Text type="secondary" style={{ fontSize: 13 }}>
                  Son arıza, toplam arıza, bakım gecikmesi, aktiflik ve son bakım yılı dikkate alınır.
                </Text>
              </div>
            </div>
            {/* / SAĞLIK DURUMU */}
            <div style={{ marginTop: 24 }}>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                block
                onClick={() => setAddModal(true)}
                style={{ fontWeight: 700, background: "linear-gradient(90deg,#ad7fff 60%,#7136bd 100%)", border: "none", borderRadius: 10 }}
              >
                Bu Motora Arıza Ekle
              </Button>
              <Space style={{ width: "100%", marginTop: 18 }}>
                <Button icon={<EditOutlined />} block onClick={() => { setEditModal(true); editForm.setFieldsValue(motor); }}>Düzenle</Button>
                {/* Sil butonu KALDIRILDI! */}
              </Space>
            </div>
          </Card>
          {/* Stat Kartları */}
          <Card bordered={false} style={{ borderRadius: 20, marginBottom: 16, boxShadow: "0 2px 18px #b7c0fa22" }} bodyStyle={{ padding: "20px 16px" }}>
            <Row gutter={16}>
              <Col span={12}><Statistic title="Son 30 Gün Arıza" value={last30days} valueStyle={{ color: "#faad14" }} /></Col>
              <Col span={12}><Statistic title="Toplam Arıza" value={faults.length} valueStyle={{ color: "#ff4d4f" }} /></Col>
              <Col span={12} style={{ marginTop: 22 }}><Statistic title="En Sık Tip" value={topFaults[0]?.[0] || "-"} valueStyle={{ color: "#2f54eb" }} /></Col>
              <Col span={12} style={{ marginTop: 22 }}><Statistic title="Toplam Süre" value={totalDuration + " dk"} valueStyle={{ color: "#b37feb" }} /></Col>
              <Col span={12} style={{ marginTop: 22 }}>
                <Statistic
                  title="Ortalama Süre"
                  value={avgDuration.avg + " dk"}
                  valueStyle={{ color: "#1677ff" }}
                  suffix={
                    avgDuration.std > 0
                      ? <span style={{ fontSize: 12, color: "#1677ff" }}> (±{avgDuration.std} dk)</span>
                      : null
                  }
                />
              </Col>
              <Col span={12} style={{ marginTop: 22 }}><Statistic title="MTBF" value={mtbf} valueStyle={{ color: "#ad7fff" }} suffix={<Tooltip title="Arıza arası ortalama saat"><BarChartOutlined /></Tooltip>} /></Col>
              <Col span={12} style={{ marginTop: 22 }}><Statistic title="Son Bakım" value={getDateString(lastMaintenance)} valueStyle={{ color: "#13c2c2" }} /></Col>
            </Row>
          </Card>
          {/* Pie Chart */}
          {chartData && (<Card title={<><PieChartOutlined /> Arıza Dağılımı</>} bordered={false} style={{ borderRadius: 20, boxShadow: "0 2px 16px #cfd0fa17" }} bodyStyle={{ padding: 12, minHeight: 240 }}><Pie data={chartData} /></Card>)}
        </Col>
        {/* SAĞ PANEL */}
        <Col xs={24} md={16}>
          {dangerFault && (<Alert type="error" message={<span><WarningOutlined style={{ color: "#b80070", marginRight: 8 }} /> Bu motor son dönemde <b>3 kez "{dangerFault}"</b> arızası verdi! Lütfen kontrol ediniz.</span>} showIcon style={{ marginBottom: 16, fontSize: 17, fontWeight: 500 }} />)}
          <Row align="middle" justify="space-between" style={{ marginBottom: 14 }}>
            <Title level={3} style={{ margin: 0 }}>Geçmiş Arıza Kayıtları</Title>
            <Space>
              <Select allowClear style={{ width: 220 }} placeholder="Arıza tipine göre filtrele" value={filterType ?? undefined} onChange={(v) => setFilterType(v ?? null)}>
                {faultTypes.map((f) => (<Option key={f.id} value={f.id}>{f.name}</Option>))}
              </Select>
              <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>CSV</Button>
              <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
              <Tooltip title="Tabloyu Yazdır"><Button icon={<PrinterOutlined />} onClick={handlePrint} /></Tooltip>
            </Space>
          </Row>
          <Table<Fault>
            dataSource={filteredFaults}
            columns={columns}
            rowKey="id"
            pagination={{ pageSize: 8 }}
            bordered
            size="middle"
            style={{ borderRadius: 18 }}
            locale={{ emptyText: "Bu motora ait arıza kaydı yok." }}
            rowClassName={f =>
              f.faultType?.name === dangerFault
                ? "danger-row"
                : ""
            }
          />

          {/* --- ANALİZ KARTLARI ve GRAFİKLER --- */}
          <Row gutter={[20, 20]} style={{ marginTop: 22 }}>
            <Col xs={24} md={12}>
              <Card title={<span><BarChartOutlined /> Arıza Tipine Göre Dağılım</span>} bordered style={{ borderRadius: 16, minHeight: 260 }}>
                <Bar data={barChartData} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title={<span><BarChartOutlined /> Kümülatif Arıza Sayısı</span>} bordered style={{ borderRadius: 16, minHeight: 260 }}>
                <Line data={cumulativeTrend} />
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="En Sık Karşılaşılan 3 Arıza Tipi" bordered style={{ borderRadius: 16 }}>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {topFaults.map(([name, count]) => (
                    <li key={name}><b>{name}:</b> {count} kez ({Math.round((count as number) * 100 / faults.length)}%)</li>
                  ))}
                </ul>
              </Card>
            </Col>
            <Col xs={24} md={12}>
              <Card title="En Aktif 5 Kullanıcı" bordered style={{ borderRadius: 16 }}>
                <ul style={{ paddingLeft: 16, margin: 0 }}>
                  {userCounts.map(([email, count]) => (
                    <li key={email}><b>{email}:</b> {count} kayıt</li>
                  ))}
                </ul>
              </Card>
            </Col>
          </Row>
          {/* Kullanıcı hareketleri */}
          <Card title={<span><HistoryOutlined /> Kullanıcı Hareketleri</span>} style={{ marginTop: 22, borderRadius: 18 }}>
            <Table<Fault>
              dataSource={[...faults].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())}
              columns={[
                { title: "Tarih", dataIndex: "date", render: getDateString },
                { title: "Kullanıcı", dataIndex: ["user", "email"], render: (_: any, f: Fault) => f.user?.email || "-" },
                { title: "Tip", dataIndex: ["faultType", "name"], render: (_: any, f: Fault) => f.faultType?.name || "-" },
                { title: "Açıklama", dataIndex: "desc" }
              ]}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: "Hareket yok." }}
            />
          </Card>
        </Col>
      </Row>
      {/* Arıza ekleme modalı */}
      <Modal title="Arıza Kaydı Ekle" open={addModal} onCancel={() => setAddModal(false)} onOk={async () => {
        try {
          const values = await form.validateFields();
          await api.post("/records", {
            motorId: Number(id),
            faultTypeId: values.faultTypeId,
            desc: values.desc,
            duration: values.duration,
            date: values.date ? values.date.toISOString() : undefined,
          });
          message.success("Arıza başarıyla kaydedildi!");
          setAddModal(false); form.resetFields(); fetchAll();
        } catch (err: any) {
          message.error(err.response?.data?.error || "Arıza eklenemedi!");
        }
      }} okText="Kaydet" cancelText="İptal" destroyOnClose>
        <Form form={form} layout="vertical" preserve={false}>
          <Form.Item label="Arıza Tipi" name="faultTypeId" rules={[{ required: true, message: "Arıza tipi seçin" }]}>
            <Select placeholder="Arıza tipi seçin">
              {faultTypes.map((f) => (<Option key={f.id} value={f.id}>{f.name}</Option>))}
            </Select>
          </Form.Item>
          <Form.Item label="Açıklama" name="desc" rules={[{ required: true, message: "Açıklama girin" }]}>
            <Input.TextArea rows={3} maxLength={256} />
          </Form.Item>
          <Form.Item label="Süre (dakika)" name="duration"><Input type="number" min={1} /></Form.Item>
          <Form.Item label="Tarih" name="date"><DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" /></Form.Item>
        </Form>
      </Modal>
      {/* Motor düzenleme modalı */}
      <Modal title="Motor Bilgilerini Düzenle" open={editModal} onCancel={() => setEditModal(false)} onOk={handleEdit} okText="Kaydet" cancelText="İptal" destroyOnClose>
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item label="İsim" name="name" rules={[{ required: true, message: "İsim girin" }]}><Input /></Form.Item>
          <Form.Item label="Seri No" name="serial" rules={[{ required: true, message: "Seri no girin" }]}><Input /></Form.Item>
          <Form.Item label="Açıklama" name="description"><Input /></Form.Item>
          <Form.Item label="Lokasyon" name="location"><Input /></Form.Item>
          <Form.Item label="Durum" name="status"><Select>
            <Option value="Aktif">Aktif</Option>
            <Option value="Pasif">Pasif</Option>
            <Option value="Servis Dışı">Servis Dışı</Option>
          </Select></Form.Item>
        </Form>
      </Modal>
      <style>
        {`
        .danger-row td { background: #fff1f0 !important; }
        @media print { .ant-layout-header,.ant-layout-sider,button,.ant-modal {display:none!important;} }
        `}
      </style>
    </div>
  );
};

export default MotorDetail;
