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
  Spin
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  SearchOutlined,
  RightOutlined,
  ReloadOutlined
} from "@ant-design/icons";
import { saveAs } from "file-saver";
import { Link, useNavigate } from "react-router-dom";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const STATUS_OPTIONS = [
  { value: "Aktif", color: "green" },
  { value: "Yedek", color: "blue" },
  { value: "Bakımda", color: "orange" },
  { value: "Arızalı", color: "red" },
  { value: "Durduruldu", color: "volcano" },
];

const initialForm = {
  type: "VFD",
  serial: "",
  brand: "",
  model: "",
  powerKW: undefined,
  voltage: undefined,
  status: "Aktif",
  isSpare: false,
  activeMotorId: undefined,
  location: "",
  notes: "",
};

interface Motor {
  id: number;
  name: string;
}

interface ControlDevice {
  id: number;
  type: string;
  serial: string;
  brand: string;
  model: string;
  powerKW?: number;
  voltage?: number;
  status: string;
  isSpare: boolean;
  activeMotorId?: number;
  motor?: Motor | null;
  location?: string;
  notes?: string;
  createdAt: string;
}

const ControlDevices: React.FC = () => {
  const [devices, setDevices] = useState<ControlDevice[]>([]);
  const [motors, setMotors] = useState<Motor[]>([]);
  const [filtered, setFiltered] = useState<ControlDevice[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editDevice, setEditDevice] = useState<ControlDevice | null>(null);
  const [form] = Form.useForm();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>();
  const navigate = useNavigate();

  // Motorları çek
  const fetchMotors = async () => {
    try {
      const res = await fetch(`${API_BASE}/motors`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      setMotors(data);
    } catch {}
  };

  // Cihazları çek
  const fetchDevices = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/control-devices`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      if (!res.ok) throw new Error("Cihaz verisi alınamadı!");
      const data = await res.json();
      setDevices(data);
      setFiltered(data);
    } catch {
      message.error("Cihazlar yüklenemedi!");
      setDevices([]); setFiltered([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMotors();
    fetchDevices();
  }, []);

  // Arama & filtreler
  useEffect(() => {
    let data = [...devices];
    if (search)
      data = data.filter(
        d =>
          d.serial?.toLowerCase().includes(search.toLowerCase()) ||
          d.model?.toLowerCase().includes(search.toLowerCase()) ||
          d.brand?.toLowerCase().includes(search.toLowerCase()) ||
          d.location?.toLowerCase().includes(search.toLowerCase())
      );
    if (statusFilter)
      data = data.filter(d => d.status === statusFilter);
    setFiltered(data);
  }, [devices, search, statusFilter]);

  // Modal aç
  const openModal = (device?: ControlDevice) => {
    if (device) {
      setEditDevice(device);
      form.setFieldsValue({
        ...device,
        activeMotorId: device.activeMotorId ?? undefined,
      });
    } else {
      setEditDevice(null);
      form.setFieldsValue(initialForm);
    }
    setModalOpen(true);
  };

  // Ekle/güncelle
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editDevice) {
        // Güncelle
        const res = await fetch(`${API_BASE}/control-devices/${editDevice.id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Güncelleme başarısız!");
        message.success("Cihaz güncellendi!");
      } else {
        // Ekle
        const res = await fetch(`${API_BASE}/control-devices`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(values),
        });
        if (!res.ok) throw new Error("Ekleme başarısız!");
        message.success("Cihaz eklendi!");
      }
      setModalOpen(false);
      fetchDevices();
    } catch (err: any) {
      message.error(err?.message || "İşlem başarısız!");
    }
  };

  // Sil
  const handleDelete = async (device: ControlDevice) => {
    try {
      const res = await fetch(`${API_BASE}/control-devices/${device.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      if (!res.ok) throw new Error("Silme başarısız!");
      message.success("Cihaz silindi!");
      fetchDevices();
    } catch {
      message.error("Cihaz silinemedi!");
    }
  };

  // Tablo kolonları
  const columns = [
    {
      title: "Seri No",
      dataIndex: "serial",
      key: "serial",
      render: (serial: string) => <b>{serial}</b>,
      sorter: (a: ControlDevice, b: ControlDevice) => a.serial.localeCompare(b.serial, "tr"),
    },
    {
      title: "Cihaz Türü",
      dataIndex: "type",
      key: "type",
      render: (type: string) => <Tag color={type === "VFD" ? "purple" : "geekblue"}>{type}</Tag>,
    },
    {
      title: "Model",
      dataIndex: "model",
      key: "model",
      render: (model: string) => model || <Tag color="gray">-</Tag>,
    },
    {
      title: "Marka",
      dataIndex: "brand",
      key: "brand",
      render: (brand: string) => brand || <Tag color="gray">-</Tag>,
    },
    {
      title: "Güç (kW)",
      dataIndex: "powerKW",
      key: "powerKW",
      render: (val: number) => val !== undefined ? val : <Tag color="gray">-</Tag>,
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      filters: STATUS_OPTIONS.map((s) => ({
        text: s.value,
        value: s.value,
      })),
      onFilter: (value: any, record: ControlDevice) => record.status === value,
      render: (status: string) => {
        const c = STATUS_OPTIONS.find((s) => s.value === status)?.color || "default";
        return <Tag color={c}>{status}</Tag>;
      },
      sorter: (a: ControlDevice, b: ControlDevice) => (a.status || "").localeCompare(b.status || "", "tr"),
    },
    {
      title: "Bağlı Motor",
      dataIndex: "motor",
      key: "motor",
      render: (motor: Motor | null, rec: ControlDevice) =>
        motor ? (
          <Tooltip title={motor.name}>
            <Link to={`/equipment/motors/${motor.id}`}>{motor.name}</Link>
          </Tooltip>
        ) : (
          <Tag color="blue">Yedek</Tag>
        ),
    },
    {
      title: "Lokasyon",
      dataIndex: "location",
      key: "location",
      render: (loc: string) => loc || <Tag color="gray">-</Tag>,
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (_: any, d: ControlDevice) => (
        <Space>
          <Tooltip title="Düzenle">
            <Button icon={<EditOutlined />} size="small" onClick={() => openModal(d)} />
          </Tooltip>
          <Popconfirm
            title="Bu cihazı silmek istediğinize emin misiniz?"
            onConfirm={() => handleDelete(d)}
            okText="Sil"
            cancelText="Vazgeç"
            okButtonProps={{ danger: true }}
          >
            <Tooltip title="Sil">
              <Button icon={<DeleteOutlined />} danger size="small" />
            </Tooltip>
          </Popconfirm>
          <Tooltip title="Detay">
            <Button
              icon={<RightOutlined />}
              size="small"
              onClick={() => navigate(`/equipment/control-devices/${d.id}`)}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // Satır tıklanınca detay sayfasına git
  const onRow = (device: ControlDevice) => ({
    onClick: (event: React.MouseEvent) => {
      if (
        !(event.target as HTMLElement).closest("a") &&
        !(event.target as HTMLElement).closest("button")
      ) {
        navigate(`/equipment/control-devices/${device.id}`);
      }
    },
    style: { cursor: "pointer" }
  });

  const total = devices.length;
  const active = devices.filter((d) => d.status === "Aktif").length;
  const spares = devices.filter((d) => d.isSpare || d.status === "Yedek").length;
  const faulty = devices.filter((d) => d.status === "Arızalı").length;
  const maintenance = devices.filter((d) => d.status === "Bakımda").length;

  return (
    <div style={{ maxWidth: 1400, margin: "0 auto", padding: "32px 0" }}>
      <Card
        title={
          <Row align="middle" gutter={16}>
            <Col>
              <span style={{ fontSize: 30, fontWeight: 800, color: "#0e2748" }}>
                Kontrol Cihazları
              </span>
            </Col>
            <Col>
              <Tooltip title="Yenile">
                <Button shape="circle" icon={<ReloadOutlined />} onClick={fetchDevices} />
              </Tooltip>
            </Col>
          </Row>
        }
        extra={
          <Space>
            <Button
              icon={<PlusOutlined />}
              type="primary"
              onClick={() => openModal()}
              style={{ fontWeight: 600, borderRadius: 9 }}
            >
              Cihaz Ekle
            </Button>
            <Input
              placeholder="Ara (seri/model/marka/lokasyon)"
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
            <Statistic title="Toplam Cihaz" value={total} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Aktif" value={active} valueStyle={{ color: "#52c41a" }} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Bakımda" value={maintenance} valueStyle={{ color: "#faad14" }} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Arızalı" value={faulty} valueStyle={{ color: "#ff4d4f" }} />
          </Col>
          <Col md={6} xs={12}>
            <Statistic title="Yedek" value={spares} valueStyle={{ color: "#4287f5" }} />
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
                <Empty description={search || statusFilter ? "Sonuç bulunamadı" : "Henüz cihaz eklenmemiş"} />
              ),
            }}
            scroll={{ x: 900 }}
            onRow={onRow}
          />
        )}
      </Card>

      {/* Ekle/düzenle modalı */}
      <Modal
        title={editDevice ? "Cihazı Düzenle" : "Yeni Cihaz Ekle"}
        open={modalOpen}
        onCancel={() => setModalOpen(false)}
        onOk={handleOk}
        okText={editDevice ? "Güncelle" : "Ekle"}
        cancelText="İptal"
        maskClosable={false}
        destroyOnClose
      >
        <Form layout="vertical" form={form} initialValues={initialForm} autoComplete="off">
          <Form.Item label="Cihaz Türü" name="type" rules={[{ required: true, message: "Tür zorunlu!" }]}>
            <Select>
              <Select.Option value="VFD">VFD (Frekans Konvertörü)</Select.Option>
              <Select.Option value="Soft Starter">Soft Starter</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Seri No" name="serial" rules={[{ required: true, message: "Seri no zorunlu!" }]}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item label="Marka" name="brand" rules={[{ required: true, message: "Marka zorunlu!" }]}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item label="Model" name="model" rules={[{ required: true, message: "Model zorunlu!" }]}>
            <Input maxLength={40} />
          </Form.Item>
          <Form.Item label="Güç (kW)" name="powerKW" rules={[{ required: true, message: "Güç zorunlu!" }]}>
            <Input type="number" step="0.1" />
          </Form.Item>
          <Form.Item label="Gerilim (V)" name="voltage">
            <Input type="number" step="1" />
          </Form.Item>
          <Form.Item label="Durum" name="status" rules={[{ required: true, message: "Durum zorunlu!" }]}>
            <Select>
              {STATUS_OPTIONS.map((s) => (
                <Select.Option key={s.value} value={s.value}>{s.value}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Yedek mi?" name="isSpare" valuePropName="checked">
            <Select>
              <Select.Option value={false}>Hayır</Select.Option>
              <Select.Option value={true}>Evet</Select.Option>
            </Select>
          </Form.Item>
          <Form.Item label="Bağlı Motor" name="activeMotorId">
            <Select allowClear showSearch placeholder="Bir motora bağla">
              {motors.map((m) => (
                <Select.Option key={m.id} value={m.id}>
                  {m.name} (ID: {m.id})
                </Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Lokasyon" name="location">
            <Input maxLength={60} />
          </Form.Item>
          <Form.Item label="Notlar" name="notes">
            <Input.TextArea maxLength={200} rows={2} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ControlDevices;
