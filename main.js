const electron = require('electron');
const app = electron.app;
const BrowserWindow = electron.BrowserWindow;

const nativeImage = electron.nativeImage;

const path = require('path');
const url = require('url');

const ipc = electron.ipcMain;
const Menu = electron.Menu;
const Tray = electron.Tray;

let tray = null;

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow;

function createWindow () {
  // Create the browser window.
  mainWindow = new BrowserWindow({width: 800, 
    center: true,
    // frame:false,
    resizable: true,
    // backgroundColor: '#fff',
    titleBarStyle: "hidden",
    webPreferences: {
      devTools: true
    },
    // transparent: true,
    maximizable: true,
    autoHideMenuBar: true,
    height: 600
  });
  // mainWindow.webContents.openDevTools();

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null;
  });

  mainWindow.on('close', function (e) {
    e.preventDefault();
    mainWindow.hide();
  });
}

function createTray() {
  let image = nativeImage.createFromPath(__dirname + '/file/logo.ico');
  tray = new Tray(image);
  const contextMenu = Menu.buildFromTemplate([
    {label: '打开主界面', type: 'normal'},
    {label: '退出', type: 'normal'}
  ])
  tray.on('click', () => {
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  // 打开主界面
  contextMenu.items[0].click = function(){
    mainWindow.show();
  }

  // 退出
  contextMenu.items[1].click = function(){
    mainWindow.destroy();
  }

  tray.setToolTip('数字小中南');
  tray.setContextMenu(contextMenu);
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', function(){
  createWindow();
  createTray();
})

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
