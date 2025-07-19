import React, { useEffect, useState } from "react";
import {
  Table,
  Button,
  message,
  Popconfirm,
  Input,
  Space,
  Select,
  Modal,
  Form,
  Tag,
  Tooltip,
  Card,
  Row,
  Col,
  Statistic,
} from "antd";
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  FileExcelOutlined,
  FilePdfOutlined,
  ExclamationCircleOutlined,
} from "@ant-design/icons";
import { useNavigate } from "react-router-dom";
import api from "../api";
import jsPDF from "jspdf";
import "jspdf-autotable";
import { saveAs } from "file-saver";

const { Option } = Select;
const { confirm } = Modal;

interface Motor {
  id: number;
  serial: string;
  name: string;
  description?: string;
  status?: string;
  location?: string;
  createdAt: string;
}

const STATUS_COLORS: Record<string, string> = {
  Çalışıyor: "green",
  Durduruldu: "volcano",
  Bakımda: "orange",
  Arızalı: "red",
  Hazır: "blue",
  "": "default",
};

const Motors: React.FC = () => {
  const [motors, setMotors] = useState<Motor[]>([]);
  const [filtered, setFiltered] = useState<Motor[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editMotor, setEditMotor] = useState<Motor | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  // Veri çekme
  const fetchMotors = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/motors");
      setMotors(data);
      setFiltered(data);
    } catch {
      message.error("Motorlar yüklenemedi");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMotors();
  }, []);

  // Arama ve filtre
  useEffect(() => {
    let data = motors;
    if (search) {
      data = data.filter(
        (m) =>
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          (m.serial && m.serial.toLowerCase().includes(search.toLowerCase())) ||
          (m.location && m.location.toLowerCase().includes(search.toLowerCase()))
      );
    }
    if (statusFilter) {
      data = data.filter((m) => m.status === statusFilter);
    }
    setFiltered(data);
  }, [search, statusFilter, motors]);

  // Excel export
  const exportExcel = () => {
    if (filtered.length === 0) {
      message.info("Gösterilecek motor yok.");
      return;
    }
    const rows = filtered.map((m) => ({
      "Seri No": m.serial,
      İsim: m.name,
      Durum: m.status || "",
      Lokasyon: m.location || "",
      Açıklama: m.description || "",
      Oluşturulma: m.createdAt,
    }));
    const csv =
      [Object.keys(rows[0]).join(";")]
        .concat(rows.map((row) => Object.values(row).join(";")))
        .join("\n") || "";
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "motorlar.csv");
  };

  // PDF export
  const exportPDF = () => {
    if (filtered.length === 0) {
      message.info("Gösterilecek motor yok.");
      return;
    }
    const doc = new jsPDF();
    doc.text("Motorlar Listesi", 14, 12);
    // @ts-ignore
    doc.autoTable({
      head: [["Seri No", "İsim", "Durum", "Lokasyon", "Açıklama", "Oluşturulma"]],
      body: filtered.map((m) => [
        m.serial,
        m.name,
        m.status || "",
        m.location || "",
        m.description || "",
        m.createdAt,
      ]),
      startY: 20,
    });
    doc.save("motorlar.pdf");
  };

  // Modal açma (düzenle ya da ekle)
  const openModal = (motor?: Motor) => {
    if (motor) {
      setEditMotor(motor);
      form.setFieldsValue(motor);
    } else {
      setEditMotor(null);
      form.resetFields();
    }
    setShowModal(true);
  };

  // Modal kaydetme
  const handleOk = async () => {
    try {
      const values = await form.validateFields();
      if (editMotor) {
        // Güncelle
        await api.put(`/motors/${editMotor.id}`, values);
        message.success("Motor güncellendi");
      } else {
        // Ekle
        await api.post("/motors", values);
        message.success("Motor eklendi");
      }
      setShowModal(false);
      fetchMotors();
    } catch (err) {
      message.error("İşlem başarısız");
    }
  };

  // Silme işlemi
  const handleDelete = (motor: Motor) => {
    confirm({
      title: `Motoru silmek istediğinize emin misiniz?`,
      icon: <ExclamationCircleOutlined />,
      content: `${motor.name} (${motor.serial})`,
      okText: "Sil",
      okType: "danger",
      cancelText: "Vazgeç",
      async onOk() {
        try {
          await api.delete(`/motors/${motor.id}`);
          message.success("Motor silindi");
          fetchMotors();
        } catch {
          message.error("Motor silinemedi");
        }
      },
    });
  };

  // Tablo kolonları
  const columns = [
    {
      title: "Seri No",
      dataIndex: "serial",
      key: "serial",
      render: (serial: string) => <b>{serial}</b>,
      sorter: (a: Motor, b: Motor) => a.serial.localeCompare(b.serial),
    },
    {
      title: "Motor İsmi",
      dataIndex: "name",
      key: "name",
      render: (_: any, m: Motor) => (
        <a
          onClick={() => navigate(`/equipment/motors/${m.id}`)}
          style={{ cursor: "pointer" }}
          aria-label={`Motor ${m.name} detayına git`}
        >
          {m.name}
        </a>
      ),
      sorter: (a: Motor, b: Motor) => a.name.localeCompare(b.name),
    },
    {
      title: "Durum",
      dataIndex: "status",
      key: "status",
      filters: Object.keys(STATUS_COLORS)
        .filter((x) => x)
        .map((s) => ({ text: s, value: s })),
      onFilter: (value: string, record: Motor) => record.status === value,
      render: (status: string) => (
        <Tag color={STATUS_COLORS[status || ""] || "default"}>
          {status || "Bilinmiyor"}
        </Tag>
      ),
      sorter: (a: Motor, b: Motor) => (a.status || "").localeCompare(b.status || ""),
    },
    {
      title: "Lokasyon",
      dataIndex: "location",
      key: "location",
      render: (loc: string) => (loc ? loc : <Tag color="gray">Yok</Tag>),
      sorter: (a: Motor, b: Motor) => (a.location || "").localeCompare(b.location || ""),
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
      title: "Oluşturulma",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => new Date(date).toLocaleString("tr-TR"),
      sorter: (a: Motor, b: Motor) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
      defaultSortOrder: "descend",
    },
    {
      title: "İşlemler",
      key: "actions",
      render: (_: any, m: Motor) => (
        <Space>
          <Tooltip title="Düzenle">
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => openModal(m)}
              aria-label={`Motor ${m.name} düzenle`}
            />
          </Tooltip>
          <Tooltip title="Sil">
            <Button
              type="link"
              icon={<DeleteOutlined />}
              danger
              onClick={() => handleDelete(m)}
              aria-label={`Motor ${m.name} sil`}
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  // İstatistik kartları
  const total = motors.length;
  const active = motors.filter((m) => m.status === "Çalışıyor").length;
  const faulty = motors.filter((m) => m.status === "Arızalı").length;
  const maintenance = motors.filter((m) => m.status === "Bakımda").length;

  return (
    <Card title="Motorlar" style={{ margin: 16 }}>
      {/* İstatistik kartları */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}>
          <Statistic title="Toplam Motor" value={total} />
        </Col>
        <Col span={6}>
          <Statistic title="Çalışan" value={active} valueStyle={{ color: "#52c41a" }} />
        </Col>
        <Col span={6}>
          <Statistic title="Bakımda" value={maintenance} valueStyle={{ color: "#faad14" }} />
        </Col>
        <Col span={6}>
          <Statistic title="Arızalı" value={faulty} valueStyle={{ color: "#ff4d4f" }} />
        </Col>
      </Row>

      {/* Arama, filtre ve butonlar */}
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          allowClear
          placeholder="Motor ara"
          onChange={(e) => setSearch(e.target.value)}
          style={{ width: 200 }}
          aria-label="Motor arama"
        />
        <Select
          allowClear
          placeholder="Durum Filtrele"
          style={{ width: 160 }}
          onChange={setStatusFilter}
          aria-label="Durum filtreleme"
        >
          {Object.keys(STATUS_COLORS)
            .filter((x) => x)
            .map((status) => (
              <Option key={status} value={status}>
                {status}
              </Option>
            ))}
        </Select>
        <Button
          type="primary"
          icon={<PlusOutlined />}
          onClick={() => openModal()}
          aria-label="Yeni motor ekle"
        >
          Motor Ekle
        </Button>
        <Tooltip title="Excel olarak indir">
          <Button icon={<FileExcelOutlined />} onClick={exportExcel} aria-label="Excel indir" />
        </Tooltip>
        <Tooltip title="PDF olarak indir">
          <Button icon={<FilePdfOutlined />} onClick={exportPDF} aria-label="PDF indir" />
        </Tooltip>
      </Space>

      {/* Tablo */}
      <Table
        columns={columns}
        dataSource={filtered}
        loading={loading}
        rowKey="id"
        pagination={{ pageSize: 10, showSizeChanger: true }}
        bordered
        scroll={{ x: 900 }}
        aria-label="Motorlar tablosu"
      />

      {/* Modal - Ekle/Düzenle */}
      <Modal
        title={editMotor ? "Motor Düzenle" : "Yeni Motor Ekle"}
        open={showModal}
        onOk={handleOk}
        onCancel={() => setShowModal(false)}
        okText="Kaydet"
        cancelText="Vazgeç"
        destroyOnClose
        aria-modal="true"
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={{ status: "Çalışıyor" }}
          aria-label="Motor formu"
        >
          <Form.Item
            label="Seri No"
            name="serial"
            rules={[{ required: true, message: "Seri No giriniz" }]}
            aria-required="true"
          >
            <Input maxLength={50} aria-label="Seri No" />
          </Form.Item>
          <Form.Item
            label="Motor İsmi"
            name="name"
            rules={[{ required: true, message: "Motor ismini giriniz" }]}
            aria-required="true"
          >
            <Input maxLength={50} aria-label="Motor İsmi" />
          </Form.Item>
          <Form.Item
            label="Durum"
            name="status"
            rules={[{ required: true }]}
            aria-required="true"
          >
            <Select aria-label="Durum seçimi">
              <Option value="Çalışıyor">Çalışıyor</Option>
              <Option value="Bakımda">Bakımda</Option>
              <Option value="Arızalı">Arızalı</Option>
              <Option value="Hazır">Hazır</Option>
              <Option value="Durduruldu">Durduruldu</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Lokasyon" name="location" aria-label="Lokasyon">
            <Input maxLength={50} aria-label="Lokasyon" />
          </Form.Item>
          <Form.Item label="Açıklama" name="description" aria-label="Açıklama">
            <Input.TextArea maxLength={200} rows={2} aria-label="Açıklama" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default Motors;
