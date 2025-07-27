import React from "react";
import { Modal } from "antd";

interface ModalZoomChartProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}
const ModalZoomChart: React.FC<ModalZoomChartProps> = ({ open, onClose, title, children }) => (
  <Modal
    open={open}
    title={title || ""}
    onCancel={onClose}
    footer={null}
    width="80vw"
    style={{ top: 32, minHeight: "60vh" }}
    bodyStyle={{ minHeight: "60vh", display: "flex", alignItems: "center", justifyContent: "center" }}
    destroyOnClose
  >
    <div style={{ width: "100%", minHeight: 400 }}>
      {children}
    </div>
  </Modal>
);
export default ModalZoomChart;
