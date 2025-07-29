import React from "react";
import { Button } from "antd";

const SomeComponent = () => {
  const handlePrint = () => {
    window.print(); // Bu Electron’ning `window.print` ni ishga tushiradi
  };

  return (
    <div>
      <h1>Some Content to Print</h1>
      <Button onClick={handlePrint}>Print</Button>
    </div>
  );
};

export default SomeComponent;
