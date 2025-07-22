import React, { useEffect, useState } from "react";
import {
  Table, Button, Input, Space, Modal, Form, Select, Tag, Popconfirm, message, Card, Row, Col, Statistic
} from "antd";
import {
  PlusOutlined, EditOutlined, DeleteOutlined, ReloadOutlined
} from "@ant-design/icons";
import api from "../api";
import moment from "moment";

const { Option } = Select;

interface User {
  id: number;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
  phone: string;
  department: string;
  createdAt: string;
}

const roleColors: Record<string, string> = {
  admin: "magenta",
  user: "blue",
  operator: "green"
};

const Users: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [form] = Form.useForm();
  const [stats, setStats] = useState({ total: 0, admin: 0, departmentCount: 0 });

  // Kullanıcıları çek
  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get<User[]>("/users");
      setUsers(res.data);
      // İstatistikler
      const total = res.data.length;
      const admin = res.data.filter(u => u.role === "admin").length;
      const departmentCount = new Set(res.data.map(u => u.department)).size;
      setStats({ total, admin, departmentCount });
    } catch (e) {
      message.error("Kullanıcılar alınamadı.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  // Tablo filtreleme
  const filtered = users.filter(u =>
    (u.firstName + " " + u.lastName + u.email + (u.department || "")).toLowerCase().includes(search.toLowerCase()) &&
    (!roleFilter || u.role === roleFilter)
  );

  // Kullanıcı ekle/güncelle
  const handleSubmit = async (values: any) => {
    try {
      if (editUser) {
        await api.put(`/users/${editUser.id}`, values);
        message.success("Kullanıcı güncellendi");
      } else {
        await api.post("/users", values);
        message.success("Kullanıcı eklendi");
      }
      setModalOpen(false);
      setEditUser(null);
      form.resetFields();
      fetchUsers();
    } catch (e: any) {
      message.error(e?.response?.data?.message || "Hata oluştu");
    }
  };

  // Kullanıcı sil
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/users/${id}`);
      message.success("Kullanıcı silindi");
      fetchUsers();
    } catch {
      message.error("Silme başarısız");
    }
  };

  // Tablo kolonları
  const columns = [
    { title: "ID", dataIndex: "id", width: 60, responsive: ['lg'] as any },
    {
      title: "Ad Soyad",
      render: (u: User) => <b>{(u.firstName || "") + " " + (u.lastName || "")}</b>,
      sorter: (a: User, b: User) => (a.firstName + a.lastName).localeCompare(b.firstName + b.lastName),
    },
    { title: "E-posta", dataIndex: "email" },
    {
      title: "Rol",
      dataIndex: "role",
      render: (v: string) => <Tag color={roleColors[v] || "default"}>{v.toUpperCase()}</Tag>,
      filters: [
        { text: "Admin", value: "admin" },
        { text: "User", value: "user" },
        { text: "Operator", value: "operator" }
      ],
      onFilter: (value: any, record: User) => record.role === value,
    },
    { title: "Departman", dataIndex: "department", width: 100 },
    { title: "Telefon", dataIndex: "phone", width: 110 },
    {
      title: "Kayıt Tarihi",
      dataIndex: "createdAt",
      render: (v: string) => moment(v).format("DD.MM.YYYY"),
      width: 110,
      responsive: ['md'] as any
    },
    {
      title: "",
      key: "action",
      width: 112,
      render: (_: any, u: User) => (
        <Space>
          <Button icon={<EditOutlined />} size="small"
            onClick={() => { setEditUser(u); setModalOpen(true); form.setFieldsValue(u); }} />
          <Popconfirm
            title="Kullanıcı silinsin mi?"
            onConfirm={() => handleDelete(u.id)}
            okText="Evet"
            cancelText="İptal"
          >
            <Button icon={<DeleteOutlined />} danger size="small" />
          </Popconfirm>
        </Space>
      )
    }
  ];

  return (
    <div style={{ maxWidth: 1100, margin: "0 auto", padding: "38px 0" }}>
      {/* Header / İstatistikler */}
      <Row gutter={18} style={{ marginBottom: 28 }}>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 17 }}>
            <Statistic title="Toplam Kullanıcı" value={stats.total} valueStyle={{ color: "#7b2ff2" }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 17 }}>
            <Statistic title="Admin Sayısı" value={stats.admin} valueStyle={{ color: "#d72660" }} />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card bordered={false} style={{ borderRadius: 17 }}>
            <Statistic title="Departman Sayısı" value={stats.departmentCount} valueStyle={{ color: "#009688" }} />
          </Card>
        </Col>
      </Row>
      {/* Arama ve Butonlar */}
      <Space style={{ marginBottom: 18, flexWrap: "wrap" }}>
        <Input.Search
          placeholder="Ad, soyad, e-posta veya departman ara"
          allowClear
          style={{ width: 250 }}
          onSearch={setSearch}
        />
        <Select
          allowClear
          style={{ width: 140 }}
          placeholder="Rol filtrele"
          onChange={setRoleFilter}
        >
          <Option value="admin">Admin</Option>
          <Option value="user">User</Option>
          <Option value="operator">Operator</Option>
        </Select>
        <Button
          icon={<ReloadOutlined />}
          onClick={fetchUsers}
        >Yenile</Button>
        <Button
          icon={<PlusOutlined />}
          type="primary"
          onClick={() => { setModalOpen(true); setEditUser(null); form.resetFields(); }}
        >Yeni Kullanıcı</Button>
      </Space>
      {/* Tablo */}
      <Table
        columns={columns}
        dataSource={filtered}
        loading={loading}
        rowKey="id"
        bordered
        pagination={{ pageSize: 12, showSizeChanger: true }}
        size="middle"
        scroll={{ x: 900 }}
        style={{ background: "#f8fafd", borderRadius: 18 }}
        rowClassName={(_, i) => (i % 2 === 0 ? "even-row" : "odd-row")}
      />

      {/* Kullanıcı Ekle/Güncelle Modalı */}
      <Modal
        open={modalOpen}
        title={editUser ? "Kullanıcıyı Düzenle" : "Yeni Kullanıcı"}
        onCancel={() => { setModalOpen(false); setEditUser(null); form.resetFields(); }}
        onOk={() => form.submit()}
        okText={editUser ? "Güncelle" : "Ekle"}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={editUser || { role: "user" }}
          onFinish={handleSubmit}
        >
          <Form.Item label="Ad" name="firstName">
            <Input />
          </Form.Item>
          <Form.Item label="Soyad" name="lastName">
            <Input />
          </Form.Item>
          <Form.Item
            label="E-posta"
            name="email"
            rules={[
              { required: true, message: "Email zorunlu" },
              { type: "email", message: "Geçerli bir email girin" }
            ]}
          >
            <Input disabled={!!editUser} />
          </Form.Item>
          {!editUser && (
            <Form.Item
              label="Şifre"
              name="password"
              rules={[
                { required: true, message: "Şifre zorunlu" },
                { min: 6, message: "Şifre en az 6 karakter olmalı" }
              ]}
            >
              <Input.Password />
            </Form.Item>
          )}
          <Form.Item label="Rol" name="role" rules={[{ required: true }]}>
            <Select>
              <Option value="admin">Admin</Option>
              <Option value="user">User</Option>
              <Option value="operator">Operator</Option>
            </Select>
          </Form.Item>
          <Form.Item label="Telefon" name="phone">
            <Input />
          </Form.Item>
          <Form.Item label="Departman" name="department">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default Users;
