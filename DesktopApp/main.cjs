const path = require("node:path");
const http = require("node:http");
const net = require("node:net");
const { app, BrowserWindow, dialog, shell, utilityProcess } = require("electron");

let backendProcess = null;
let mainWindow = null;
let quitting = false;

if (!app.requestSingleInstanceLock()) {
  app.quit();
} else {
  app.on("second-instance", () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
    }
  });

  app.whenReady().then(startApplication).catch((error) => {
    dialog.showErrorBox("InternSync could not start", error.message);
    app.quit();
  });

  app.on("before-quit", () => {
    quitting = true;
    if (backendProcess) {
      backendProcess.kill();
      backendProcess = null;
    }
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });

  app.on("activate", () => {
    if (mainWindow === null && app.isReady()) {
      startApplication().catch((error) => {
        dialog.showErrorBox("InternSync could not start", error.message);
        app.quit();
      });
    }
  });
}

function findAvailablePort() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once("error", reject);
    probe.listen(0, "127.0.0.1", () => {
      const { port } = probe.address();
      probe.close((error) => error ? reject(error) : resolve(port));
    });
  });
}

function checkServer(port) {
  return new Promise((resolve, reject) => {
    const request = http.get({ hostname: "127.0.0.1", port, path: "/", timeout: 1000 }, (response) => {
      response.resume();
      response.statusCode === 200
        ? resolve()
        : reject(new Error(`Local app server returned HTTP ${response.statusCode}.`));
    });
    request.once("timeout", () => request.destroy(new Error("Local app server timed out.")));
    request.once("error", reject);
  });
}

function startBackend(rootPath, port) {
  const serverPath = path.join(rootPath, "Backend", "server.js");
  backendProcess = utilityProcess.fork(serverPath, [], {
    serviceName: "InternSync local server",
    cwd: rootPath,
    env: {
      ...process.env,
      PORT: String(port),
      INTERNSYNC_DATA_DIR: path.join(app.getPath("userData"), "data")
    }
  });
  backendProcess.on("exit", (code) => {
    backendProcess = null;
    if (!quitting && mainWindow && !mainWindow.isDestroyed()) {
      dialog.showErrorBox("InternSync server stopped", `The local document server exited unexpectedly (code ${code ?? "unknown"}). Restart InternSync to continue.`);
      app.quit();
    }
  });
  return backendProcess;
}

async function waitForBackend(port, child) {
  const deadline = Date.now() + 15000;
  let lastError = null;
  while (Date.now() < deadline) {
    if (child !== backendProcess) throw new Error("The InternSync server stopped during startup.");
    try {
      await checkServer(port);
      return;
    } catch (error) {
      lastError = error;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
  throw new Error(`The InternSync server did not become ready in time. ${lastError?.message || ""}`.trim());
}

function attachNavigationPolicy(window) {
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("mailto:")) {
      shell.openExternal(url);
    }
    return { action: "deny" };
  });
  window.webContents.on("will-navigate", (event, url) => {
    if (!url.startsWith("http://127.0.0.1:")) {
      event.preventDefault();
      if (url.startsWith("https://") || url.startsWith("http://") || url.startsWith("mailto:")) shell.openExternal(url);
    }
  });
}

async function startApplication() {
  if (mainWindow || quitting) return;
  const rootPath = app.isPackaged
    ? process.resourcesPath
    : path.resolve(__dirname, "..");
  const port = await findAvailablePort();
  const child = startBackend(rootPath, port);
  await waitForBackend(port, child);

  mainWindow = new BrowserWindow({
    width: 1380,
    height: 900,
    minWidth: 760,
    minHeight: 620,
    show: false,
    backgroundColor: "#f7f8fc",
    title: "InternSync — OJT Classroom",
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  attachNavigationPolicy(mainWindow);
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.on("closed", () => { mainWindow = null; });
  await mainWindow.loadURL(`http://127.0.0.1:${port}/`);
}
