import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Modal,
  Form,
  Select,
  message,
  Tooltip,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Empty,
  Spin,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  SearchOutlined,
  RightOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import { Link, useNavigate } from "react-router-dom";
import { saveAs } from "file-saver";
import type { ColumnsType } from "antd/es/table";

interface Motor {
  id: number;
  name: string;
  serial: string;
  status: string;
  location: string;
  description?: string;
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: "Çalışıyor", color: "green" },
  { value: "Arızalı", color: "red" },
  { value: "Bakımda", color: "orange" },
  { value: "Durduruldu", color: "volcano" },
  { value: "Hazır", color: "blue" },
];

const initialForm = {
  name: "",
  serial: "",
  status: "Çalışıyor",
  location: "",
  description: "",
};

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const Motors: React.FC = () => {
  const [motors, setMotors] = useState<Motor[]>([]);
  const [filtered, setFiltered] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editMotor, setEditMotor] = useState<Motor | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const navigate = useNavigate();

  // Kullanıcı rolü (gözlemci, teknisyen, admin)
  const userInfo = React.useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem("userInfo") || "{}");
    } catch {
      return {};
    }
  }, []);
  const userRole = userInfo.role || "gözlemci";

  // Motorları API'dan çek
  const fetchMotors = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/motors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Motor verisi alınamadı!");
      const data = await res.json();
      setMotors(data);
      setFiltered(data);
    } catch {
      message.error("Motorlar yüklenemedi!");
      setMotors([]);
      setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotors();
  }, []);

  // Arama ve filtreler
  useEffect(() => {
    let data = [...motors];
    if (search)
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.serial.toLowerCase().includes(search.toLowerCase()) ||
          (m.location && m.location.toLowerCase().includes(search.toLowerCase()))
      );
    if (statusFilter) data = data.filter((m) => m.status === statusFilter);
    setFiltered(data);
  }, [motors, search, statusFilter]);

  // Yeni motor ekle/düzenle modalını aç
  const openModal = (motor?: Motor) => {
    if (motor) {
      setEditMotor(motor);
      form.setFieldsValue(motor);
    } else {
      setEditMotor(null);
      form.setFieldsValue(initialForm);
    }
    setModalOpen(true);
  };

  // Ekle/düzenle formu submit
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editMotor) {
        // Motor güncelle
        const res = await fetch(`${API_BASE}/motors/${editMotor.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız!");
        message.success("Motor başarıyla güncellendi!");
      } else {
        // Motor ekle
        const res = await fetch(`${API_BASE}/motors`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(values),
        });
        if (!res.ok) {
          const d = await res.json();
          throw new Error(d.message || "Ekleme başarısız!");
        }
        message.success("Motor başarıyla eklendi!");
      }
      setModalOpen(false);
      fetchMotors();
    } catch (err: any) {
      message.error(err?.message || "İşlem başarısız!");
    }
  };

  // Motor sil (Sadece admin)
  const handleDelete = async (motor: Motor) => {
    try {
      const res = await fetch(`${API_BASE}/motors/${motor.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Silme başarısız!");
      message.success("Motor silindi!");
      fetchMotors();
    } catch {
      message.error("Motor silinemedi!");
    }
  };

  // Excel'e aktar (Sadece admin)
  const exportExcel = () => {
    if (!filtered.length) {
      message.info("Gösterilecek motor yok!");
      return;
    }
    const header = [
      "Seri No",
      "Motor İsmi",
      "Durum",
      "Lokasyon",
      "Açıklama",
      "Eklenme Tarihi",
    ];
    const rows = filtered.map((m) => [
      m.serial,
      m.name,
      m.status,
      m.location,
      m.description || "-",
      new Date(m.createdAt).toLocaleString("tr-TR"),
    ]);
    const csv =
      "\uFEFF" +
      [header, ...rows].map((r) => r.join(";")).join("\n");
    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });
    saveAs(blob, "motorlar.csv");
  };

  // Tablo kolonları
  const columns: ColumnsType<Motor> = [
    {
      title: "Seri No",
      dataIndex: "serial",
      key: "serial",
      render: (serial: string) => <b>{serial}</b>,
      sorter: (a, b) => a.serial.localeCompare(b.serial, "tr"),
    },
    {
      title: "Motor İsmi",
      dataIndex: "name",
      key: "name",
      render: (_: any, m: Motor) => (
        <Link
          to={`/equipment/motors/${m.id}`}
          style={{ fontWeight: 700, color: "#6f32e5", textDecoration: "underline" }}
          title="Motor detayına git"
        >
          {m.name}
        </Link>
      ),
      sorter: (a, b) => a.name.localeCompare(b.name, "tr"),
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      filters: STATUS_OPTIONS.map((s) => ({
        text: s.value,
        value: s.value,
      })),
      onFilter: (value: any, record: Motor) => record.status === value,
      render: (status: string) => {
        const c = STATUS_OPTIONS.find((s) => s.value === status)?.color || "default";
        return <Tag color={c}>{status}</Tag>;
      },
      sorter: (a, b) => (a.status || "").localeCompare(b.status || "", "tr"),
    },
    {
      title: "Lokasyon",
      dataIndex: "location",
      key: "location",
      render: (loc: string) => loc || <Tag color="gray">-</Tag>,
      sorter: (a, b) => (a.location || "").localeCompare(b.location || "", "tr"),
    },
    {
      title: "Açıklama",
      dataIndex: "description",
      key: "description",
      ellipsis: true,
      render: (desc: string) => (
        <Tooltip title={desc}>{desc ? desc.substring(0, 40) : "-"}</Tooltip>
      ),
    },
    {
      title: "Eklenme Tarihi",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("tr-TR"),
      sorter: (a, b) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (_: any, m: Motor) => (
        <Space>
          {(userRole === "admin" || userRole === "teknisyen") && (
            <Tooltip title="Düzenle">
              <Button
                icon={<EditOutlined />}
                size="small"
                onClick={() => openModal(m)}
                aria-label={`Motor ${m.name} düzenle`}
              />
            </Tooltip>
          )}
          {userRole === "admin" && (
            <Popconfirm
              title="Bu motoru silmek istediğinize emin misiniz?"
              onConfirm={() => handleDelete(m)}
              okText="Sil"
              cancelText="Vazgeç"
              okButtonProps={{ danger: true }}
            >
              <Tooltip title="Sil">
                <Button
                  icon={<DeleteOutlined />}
                  danger
                  size="small"
                  aria-label={`Motor ${m.name} sil`}
                />
              </Tooltip>
            </Popconfirm>
          )}
          <Tooltip title="Detay">
            <Button
              icon={<RightOutlined />}
              size="small"
              onClick={() => navigate(`/equipment/motors/${m.id}`)}
              aria-label={`Motor ${m.name} detay`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Satır tıklanınca detay sayfasına git!
  const onRow = (motor: Motor) => ({
    onClick: (event: React.MouseEvent) => {
      // Eğer tıklanan eleman bir <a> veya <button> değilse satırdan git!
      if (
        !(event.target as HTMLElement).closest("a") &&
        !(event.target as HTMLElement).closest("button")
      ) {
        navigate(`/equipment/motors/${motor.id}`);
      }
    },
    style: { cursor: "pointer" }
  });

  const total = motors.length;
  const active = motors.filter((m) => m.status === "Çalışıyor").length;
  const faulty = motors.filter((m) => m.status === "Arızalı").length;
  const maintenance = motors.filter((m) => m.status === "Bakımda").length;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 0" }}>
      <Card
        title={
          <Row align="middle" gutter={16}>
            <Col>
              <span style={{ fontSize: 30, fontWeight: 800, color: "#2a1b45" }}> Motorlar</span>
            </Col>
            <Col>
              <Tooltip title="Yenile">
                <Button shape="circle" icon={<ReloadOutlined />} onClick={fetchMotors} />
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
                Motor Ekle
              </Button>
            )}
            {userRole === "admin" && (
              <Button
                icon={<FileExcelOutlined />}
                onClick={exportExcel}
                style={{ fontWeight: 500, borderRadius: 9 }}
              >
                Excel'e Aktar
              </Button>
            )}
            <Input
              placeholder="Ara (isim, seri no, lokasyon)"
              prefix={<SearchOutlined />}
              allowClear
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: 260 }}
            />
            <Select
              allowClear
              placeholder="Duruma göre filtrele"
              onChange={(v) => setStatusFilter(v)}
              style={{ width: 180 }}
              value={statusFilter}
            >
              {STATUS_OPTIONS.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.value}
                </Select.Option>
              ))}
            </Select>
          </Space>
        }
        style={{
          borderRadius: 20,
          marginBottom: 22,
          boxShadow: "0 4px 20px #b486be12",
        }}
        bodyStyle={{ padding: "28px 12px" }}
      >
        <Row gutter={20} style={{ marginBottom: 24 }}>
          <Col md={6} xs={12}>
            <Statistic title="Toplam Motor" value={total} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Çalışan" value={active} valueStyle={{ color: "#52c41a" }} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Bakımda" value={maintenance} valueStyle={{ color: "#faad14" }} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Arızalı" value={faulty} valueStyle={{ color: "#ff4d4f" }} />
          </Col>
        </Row>
        {loading ? (
          <Spin style={{ margin: "60px auto", display: "block" }} size="large" />
        ) : (
          <Table
            columns={columns}
            dataSource={filtered}
            rowKey="id"
            bordered
            pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: [10, 20, 50, 100] }}
            locale={{
              emptyText: (
                <Empty description={search || statusFilter ? "Sonuç bulunamadı" : "Henüz motor eklenmemiş"} />
              ),
            }}
            scroll={{ x: 900 }}
            onRow={onRow}
          />
        )}
      </Card>

      {/* Motor ekle/düzenle modalı */}
      <Modal
        title={editMotor ? "Motoru Düzenle" : "Yeni Motor Ekle"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        okText={editMotor ? "Güncelle" : "Ekle"}
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
            label="Motor İsmi"
            name="name"
            rules={[{ required: true, message: "Motor ismi zorunlu!" }]}
          >
            <Input placeholder="Ör: Pompa A" maxLength={40} disabled={userRole === "gözlemci"} />
          </Form.Item>
          <Form.Item
            label="Seri Numarası"
            name="serial"
            rules={[
              { required: true, message: "Seri numarası zorunlu!" },
              { min: 2, message: "En az 2 karakter olmalı!" },
            ]}
          >
            <Input placeholder="Ör: 45210023" maxLength={30} disabled={userRole === "gözlemci"} />
          </Form.Item>
          <Form.Item
            label="Durum"
            name="status"
            rules={[{ required: true, message: "Durum seçilmeli!" }]}
          >
            <Select disabled={userRole === "gözlemci"}>
              {STATUS_OPTIONS.map((s) => (
                <Select.Option key={s.value} value={s.value}>
                  {s.value}
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Lokasyon"
            name="location"
            rules={[{ required: true, message: "Lokasyon zorunlu!" }]}
          >
            <Input placeholder="Ör: Kazan Dairesi" maxLength={40} disabled={userRole === "gözlemci"} />
          </Form.Item>
          <Form.Item label="Açıklama" name="description">
            <Input.TextArea placeholder="Ek açıklama" maxLength={120} rows={2} disabled={userRole === "gözlemci"} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Motors;
