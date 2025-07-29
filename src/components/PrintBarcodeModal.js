// PrintBarcodeModal.js

import React, { useEffect, useRef } from "react";
import { Modal } from "antd"; // Ant Design modal

const PrintBarcodeModal = ({ visible, onCancel, barcode }) => {
  const printRef = useRef();

  useEffect(() => {
    if (visible) {
      setTimeout(() => {
        // Modal ochilganidan keyin print funksiyasini chaqirish
        window.print();
      }, 1000); // 1 soniya kutish
    }
  }, [visible]);

  const handlePrint = () => {
    window.print(); // Browserning o'z print funksiyasi
  };

  return (
    <Modal
      visible={visible}
      onCancel={onCancel}
      footer={null}
      title="Shtrix kodni chop etish"
    >
      <div ref={printRef}>
        <div style={{ textAlign: "center" }}>
          <h2>{barcode}</h2>
          {/* Bu yerda shtrix kod yoki boshqa materialni chiqarishingiz mumkin */}
          <button onClick={handlePrint}>Print</button>
        </div>
      </div>
    </Modal>
  );
};

export default PrintBarcodeModal;
