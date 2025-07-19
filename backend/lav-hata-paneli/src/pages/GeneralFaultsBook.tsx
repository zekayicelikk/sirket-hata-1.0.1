import React, { useEffect, useState } from "react";
import {
  Table, Button, Modal, Form, Input, Select, Checkbox, InputNumber, Upload, Tag, Space, Tooltip, Empty, Spin
} from "antd";
import { PlusOutlined, UploadOutlined, FileImageOutlined, SearchOutlined } from "@ant-design/icons";
import api from "../api";
import moment from "moment";

const statusOptions = ["Açık", "Kapalı", "İnceleniyor"];
const importanceOptions = ["Kritik", "Yüksek", "Orta", "Düşük"];

const GeneralFaultsBook: React.FC = () => {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [fileList, setFileList] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [form] = Form.useForm();
  const [filters, setFilters] = useState<{status?: string, importance?: string, impact?: boolean}>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get("/general-faults");
      setData(res.data);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  // TABLO FİLTRESİ
  const filteredData = data.filter(f =>
    (!filters.status || f.status === filters.status) &&
    (!filters.importance || f.importance === filters.importance) &&
    (filters.impact === undefined || !!f.productionImpact === filters.impact)
  );

  // ARIZA EKLE
  const onOk = async () => {
    try {
      const values = await form.validateFields();
      values.productionImpact = !!values.productionImpact;
      const res = await api.post("/general-faults", values);
      // Dosya yükleme (varsa)
      for (const file of fileList) {
        const formData = new FormData();
        formData.append("file", file.originFileObj);
        await api.post(`/general-faults/${res.data.id}/files`, formData, {
          headers: { "Content-Type": "multipart/form-data" }
        });
      }
      setModalOpen(false);
      form.resetFields();
      setFileList([]);
      fetchData();
    } catch (err) {
      // Hata mesajı
    }
  };

  // DETAY MODALI
  const [detail, setDetail] = useState<any>(null);

  return (
    <div style={{maxWidth: 1100, margin: "0 auto", padding: 24}}>
      <div style={{display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:16}}>
        <h1>Genel Arıza Defteri</h1>
        <Button icon={<PlusOutlined />} type="primary" onClick={()=>{setModalOpen(true)}}>Yeni Arıza Ekle</Button>
      </div>

      {/* Filtreler */}
      <Space style={{marginBottom: 16}}>
        <Select allowClear placeholder="Durum" onChange={v=>setFilters(f=>({...f, status:v}))} style={{width:120}}>
          {statusOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
        </Select>
        <Select allowClear placeholder="Önem" onChange={v=>setFilters(f=>({...f, importance:v}))} style={{width:120}}>
          {importanceOptions.map(o => <Select.Option key={o} value={o}>{o}</Select.Option>)}
        </Select>
        <Select allowClear placeholder="Üretimi Etkiledi?" onChange={v=>setFilters(f=>({...f, impact:v==="true"?true:v==="false"?false:undefined}))} style={{width:140}}>
          <Select.Option value="true">Evet</Select.Option>
          <Select.Option value="false">Hayır</Select.Option>
        </Select>
        <Button icon={<SearchOutlined />} onClick={fetchData}>Yenile</Button>
      </Space>

      {/* Tablo */}
      {loading ? <Spin style={{margin:48}}/> : (
      <Table
        dataSource={filteredData}
        rowKey="id"
        bordered
        pagination={{pageSize:10}}
        locale={{emptyText: <Empty description="Kayıt yok"/>}}
        columns={[
          {title: "Açıklama", dataIndex: "description", render: (v:any, r:any)=>
            <Button type="link" onClick={()=>setDetail(r)}>{v}</Button>},
          {title: "Durum", dataIndex: "status", render: (v:string)=> <Tag color={
            v==="Açık" ? "red" : v==="Kapalı" ? "green" : "orange"
          }>{v}</Tag>},
          {title: "Önem", dataIndex: "importance", render: (v:string)=> <Tag>{v}</Tag>},
          {title: "Kullanıcı", dataIndex: ["user","email"]},
          {title: "Lokasyon", dataIndex: "location"},
          {title: "Üretimi Etkiledi mi?", dataIndex:"productionImpact", render: (v:boolean)=> v ? <Tag color="red">Evet</Tag> : <Tag>Hayır</Tag> },
          {title: "Kayıt Tarihi", dataIndex:"date", render:(v:any)=> moment(v).format("DD.MM.YYYY HH:mm")},
          {title: "Duruş", dataIndex: "productionStop", render: (v:any)=> v?<Tag color="purple">{v.line} - {v.duration}dk</Tag>:"-"},
          {title: "Dosya", dataIndex: "files", render:(f:any[])=>
            f?.length? <FileImageOutlined style={{fontSize:20}}/> : null
          },
        ]}
      />
      )}

      {/* Yeni Arıza Modalı */}
      <Modal
        open={modalOpen}
        title="Yeni Arıza Kaydı"
        onCancel={()=>setModalOpen(false)}
        onOk={onOk}
        okText="Kaydet"
        cancelText="Vazgeç"
        destroyOnClose
        maskClosable={false}
      >
        <Form form={form} layout="vertical">
          <Form.Item label="Açıklama" name="description" rules={[{required:true}]}>
            <Input />
          </Form.Item>
          <Form.Item label="Lokasyon" name="location">
            <Input />
          </Form.Item>
          <Form.Item label="Önem" name="importance" rules={[{required:true}]}>
            <Select>
              {importanceOptions.map(o=><Select.Option key={o} value={o}>{o}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Durum" name="status" rules={[{required:true}]}>
            <Select>
              {statusOptions.map(o=><Select.Option key={o} value={o}>{o}</Select.Option>)}
            </Select>
          </Form.Item>
          <Form.Item label="Üretimi Etkiledi mi?" name="productionImpact" valuePropName="checked">
            <Checkbox />
          </Form.Item>
          <Form.Item label="Duruş Süresi (dk)" name="downtimeMinutes">
            <InputNumber min={0}/>
          </Form.Item>
          <Form.Item label="Fotoğraf/Dosya" >
            <Upload
              beforeUpload={()=>false}
              fileList={fileList}
              onChange={({fileList})=>setFileList(fileList)}
              accept="image/*,.pdf"
              multiple
              listType="picture"
              maxCount={3}
            >
              <Button icon={<UploadOutlined />}>Dosya Seç</Button>
            </Upload>
          </Form.Item>
        </Form>
      </Modal>

      {/* Detay MODAL */}
      <Modal open={!!detail} title="Arıza Detay" footer={null} onCancel={()=>setDetail(null)}>
        {detail && (
          <div>
            <div><b>Açıklama:</b> {detail.description}</div>
            <div><b>Durum:</b> {detail.status}</div>
            <div><b>Önem:</b> {detail.importance}</div>
            <div><b>Kullanıcı:</b> {detail.user?.email}</div>
            <div><b>Lokasyon:</b> {detail.location}</div>
            <div><b>Üretimi Etkiledi mi?:</b> {detail.productionImpact ? "Evet" : "Hayır"}</div>
            <div><b>Kayıt Tarihi:</b> {moment(detail.date).format("DD.MM.YYYY HH:mm")}</div>
            {detail.productionStop && (
              <div>
                <b>Duruş:</b> {detail.productionStop.line} ({detail.productionStop.duration}dk)
              </div>
            )}
            <div style={{marginTop:12}}><b>Dosyalar:</b><br/>
              {detail.files?.map((f:any) => (
                <a key={f.id} href={f.url} target="_blank" rel="noopener noreferrer">
                  <img src={f.url} alt={f.fileName} style={{width:80, margin:6, borderRadius:8, border:"1px solid #eee"}}/>
                </a>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};
export default GeneralFaultsBook;
