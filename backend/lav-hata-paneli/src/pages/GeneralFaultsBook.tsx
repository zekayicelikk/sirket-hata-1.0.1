import React, { useEffect, useState, useCallback } from "react";
import {
  Card, Typography, Spin, message, Button, Modal,
  Form, Input, DatePicker, Space, Table, Tag, Tooltip, Statistic, Row, Col, Empty
} from "antd";
import {
  PlusOutlined, FileExcelOutlined, FilePdfOutlined, FilterOutlined, EditOutlined, DeleteOutlined, ExclamationCircleOutlined
} from "@ant-design/icons";
import api from "../api"; // Axios instance'ınız
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import "jspdf-autotable";
import moment from "moment";

const { Title } = Typography;

// Arayüz tanımlamaları
interface User {
  id: number;
  email: string;
  role: string;
}

interface GeneralFault {
  id: number;
  description: string;
  location: string;
  date: string; // ISO string formatında bekliyoruz
  user?: User; // Kullanıcı bilgisi isteğe bağlı
  createdAt?: string;
  duration?: number; // Backend'de eklediğiniz duration alanı için
}

const GeneralFaults: React.FC = () => {
  const [faults, setFaults] = useState<GeneralFault[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false); // Yeni ekleme modalı
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFault, setEditingFault] = useState<GeneralFault | null>(null);
  const [addForm] = Form.useForm(); // Ekleme formu için ayrı bir form instance'ı
  const [editForm] = Form.useForm();
  const [filters, setFilters] = useState({ q: "", start: "", end: "" });
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [isAdmin, setIsAdmin] = useState(false); // Admin kontrolü için state

  // JWT token'ı decode etmek için helper function
  const decodeToken = (token: string) => {
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload;
    } catch (error) {
      console.error("Token decode error:", error);
      return null;
    }
  };

  // Adminlik durumunu kontrol eden fonksiyon
  const checkAdminStatus = useCallback(async () => {
    let role: string | null = null;
    const token = localStorage.getItem("token");

    if (token) {
      const decoded = decodeToken(token);
      if (decoded) {
        // Token'daki role veya user.role'den al
        role = decoded.role || decoded.user?.role;
      }
    }

    // Eğer role hala yoksa veya belirsizse API'dan çekmeye çalış
    if (!role) {
      try {
        const response = await api.get("/users/me"); // Authlanmış kullanıcının kendi bilgilerini çeken bir endpoint varsayıyorum
        if (response.data && response.data.role) {
          role = response.data.role;
        }
      } catch (error) {
        console.error("Failed to fetch user role from API:", error);
        // Hata durumunda kullanıcıyı anonim varsay
        role = null;
      }
    }

    setIsAdmin(role === "admin");
    // Debug logunu production'da kaldırın
    // console.log("Final Admin Status:", role === "admin" ? "Admin" : "User", "Role:", role);
  }, []);

  // Component yüklendiğinde ve localStorage değiştiğinde admin kontrolü yap
  useEffect(() => {
    checkAdminStatus();

    // Storage değişikliklerini dinle (başka tab'larda değişirse)
    const handleStorageChange = () => {
      checkAdminStatus();
    };
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [checkAdminStatus]); // checkAdminStatus useCallback içinde olduğu için dependency array'e eklenebilir

  // Genel arızaları API'dan çekme
  const fetchFaults = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/general-faults", {
        params: {
          q: filters.q,
          start: filters.start,
          end: filters.end,
        },
      });
      setFaults(res.data.data);
    } catch (error: any) {
      console.error("Arızaları çekerken hata oluştu:", error);
      if (error.response?.status === 401) {
        message.error("Oturum süresi doldu. Lütfen tekrar giriş yapın.");
        // Oturum süresi dolduysa kullanıcıyı çıkışa yönlendirebilirsiniz
        // window.location.href = "/login";
      } else {
        message.error("Arıza kayıtları yüklenemedi: " + (error.response?.data?.message || error.message));
      }
    } finally {
      setLoading(false);
    }
  }, [filters]); // filters bağımlılık olarak eklendi

  // Filtreler değiştiğinde veriyi tekrar çek
  useEffect(() => {
    fetchFaults();
  }, [filters, fetchFaults]); // fetchFaults useCallback içinde olduğu için dependency array'e eklenebilir

  // Yeni arıza ekle
  const handleAddFault = async () => {
    try {
      const values = await addForm.validateFields();
      await api.post("/general-faults", {
        description: values.description,
        location: values.location,
        // Tarih yoksa mevcut tarihi ISO formatında gönder
        date: values.date ? values.date.toISOString() : moment().toISOString(),
      });

      message.success("Arıza başarıyla kaydedildi!");
      setShowAddModal(false);
      addForm.resetFields();
      fetchFaults(); // Verileri yenile
    } catch (err: any) {
      console.error("Arıza eklenirken hata oluştu:", err);
      message.error(err.response?.data?.error || "Arıza ekleme başarısız!");
    }
  };

  // Arıza düzenle
  const handleEditFault = async () => {
    if (!isAdmin) {
      message.error("Bu işlem için admin yetkisi gerekiyor.");
      return;
    }
    try {
      const values = await editForm.validateFields();
      if (!editingFault) return; // Null kontrolü

      await api.put(`/general-faults/${editingFault.id}`, {
        description: values.description,
        location: values.location,
        // Tarih yoksa veya değişmediyse orijinal tarihi kullan
        date: values.date ? values.date.toISOString() : editingFault.date,
      });

      message.success("Arıza başarıyla güncellendi!");
      setShowEditModal(false);
      setEditingFault(null);
      editForm.resetFields();
      fetchFaults(); // Verileri yenile
    } catch (err: any) {
      console.error("Arıza güncellenirken hata oluştu:", err);
      message.error(err.response?.data?.error || "Güncelleme başarısız!");
    }
  };

  // Arıza sil
  const handleDeleteFault = async (id: number) => {
    // console.log("handleDeleteFault called with ID:", id, "isAdmin:", isAdmin); // Debug
    if (!isAdmin) {
      message.error("Bu işlem için admin yetkisi gerekiyor.");
      return;
    }

    setDeletingId(id); // Silme işlemi sırasında loading animasyonu için
    try {
      // Backend'e DELETE isteği gönderiyoruz. api.ts'deki baseURL zaten "/api" olduğu için
      // burada sadece "/general-faults/${id}" yeterlidir.
      const response = await api.delete(`/general-faults/${id}`);
      // console.log("Delete response:", response); // Debug

      if (response.status === 200) { // Backend'den 200 OK bekleniyor
        message.success("Arıza başarıyla silindi.");
        fetchFaults(); // Verileri güncel listeyi almak için yeniden çek
      } else {
        // Backend 200 döndürmezse ama hata da fırlatmazsa (nadiren)
        message.error("Silme işlemi tamamlanamadı. Sunucu yanıtı beklenenden farklı.");
      }
    } catch (err: any) {
      console.error("Arıza silinirken hata oluştu:", err);
      // Hata mesajlarını kullanıcıya göster
      if (err.response) {
        // Backend'den gelen hata yanıtı
        if (err.response.status === 401) {
          message.error("Oturum süresi doldu veya yetkisiz işlem. Lütfen tekrar giriş yapın.");
        } else if (err.response.status === 403) {
          message.error("Bu işlemi yapmaya yetkiniz yok (Admin yetkisi gerekli).");
        } else if (err.response.status === 404) {
          message.error("Silmek istediğiniz kayıt bulunamadı veya zaten silinmiş.");
        } else {
          message.error(err.response.data?.error || err.response.data?.message || "Silme başarısız oldu.");
        }
      } else if (err.request) {
        // İstek yapıldı ama yanıt alınamadı (örneğin ağ hatası)
        message.error("Sunucuya ulaşılamıyor. Lütfen internet bağlantınızı kontrol edin.");
      } else {
        // Diğer hatalar
        message.error("Bir hata oluştu: " + err.message);
      }
    } finally {
      setDeletingId(null); // Loading animasyonunu kapat
    }
  };

  // CSV Dışa Aktarma
  const handleExportCSV = () => {
    const header = ["ID", "Açıklama", "Konum", "Süre (saat)", "Ekleyen", "Tarih"];
    const rows = faults.map(f => [
      f.id,
      f.description,
      f.location,
      f.duration || '-', // duration alanı eklendi
      f.user?.email || "-",
      moment(f.date).format("YYYY-MM-DD HH:mm"),
    ]);
    // UTF-8 BOM ekleyerek Türkçe karakter sorununu önle
    const csv = "\uFEFF" + [header, ...rows].map(r => r.join(";")).join("\n");
    saveAs(new Blob([csv], { type: "text/csv;charset=utf-8" }), "genel_arizalar.csv");
  };

  // PDF Dışa Aktarma
  const handleExportPDF = () => {
    const doc = new jsPDF();
    doc.text("Genel Arıza Defteri", 14, 16);
    (doc as any).autoTable({
      head: [["ID", "Açıklama", "Konum", "Süre", "Ekleyen", "Tarih"]],
      body: faults.map(f => [
        f.id,
        f.description,
        f.location,
        f.duration || '-', // duration alanı eklendi
        f.user?.email || "-",
        moment(f.date).format("YYYY-MM-DD HH:mm"),
      ]),
      startY: 24,
      styles: { fontSize: 8 }, // Yazı boyutunu küçült
      headStyles: { fillColor: [81, 59, 187] }, // Başlık rengi
      alternateRowStyles: { fillColor: [240, 240, 240] }, // Alternatif satır rengi
      margin: { top: 20, right: 14, bottom: 20, left: 14 },
    });
    doc.save("genel_arizalar.pdf");
  };

  // Tablo kolonları
  const columns = [
    { title: "ID", dataIndex: "id", width: 60 },
    { title: "Açıklama", dataIndex: "description", ellipsis: true, width: 220 },
    { title: "Konum", dataIndex: "location", width: 150, render: (l: string) => <Tag color="blue">{l}</Tag> },
    { title: "Süre (saat)", dataIndex: "duration", width: 100, render: (d: number) => d ? `${d} saat` : '-' }, // duration kolonu
    { title: "Ekleyen", dataIndex: ["user", "email"], width: 180, render: (_: any, r: any) => r.user?.email || "Bilinmiyor" },
    {
      title: "Tarih",
      dataIndex: "date",
      width: 170,
      render: (d: string) => moment(d).format("YYYY-MM-DD HH:mm"),
      sorter: (a: GeneralFault, b: GeneralFault) => moment(a.date).unix() - moment(b.date).unix(),
    },
    {
      title: "İşlemler",
      width: 130,
      render: (_: any, record: GeneralFault) => (
        <Space>
          <Tooltip title={isAdmin ? "Düzenle" : "Düzenlemek için admin yetkisi gerekiyor"}>
            <Button
              icon={<EditOutlined />}
              size="small"
              style={{
                color: isAdmin ? "#5f32b3" : "#ccc",
                cursor: isAdmin ? "pointer" : "not-allowed"
              }}
              disabled={!isAdmin}
              onClick={e => {
                e.stopPropagation();
                if (!isAdmin) {
                  message.warning("Bu işlem için admin yetkisi gerekiyor.");
                  return;
                }
                setEditingFault(record);
                // `moment()` ile DatePicker için doğru formatı ayarla
                editForm.setFieldsValue({
                  description: record.description,
                  location: record.location,
                  duration: record.duration, // duration alanını ekle
                  date: record.date ? moment(record.date) : null,
                });
                setShowEditModal(true);
              }}
            />
          </Tooltip>
          <Tooltip title={isAdmin ? "Sil" : "Silmek için admin yetkisi gerekiyor"}>
            <Button
              icon={<DeleteOutlined />}
              size="small"
              danger={isAdmin} // Adminse kırmızı yap
              loading={deletingId === record.id} // Silme sırasında loading göster
              disabled={!isAdmin} // Admin değilse devre dışı bırak
              style={{
                cursor: isAdmin ? "pointer" : "not-allowed"
              }}
              onClick={e => {
                e.stopPropagation();
                if (!isAdmin) {
                  message.warning("Bu işlem için admin yetkisi gerekiyor.");
                  return;
                }

                Modal.confirm({
                  title: <span><ExclamationCircleOutlined style={{ color: "#faad14" }} /> Arıza Sil</span>,
                  content: (
                    <span>
                      <b>"{record.description}"</b> kaydını silmek istediğinize emin misiniz?<br />
                      <span style={{ color: "#b00" }}>Bu işlem geri alınamaz!</span>
                    </span>
                  ),
                  okText: "Evet, Sil",
                  okType: "danger",
                  cancelText: "İptal",
                  centered: true,
                  onOk: () => handleDeleteFault(record.id),
                  onCancel: () => console.log("Silme işlemi iptal edildi."),
                });
              }}
            />
          </Tooltip>
        </Space>
      )
    }
  ];

  // KPI kartı verileri
  const today = moment().format("YYYY-MM-DD");
  const todayCount = faults.filter(f =>
    moment(f.date).format("YYYY-MM-DD") === today
  ).length;

  return (
    <div style={{ maxWidth: 1200, margin: "0 auto", padding: 32 }}>
      {/* Debug bilgisi - production'da kaldırın */}
      {process.env.NODE_ENV === 'development' && (
        <div style={{ marginBottom: 16, padding: 8, backgroundColor: '#f0f0f0', borderRadius: 4 }}>
          **Debug Bilgisi:** Admin Durumu = **{isAdmin ? "Admin" : "Kullanıcı"}**
        </div>
      )}

      {/* Başlık ve filtre */}
      <Row justify="start" align="middle" style={{ marginBottom: 16 }}>
        <Col>
          <span style={{ display: "inline-block", marginRight: 18, verticalAlign: "middle" }}>
            <FilterOutlined style={{ fontSize: 34, color: "#513bbb" }} />
          </span>
        </Col>
        <Col>
          <span style={{
            fontWeight: 800, fontSize: 30, color: "#412272",
            letterSpacing: 1.5
          }}>Genel Arıza Defteri</span>
          <div style={{
            color: "#9478c9", fontSize: 16, fontWeight: 400, marginTop: 2
          }}>
            Tüm tesis/yardımcı hizmet arızalarını izleyin, analiz edin, kaydedin.
          </div>
        </Col>
      </Row>

      {/* KPI Kartları */}
      <Row gutter={18} style={{ marginBottom: 10 }}>
        <Col>
          <Card bordered style={{ borderRadius: 16, minWidth: 180 }}>
            <Statistic title="Toplam Arıza" value={faults.length} valueStyle={{ color: "#2f54eb" }} />
          </Card>
        </Col>
        <Col>
          <Card bordered style={{ borderRadius: 16, minWidth: 180 }}>
            <Statistic title="Bugün Eklenen" value={todayCount} valueStyle={{ color: "#ad7fff" }} />
          </Card>
        </Col>
      </Row>

      <Card
        bordered={false}
        style={{
          borderRadius: 22,
          boxShadow: "0 4px 24px #cab6f82c",
          marginBottom: 16
        }}
        bodyStyle={{ fontSize: 17, padding: "24px 22px 22px 22px" }}
      >
        {/* Filtre ve Buton alanı */}
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            allowClear
            placeholder="Açıklama/konumda ara..."
            style={{ width: 220 }}
            value={filters.q}
            onChange={e => setFilters(f => ({ ...f, q: e.target.value }))}
          />
          <DatePicker.RangePicker
            showTime
            format="YYYY-MM-DD HH:mm"
            onChange={(dates) => setFilters(f => ({
              ...f,
              start: dates?.[0]?.toISOString() || "",
              end: dates?.[1]?.toISOString() || "",
            }))}
            value={
              filters.start && filters.end
                ? [moment(filters.start), moment(filters.end)]
                : null
            }
          />
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setShowAddModal(true)}>
            Yeni Arıza Ekle
          </Button>
          <Button icon={<FileExcelOutlined />} onClick={handleExportCSV}>CSV</Button>
          <Button icon={<FilePdfOutlined />} onClick={handleExportPDF}>PDF</Button>
        </Space>

        {/* Arıza Tablosu */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '50px 0' }}>
            <Spin size="large" />
            <p style={{ marginTop: 10 }}>Veriler yükleniyor...</p>
          </div>
        ) : (
          <Table
            dataSource={faults}
            columns={columns}
            rowKey="id"
            bordered
            locale={{
              emptyText: <Empty description="Kayıtlı genel arıza bulunamadı." />,
            }}
            pagination={{
              pageSize: 10,
              showSizeChanger: true,
              pageSizeOptions: ['10', '20', '50', '100'],
              showTotal: (total, range) => `${range[0]}-${range[1]} / Toplam ${total} kayıt`,
            }}
            scroll={{ x: 900 }} // Yatay kaydırma için minimum genişlik
            style={{ borderRadius: 18 }}
          />
        )}
      </Card>

      {/* YENİ ARıza EKLEME MODAL */}
      <Modal
        title="Yeni Genel Arıza Ekle"
        open={showAddModal}
        onCancel={() => { setShowAddModal(false); addForm.resetFields(); }}
        onOk={handleAddFault}
        okText="Kaydet"
        cancelText="İptal"
        destroyOnClose // Modal kapandığında formu sıfırla
      >
        <Form form={addForm} layout="vertical" preserve={false}>
          <Form.Item
            label="Açıklama"
            name="description"
            rules={[{ required: true, message: "Lütfen arıza açıklamasını girin." }]}
          >
            <Input.TextArea rows={3} maxLength={200} placeholder="Arıza açıklamasını buraya yazın..." />
          </Form.Item>
          <Form.Item
            label="Konum"
            name="location"
            rules={[{ required: true, message: "Lütfen arızanın konumunu belirtin." }]}
          >
            <Input placeholder="Örn: Kompresör Odası, Kazan Dairesi No:2" />
          </Form.Item>
          <Form.Item label="Arıza Süresi (Saat)" name="duration">
            <Input type="number" min={0} placeholder="Arızanın tahmini süresi (saat)" />
          </Form.Item>
          <Form.Item label="Arıza Tarihi ve Saati" name="date" initialValue={moment()}>
            <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Form>
      </Modal>

      {/* ARıZA DÜZENLEME MODAL */}
      <Modal
        title="Arıza Kaydını Düzenle"
        open={showEditModal}
        onCancel={() => { setShowEditModal(false); editForm.resetFields(); setEditingFault(null); }}
        onOk={handleEditFault}
        okText="Kaydet"
        cancelText="İptal"
        destroyOnClose // Modal kapandığında formu sıfırla
      >
        <Form form={editForm} layout="vertical" preserve={false}>
          <Form.Item
            label="Açıklama"
            name="description"
            rules={[{ required: true, message: "Lütfen arıza açıklamasını girin." }]}
          >
            <Input.TextArea rows={3} maxLength={200} />
          </Form.Item>
          <Form.Item
            label="Konum"
            name="location"
            rules={[{ required: true, message: "Lütfen arızanın konumunu belirtin." }]}
          >
            <Input />
          </Form.Item>
          <Form.Item label="Arıza Süresi (Saat)" name="duration">
            <Input type="number" min={0} />
          </Form.Item>
          <Form.Item label="Tarih" name="date">
            <DatePicker showTime style={{ width: "100%" }} format="YYYY-MM-DD HH:mm" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default GeneralFaults;