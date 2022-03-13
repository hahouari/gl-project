"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
const path_1 = require("path");
const mysql_1 = require("mysql");
const os = require("os");
let connection;
let mainWindow;
let loginWindow;
let regClientWindow;
const createWindow = ({ minWidth, minHeight, width, height, resizable, minimizable, maximizable, parent, frame, webPreferences: { preload, webviewTag, nodeIntegration }, } = {}) => {
    let targetWindow = new electron_1.BrowserWindow({
        minWidth,
        minHeight,
        width,
        height,
        resizable,
        minimizable,
        maximizable,
        parent,
        frame,
        show: false,
        webPreferences: {
            preload,
            webviewTag,
            nodeIntegration,
        },
    });
    targetWindow.once("closed", () => {
        targetWindow = null;
    });
    return targetWindow;
};
let response = (_ev, channel, sttmntOrId, returnCh) => {
    if (channel == "query") {
        connection.query(sttmntOrId, (err, result, _f) => {
            if (err)
                throw err;
            if (returnCh == "login") {
                let type = result[0] ? result[0]["type"] : null;
                if (type) {
                    mainWindow.loadFile(path_1.join(__dirname, type == "Resp" ? "responsable" : "employe", "index.html"));
                    loginWindow.close();
                    mainWindow.show();
                }
                else {
                    loginWindow.webContents.send(returnCh, "Incorrect username/password");
                }
            }
            else if (returnCh == "verify-client") {
                if (result[0]) {
                    mainWindow.webContents.send(returnCh, result[0]["name"], result[0]["adresse"]);
                }
                else {
                    mainWindow.webContents.send(returnCh, "not-found");
                }
            }
            else
                mainWindow.webContents.send(returnCh, result);
        });
    }
    else if (channel == "update") {
        connection.query(sttmntOrId);
        if (returnCh == "register") {
            regClientWindow.close();
            mainWindow.webContents.send("register", sttmntOrId.match(/(?<=')[^',]+(?=')/g));
        }
        else
            mainWindow.webContents.send(returnCh);
    }
    else if (channel == "register-client") {
        regClientWindow = createWindow({
            resizable: false,
            height: 300,
            width: 480,
            parent: mainWindow,
            webPreferences: {
                nodeIntegration: true,
            },
        });
        regClientWindow.setMenu(null);
        regClientWindow.webContents.loadFile(path_1.join(__dirname, "employe", "register", "index.html"));
        regClientWindow.once("ready-to-show", () => {
            regClientWindow.webContents.send("client-id", sttmntOrId);
            regClientWindow.show();
        });
        regClientWindow.webContents.once("ipc-message", response);
    }
    else if (channel == "plc-vide-num") {
        connection.query("select count(*) free_places from T_Place where occupee=0;", (err, result) => {
            if (err)
                throw err;
            mainWindow.webContents.send("plc-vide-num", result[0]["free_places"]);
        });
    }
    else if (channel == "occ-plc") {
        connection.query("update T_Place set occupee=1 where occupee=0 limit 1;", (err) => {
            if (err)
                throw err;
            connection.query("select * from T_Place where occupee=1 order by numPlace desc limit 1;", (err, result) => mainWindow.webContents.send("occ-plc-row", result));
        });
    }
    else if (channel == "pieces-infos") {
        connection.query("select * from T_SortePieceDetache;", (err, result) => {
            if (err)
                throw err;
            mainWindow.webContents.send("pieces-infos", result);
        });
    }
};
electron_1.app.once("ready", () => {
    process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"] = true;
    loginWindow = createWindow({
        resizable: false,
        height: 300,
        width: 300,
        parent: mainWindow,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    loginWindow.loadFile(path_1.join("app", "login", "index.html"));
    mainWindow = createWindow({
        minWidth: 560,
        minHeight: 520,
        height: 520,
        webPreferences: {
            nodeIntegration: true,
        },
    });
    loginWindow.once("ready-to-show", loginWindow.show);
    loginWindow.setMenu(null);
    const username = os.userInfo().username;
    connection = mysql_1.createConnection({
        database: "prjgl",
        user: username,
        multipleStatements: true,
        password: "root",
    });
    mainWindow.webContents.on("ipc-message", response);
    loginWindow.webContents.on("ipc-message", response);
});
electron_1.app.on("before-quit", () => connection.end());
//# sourceMappingURL=index.js.map