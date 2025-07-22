import React, { useEffect, useState, useMemo } from "react";
import {
  Table, Card, Row, Col, Typography, Input, Select, Button,
  DatePicker, Tag, Space, Statistic, message
} from "antd";
import {
  SearchOutlined, ReloadOutlined, FileExcelOutlined
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import api from "../api";
import dayjs from "dayjs";
import "dayjs/locale/tr";
import trTR from "antd/es/date-picker/locale/tr_TR";

const { Title } = Typography;
const { RangePicker } = DatePicker;
const { Option } = Select;

// ... (interface'ler aynı)

interface Line { id: number; code: string; name: string; }
interface User { email: string; }
interface FaultLine { line: Line; downtimeMin: number; }
interface GeneralFault {
  id: number;
  description: string;
  date: string;
  location: string;
  productionImpact: boolean;
  user: User;
  lines: FaultLine[];
}
interface DowntimeRow {
  key: string;
  date: string;
  description: string;
  location: string;
  productionImpact: boolean;
  hat: string;
  downtimeMin: number;
  user: string;
}

const FaultDowntimeDashboard: React.FC = () => {
  const [faults, setFaults] = useState<GeneralFault[]>([]);
  const [lines, setLines] = useState<Line[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedLine, setSelectedLine] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<[any, any] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [faultsRes, linesRes] = await Promise.all([
          api.get<GeneralFault[]>("/general-faults"),
          api.get<Line[]>("/production-lines"),
        ]);
        setFaults(faultsRes.data);
        setLines(linesRes.data);
      } catch {
        message.error("Veriler alınamadı.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Satırlar
  const downtimeRows = useMemo(() => {
    let rows: DowntimeRow[] = [];
    faults.forEach((fault) => {
      fault.lines.forEach((line) => {
        rows.push({
          key: `${fault.id}-${line.line.id}`,
          date: fault.date,
          description: fault.description,
          location: fault.location,
          productionImpact: fault.productionImpact,
          hat: line.line.code,
          downtimeMin: line.downtimeMin,
          user: fault.user?.email || "-",
        });
      });
    });
    if (search)
      rows = rows.filter(
        (r) =>
          r.hat.toLowerCase().includes(search.toLowerCase()) ||
          r.description.toLowerCase().includes(search.toLowerCase()) ||
          r.location?.toLowerCase().includes(search.toLowerCase()) ||
          r.user.toLowerCase().includes(search.toLowerCase())
      );
    if (selectedLine)
      rows = rows.filter((r) => r.hat === selectedLine);
    if (dateRange)
      rows = rows.filter((r) => {
        const d = dayjs(r.date);
        return (
          d.isAfter(dateRange[0].startOf("day").subtract(1, "second")) &&
          d.isBefore(dateRange[1].endOf("day").add(1, "second"))
        );
      });
    rows.sort((a, b) => dayjs(b.date).valueOf() - dayjs(a.date).valueOf());
    return rows;
  }, [faults, search, selectedLine, dateRange]);

  // Analizler
  const todayStr = dayjs().format("YYYY-MM-DD");
  const todayRows = useMemo(
    () => downtimeRows.filter(r => dayjs(r.date).format("YYYY-MM-DD") === todayStr),
    [downtimeRows, todayStr]
  );
  const todayTotalDowntime = todayRows.reduce((sum, row) => sum + row.downtimeMin, 0);
  const todayLastDowntime = todayRows[0];

  const haftalikRows = useMemo(() => {
    const start = dayjs().subtract(6, "day");
    return downtimeRows.filter(r => dayjs(r.date).isAfter(start.subtract(1, "second")));
  }, [downtimeRows]);
  // Hatları alfabetik sırala!
  const haftalikHatSuresi: Record<string, number> = {};
  haftalikRows.forEach((row) => {
    haftalikHatSuresi[row.hat] = (haftalikHatSuresi[row.hat] || 0) + row.downtimeMin;
  });
  // Sıralama
  const haftalikHatlarSorted = Object.entries(haftalikHatSuresi)
    .sort((a, b) => a[0].localeCompare(b[0], 'tr', { numeric: true }));

  // En çok duran hat (haftalık)
  const haftalikMaxHatEntry = Object.entries(haftalikHatSuresi)
    .sort((a, b) => b[1] - a[1])[0] || ["-", 0];
  const haftalikMaxHat = haftalikMaxHatEntry[0];
  const haftalikMaxHatSure = haftalikMaxHatEntry[1];

  // ----------- Excel Export -----------
  const exportExcel = () => {
    const ws = XLSX.utils.json_to_sheet(
      downtimeRows.map((row) => ({
        "Tarih": dayjs(row.date).format("DD.MM.YYYY HH:mm"),
        "Açıklama": row.description,
        "Lokasyon": row.location,
        "Üretim Etkisi": row.productionImpact ? "Etkiledi" : "Etkilemedi",
        "Hat": row.hat,
        "Duruş (dk)": row.downtimeMin,
        "Kullanıcı": row.user,
      }))
    );
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Duruşlar");
    XLSX.writeFile(wb, "duruşlar.xlsx");
  };

  // ----------- Tablo Kolonları -----------
  const columns = [
    {
      title: "Tarih",
      dataIndex: "date",
      key: "date",
      width: 150,
      render: (d: string) => dayjs(d).format("DD.MM.YYYY HH:mm"),
      sorter: (a: DowntimeRow, b: DowntimeRow) =>
        dayjs(a.date).valueOf() - dayjs(b.date).valueOf(),
      defaultSortOrder: "descend" as const,
    },
    { title: "Açıklama", dataIndex: "description", key: "description", width: 190 },
    { title: "Lokasyon", dataIndex: "location", key: "location", width: 100 },
    {
      title: "Üretim Etkisi",
      dataIndex: "productionImpact",
      key: "productionImpact",
      width: 120,
      render: (v: boolean) =>
        v ? <Tag color="red">Etkiledi</Tag> : <Tag color="green">Etkilemedi</Tag>,
      filters: [
        { text: "Etkiledi", value: true },
        { text: "Etkilemedi", value: false },
      ],
      onFilter: (value: any, record: DowntimeRow) =>
        record.productionImpact === value,
    },
    {
      title: "Hat",
      dataIndex: "hat",
      key: "hat",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
      width: 60,
    },
    {
      title: "Duruş (dk)",
      dataIndex: "downtimeMin",
      key: "downtimeMin",
      width: 110,
      align: "center" as const,
      render: (v: number) => (
        <span style={{ fontWeight: 700, color: "#a30047" }}>{v}</span>
      ),
    },
    {
      title: "Kullanıcı",
      dataIndex: "user",
      key: "user",
      width: 190,
      render: (v: string) => (
        <a href={`mailto:${v}`} target="_blank" rel="noopener noreferrer">
          {v}
        </a>
      ),
    },
  ];

  // ---- KUTU CSS ----
  const boxStyle: React.CSSProperties = {
    textAlign: "center",
    borderRadius: 18,
    minWidth: 94,
    marginRight: 12,
    background: "linear-gradient(145deg, #f7f5ff 60%, #f9e4ec 110%)",
    border: "1.5px solid #ede7f6",
    boxShadow: "0 2px 12px #e2d2f644",
    transition: "transform 0.17s, box-shadow 0.13s",
    padding: "15px 0 12px 0",
    marginBottom: 5,
    cursor: "pointer",
    fontFamily: "Inter, Segoe UI, Arial",
  };
  const boxHatText: React.CSSProperties = {
    color: "#c4006d", fontWeight: 700, fontSize: 18, letterSpacing: 1,
  };
  const boxSureText: React.CSSProperties = {
    fontSize: 15, color: "#333", marginTop: 2, fontWeight: 600,
  };

  return (
    <div style={{ maxWidth: 1220, margin: "0 auto", padding: "36px 0 0 0" }}>
      <div style={{ marginBottom: 6 }}>
        <Title level={1} style={{
          color: "#21043d", fontWeight: 900, fontSize: 38, marginBottom: 0, letterSpacing: 0.5,
        }}>Duruşlar</Title>
        <hr style={{
          border: "none", borderTop: "2px solid #ede7f6", margin: "8px 0 30px 0"
        }} />
      </div>
      {/* ----------- GÜNLÜK/HAFTALIK ANALİZ KUTULARI ----------- */}
      <Row gutter={22} style={{ marginBottom: 4, flexWrap: "wrap" }}>
        <Col xs={24} sm={12} md={7}>
          <Card
            style={{
              borderRadius: 17, minHeight: 76,
              background: "#fff", boxShadow: "0 1px 7px #ede7f677"
            }}
            bodyStyle={{ padding: 20, paddingBottom: 14, textAlign: "center" }}
          >
            <div style={{ fontWeight: 600, color: "#434", fontSize: 17 }}>
              Bugünkü Toplam Duruş
            </div>
            <div style={{ fontSize: 28, color: "#fa1e4e", fontWeight: 900, marginTop: 2 }}>
              {todayTotalDowntime} <span style={{ fontSize: 21, color: "#cfb0c7" }}>dk</span>
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={9}>
          <Card
            style={{
              borderRadius: 17, minHeight: 76,
              background: "#fff", boxShadow: "0 1px 7px #ede7f677"
            }}
            bodyStyle={{ padding: 20, paddingBottom: 14, textAlign: "center" }}
          >
            <div style={{ fontWeight: 600, color: "#434", fontSize: 17 }}>
              Bugün Son Duruş
            </div>
            <div style={{ fontSize: 19, marginTop: 2, color: "#3a405a", fontWeight: 700 }}>
              {todayLastDowntime
                ? `${dayjs(todayLastDowntime.date).format("HH:mm")} [${todayLastDowntime.hat}]`
                : "-"}
            </div>
            <div style={{ fontSize: 15, color: "#c4006d", fontWeight: 600 }}>
              {todayLastDowntime?.description || ""}
            </div>
          </Card>
        </Col>
        <Col xs={24} sm={12} md={8}>
          <Card
            style={{
              borderRadius: 17, minHeight: 76,
              background: "#fff", boxShadow: "0 1px 7px #ede7f677"
            }}
            bodyStyle={{ padding: 20, paddingBottom: 14, textAlign: "center" }}
          >
            <div style={{ fontWeight: 600, color: "#434", fontSize: 17 }}>
              Haftanın En Çok Duran Hattı
            </div>
            <div style={{ fontSize: 22, color: "#10b981", fontWeight: 900 }}>
              {haftalikMaxHat} <span style={{ fontWeight: 500, color: "#6ee7b7" }}>({haftalikMaxHatSure} dk)</span>
            </div>
          </Card>
        </Col>
      </Row>
      {/* ---- Alfabetik Haftalık Hat Kartları ---- */}
      <Row
        gutter={7}
        style={{
          marginBottom: 28,
          marginLeft: 3,
          flexWrap: "wrap",
          overflowX: "auto",
        }}
      >
        {haftalikHatlarSorted.map(([hat, sure]) => (
          <Col key={hat} style={{ minWidth: 98 }}>
            <div
              className="durus-hat-box"
              style={boxStyle}
              tabIndex={0}
              title={`${hat} hattının haftalık toplam duruş süresi`}
              onMouseOver={e => (e.currentTarget.style.transform = "scale(1.045)")}
              onMouseOut={e => (e.currentTarget.style.transform = "scale(1.00)")}
            >
              <div style={boxHatText}>{hat}</div>
              <div style={boxSureText}>{sure} dk</div>
            </div>
          </Col>
        ))}
      </Row>
      {/* ----------- Filtreler ve Tablo ----------- */}
      <Card
        bordered={false}
        style={{
          borderRadius: 20,
          boxShadow: "0 4px 22px #b5a0e333",
        }}
        bodyStyle={{ padding: "28px 24px 16px 24px" }}
      >
        <Row align="middle" justify="space-between" style={{ marginBottom: 28 }}>
          <Col>
            <Title level={2} style={{ fontWeight: 900, color: "#581c87", marginBottom: 0 }}>
              Üretim Duruşları
            </Title>
          </Col>
          <Col>
            <Space>
              <Input
                prefix={<SearchOutlined />}
                placeholder="Açıklama/hattı/kullanıcı ara..."
                style={{ width: 220 }}
                allowClear
                onChange={(e) => setSearch(e.target.value)}
              />
              <Select
                allowClear
                placeholder="Hat seç"
                style={{ width: 110 }}
                onChange={(v) => setSelectedLine(v ?? null)}
              >
                {lines
                  .sort((a, b) => a.code.localeCompare(b.code, "tr", { numeric: true }))
                  .map((l) => (
                    <Option key={l.id} value={l.code}>
                      {l.code}
                    </Option>
                  ))}
              </Select>
              <RangePicker
                locale={trTR}
                format="DD.MM.YYYY"
                style={{ width: 220 }}
                allowClear
                onChange={(val) => setDateRange(val ? [val[0], val[1]] : null)}
              />
              <Button
                icon={<ReloadOutlined />}
                onClick={() => window.location.reload()}
              >
                Yenile
              </Button>
              <Button
                type="primary"
                icon={<FileExcelOutlined />}
                onClick={exportExcel}
              >
                Excel
              </Button>
            </Space>
          </Col>
        </Row>
        <Table
          columns={columns}
          dataSource={downtimeRows}
          loading={loading}
          size="middle"
          bordered
          rowKey="key"
          pagination={{ pageSize: 15, showSizeChanger: true }}
          scroll={{ x: 900, y: 500 }}
          showSorterTooltip
        />
      </Card>
      {/* Kutu hover efekti için isteğe bağlı stil (ya da App.css'e ekle) */}
      <style>
        {`
        .durus-hat-box:focus, .durus-hat-box:hover {
          outline: none;
          box-shadow: 0 6px 18px #b689db18, 0 0.5px 7px #cdbbf570;
          transform: scale(1.048);
          transition: box-shadow 0.14s, transform 0.17s;
        }
        `}
      </style>
    </div>
  );
};

export default FaultDowntimeDashboard;
