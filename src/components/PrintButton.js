import { ipcRenderer } from "electron";

const PrintButton = () => {
  const handlePrint = () => {
    ipcRenderer.send("print-document"); // Electron bilan print qilish
  };

  return <button onClick={handlePrint}>Print</button>;
};

export default PrintButton;
