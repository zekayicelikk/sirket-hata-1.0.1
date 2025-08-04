import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  Card, Typography, Spin, Button, Tag, Row, Col, Statistic, Space, Modal, Form, Input, Select, Tooltip
} from "antd";
import {
  EditOutlined, ReloadOutlined, EnvironmentOutlined,
  SwapOutlined, ThunderboltOutlined, ToolOutlined, WarningOutlined
} from "@ant-design/icons";
import api from "../api"; // Senin api utility'n varsa!

const { Title, Text } = Typography;
const { Option } = Select;

interface Motor {
  id: number;
  name: string;
  serial?: string;
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
  protection?: string | null;
  commProtocol?: string | null;
  controlType?: string | null;
  firmware?: string | null;
  rampUpTime?: number | null;
  rampDownTime?: number | null;
  bypassContact?: string | null;
  year?: number | null;
  lastService?: string | null;
  nextService?: string | null;
  createdAt?: string;
  imageUrl?: string | null;
  qrCode?: string | null;
}

const ControlDeviceDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [device, setDevice] = useState<ControlDevice | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModal, setEditModal] = useState(false);
  const [form] = Form.useForm();
  const [motors, setMotors] = useState<Motor[]>([]);

  // Fetch device & motor list
  const fetchAll = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/control-devices/${id}`);
      setDevice(res.data);

      const motorRes = await api.get(`/motors`);
      setMotors(motorRes.data);
    } catch {
      setDevice(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, [id]);

  const handleEdit = async () => {
    try {
      const values = await form.validateFields();
      await api.put(`/control-devices/${device!.id}`, values);
      setEditModal(false);
      fetchAll();
    } catch {
      // hata
    }
  };

  if (loading)
    return <Spin style={{ marginTop: 64, display: "block" }} size="large" />;

  if (!device)
    return (
      <div style={{ padding: 40 }}>
        <Title level={4}>Cihaz bulunamadı!</Title>
        <Button type="primary" onClick={() => navigate(-1)}>
          Geri Dön
        </Button>
      </div>
    );

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      <Row gutter={30}>
        <Col xs={24} md={10}>
          <Card
            title={
              <span style={{ fontWeight: 700, fontSize: 22 }}>
                {device.type === "VFD" ? "Frekans Konvertörü" : "Soft Starter"} Detayı
              </span>
            }
            extra={
              <Space>
                <Button icon={<ReloadOutlined />} onClick={fetchAll} />
                <Button icon={<EditOutlined />} onClick={() => { setEditModal(true); form.setFieldsValue(device); }}>
                  Düzenle
                </Button>
              </Space>
            }
            bordered={false}
            style={{ borderRadius: 20, boxShadow: "0 4px 24px #cab6f82c", marginBottom: 22 }}
            bodyStyle={{ fontSize: 17, padding: "28px 18px" }}
          >
            <Text strong>Seri No: </Text> {device.serial} <br />
            <Text strong>Marka: </Text> {device.brand} <br />
            <Text strong>Model: </Text> {device.model} <br />
            <Text strong>Güç: </Text> {device.powerKW} kW <br />
            <Text strong>Gerilim: </Text> {device.voltage || "-"} V <br />
            <Text strong>Durum: </Text>
            <Tag color={
              device.status === "Aktif" ? "green" :
                device.status === "Yedek" ? "blue" :
                  device.status === "Bakımda" ? "orange" :
                    device.status === "Arızalı" ? "red" : "default"
            }>
              {device.status}
            </Tag>
            <br />
            <Text strong>Yedek mi?: </Text>
            <Tag color={device.isSpare ? "blue" : "green"}>{device.isSpare ? "Evet" : "Hayır"}</Tag>
            <br />
            <Text strong>Lokasyon: </Text> {device.location || "-"}
            <br />
            <Text strong>Bağlı Motor: </Text>
            {device.motor
              ? <Link to={`/equipment/motors/${device.motor.id}`}>
                  <Tag color="purple" icon={<ThunderboltOutlined />}>{device.motor.name}</Tag>
                </Link>
              : <Tag color="geekblue">Bağlı motor yok</Tag>}
            <br />
            <Text strong>Ek Not: </Text> {device.notes || "-"}
            <br />
            <Text strong>Eklenme: </Text> {device.createdAt ? new Date(device.createdAt).toLocaleString("tr-TR") : "-"}
            <br />
            {/* Diğer teknik alanları istersen ekle */}
            {device.lastService && <><Text strong>Son Bakım:</Text> {new Date(device.lastService).toLocaleDateString("tr-TR")}<br /></>}
            {device.nextService && <><Text strong>Planlı Bakım:</Text> {new Date(device.nextService).toLocaleDateString("tr-TR")}<br /></>}
          </Card>
        </Col>
        <Col xs={24} md={14}>
          {/* İstatistikler ve gelişmiş info */}
          <Row gutter={18}>
            <Col span={12}>
              <Statistic
                title="Cihaz Türü"
                value={device.type}
                prefix={device.type === "VFD" ? <SwapOutlined /> : <ToolOutlined />}
              />
            </Col>
            <Col span={12}>
              <Statistic
                title="Durum"
                value={device.status}
                valueStyle={{
                  color: device.status === "Aktif"
                    ? "#52c41a"
                    : device.status === "Arızalı"
                      ? "#ff4d4f"
                      : device.status === "Bakımda"
                        ? "#faad14"
                        : device.status === "Yedek"
                          ? "#4287f5"
                          : "#888"
                }}
                prefix={<WarningOutlined />}
              />
            </Col>
            <Col span={24} style={{ marginTop: 24 }}>
              <Card title="Cihaz Açıklaması" bordered={false} style={{ borderRadius: 18 }}>
                <Text>{device.notes || "Açıklama yok."}</Text>
              </Card>
            </Col>
          </Row>
        </Col>
      </Row>

      {/* Düzenleme Modalı */}
      <Modal
        title="Cihazı Düzenle"
        open={editModal}
        onCancel={() => setEditModal(false)}
        onOk={handleEdit}
        okText="Kaydet"
        cancelText="İptal"
        destroyOnClose
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Cihaz Türü" name="type" rules={[{ required: true }]}>
            <Select>
              <Option value="VFD">VFD (Frekans Konvertörü)</Option>
              <Option value="Soft Starter">Soft Starter</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Seri No" name="serial" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Marka" name="brand" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Model" name="model" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item label="Güç (kW)" name="powerKW" rules={[{ required: true }]}>
            <Input type="number" step="0.1" />
          </Form.Item>
          <Form.Item label="Gerilim (V)" name="voltage">
            <Input type="number" />
          </Form.Item>
          <Form.Item label="Durum" name="status" rules={[{ required: true }]}>
            <Select>
              <Option value="Aktif">Aktif</Option>
              <Option value="Yedek">Yedek</Option>
              <Option value="Bakımda">Bakımda</Option>
              <Option value="Arızalı">Arızalı</Option>
              <Option value="Durduruldu">Durduruldu</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Yedek mi?" name="isSpare">
            <Select>
              <Option value={false}>Hayır</Option>
              <Option value={true}>Evet</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Bağlı Motor" name="activeMotorId">
            <Select allowClear placeholder="Bir motora bağla">
              {motors.map(m => (
                <Option key={m.id} value={m.id}>
                  {m.name} (ID: {m.id})
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item label="Lokasyon" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="Notlar" name="notes">
            <Input.TextArea />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ControlDeviceDetail;
