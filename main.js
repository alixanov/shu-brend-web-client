// main.js
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true, // Node.js integratsiyasini yoqish
      contextIsolation: false, // IPC ishlatish uchun
    },
  });

  mainWindow.loadURL("http://localhost:3000");

}
// dsads
app.whenReady().then(() => {
  createWindow();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// IPC orqali chop etishni boshqarish
ipcMain.on("print-barcode", (event, barcode) => {
  const printWindow = new BrowserWindow({
    show: false, // Foydalanuvchiga ko‘rinmasin
    webPreferences: { nodeIntegration: true, contextIsolation: false },
  });

  // Barcode’ni HTML sifatida yuklash
  printWindow.loadURL(
    `data:text/html;charset=utf-8,<h2>Barcode: ${barcode}</h2>`
  );

  printWindow.webContents.on("did-finish-load", () => {
    printWindow.webContents.print({ silent: false }, (success, errorType) => {
      if (!success) console.error("Chop etishda xato:", errorType);
      printWindow.close(); // Chop etishdan keyin oynani yopish
    });
  });
});
