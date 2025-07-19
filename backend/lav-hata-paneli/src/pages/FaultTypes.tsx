import React, { useEffect, useState } from "react";
import { Table, Button, Input, Space, Modal, Form, message, Popconfirm } from "antd";
import { PlusOutlined, DeleteOutlined, EditOutlined } from "@ant-design/icons";
import api from "../api";

interface FaultType {
  id: number;
  name: string;
  createdAt: string;
}

const FaultTypes: React.FC = () => {
  const [faultTypes, setFaultTypes] = useState<FaultType[]>([]);
  const [filtered, setFiltered] = useState<FaultType[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();

  // Backend'den hata tiplerini çek
  const fetchFaultTypes = async () => {
    setLoading(true);
    try {
      const res = await api.get<FaultType[]>("/fault-types");
      setFaultTypes(res.data);
      setFiltered(res.data);
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Hata türleri alınamadı!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFaultTypes();
  }, []);

  useEffect(() => {
    setFiltered(
      faultTypes.filter((f) =>
        f.name.toLowerCase().includes(searchText.toLowerCase())
      )
    );
  }, [searchText, faultTypes]);

  // Hata tipi ekle
  const handleAdd = async () => {
    try {
      const values = await form.validateFields();
      await api.post("/fault-types", values);
      message.success("Hata türü başarıyla eklendi.");
      setIsModalVisible(false);
      form.resetFields();
      fetchFaultTypes();
    } catch (error: any) {
      message.error(error?.response?.data?.error || "Ekleme başarısız!");
    }
  };

  // Hata tipi sil
  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/fault-types/${id}`);
      message.success("Hata türü silindi.");
      fetchFaultTypes();
    } catch (error) {
      message.error("Silme işlemi başarısız!");
    }
  };

  const columns = [
    { title: "ID", dataIndex: "id", width: 60, sorter: (a: FaultType, b: FaultType) => a.id - b.id },
    { title: "Hata Türü", dataIndex: "name", sorter: (a: FaultType, b: FaultType) => a.name.localeCompare(b.name) },
    {
      title: "Eklenme Tarihi",
      dataIndex: "createdAt",
      render: (d: string) => new Date(d).toLocaleString(),
      sorter: (a: FaultType, b: FaultType) =>
        new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
    },
    {
      title: "İşlemler",
      width: 120,
      render: (_: any, record: FaultType) => (
        <Space>
          <Button
            icon={<EditOutlined />}
            size="small"
            disabled
            onClick={() => message.info("Düzenleme henüz aktif değil")}
          />
          <Popconfirm
            title="Bu hata türünü silmek istediğinize emin misiniz?"
            onConfirm={() => handleDelete(record.id)}
            okText="Evet"
            cancelText="İptal"
          >
            <Button icon={<DeleteOutlined />} size="small" danger />
          </Popconfirm>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Input.Search
          placeholder="Hata türü ara..."
          value={searchText}
          onSearch={setSearchText}
          onChange={(e) => setSearchText(e.target.value)}
          style={{ width: 240 }}
          allowClear
        />
        <Button icon={<PlusOutlined />} type="primary" onClick={() => setIsModalVisible(true)}>
          Yeni Hata Türü Ekle
        </Button>
      </Space>

      <Table<FaultType>
        dataSource={filtered}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 8 }}
        bordered
      />

      <Modal
        title="Yeni Hata Türü Ekle"
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        onOk={handleAdd}
        okText="Ekle"
        cancelText="İptal"
      >
        <Form form={form} layout="vertical">
          <Form.Item
            label="Hata Türü Adı"
            name="name"
            rules={[{ required: true, message: "Lütfen isim girin" }]}
          >
            <Input autoFocus />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default FaultTypes;
