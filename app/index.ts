// @ts-nocheck
import {
  app,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  Event,
} from "electron";
import { join } from "path";
import { Connection, createConnection } from "mysql";
import * as os from "os";

/**
 * start connection and connect
 */
let connection: Connection;
/**
 * main window
 */
let mainWindow: BrowserWindow;

let loginWindow: BrowserWindow;

let regClientWindow: BrowserWindow;
/**
 * declared and initialized globally
 */
// let pyshell: ChildProcess;
/**
 * @param filePath  string path to an HTML file relative to the root of your application
 * @param options   constructor options for the browser window returned
 */
const createWindow = ({
  minWidth,
  minHeight,
  width,
  height,
  resizable,
  minimizable,
  maximizable,
  parent,
  frame,
  webPreferences: { preload, webviewTag, nodeIntegration },
}: BrowserWindowConstructorOptions = {}): BrowserWindow => {
  let targetWindow = new BrowserWindow({
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
    /**
     * free targetWindow
     */
    targetWindow = null;
  });
  return targetWindow;
};

/**
 *
 * @param _ev         channel event (doesn't matter)
 * @param channel     test if channel is sql
 * @param sttmntOrId  statement to execute on the sql database or client id to be registered
 * @param returnCh    which channel to return the result to
 */
let response = (
  _ev: Event,
  channel: string,
  sttmntOrId: string,
  returnCh: string
) => {
  if (channel == "query") {
    // query type returns data

    connection.query(sttmntOrId, (err, result, _f) => {
      if (err) throw err;
      if (returnCh == "login") {
        let type: string = result[0] ? result[0]["type"] : null;
        if (type) {
          mainWindow.loadFile(
            join(
              __dirname,
              type == "Resp" ? "responsable" : "employe",
              "index.html"
            )
          );
          loginWindow.close();
          mainWindow.show();
        } else {
          loginWindow.webContents.send(returnCh, "Incorrect username/password");
        }
      } else if (returnCh == "verify-client") {
        if (result[0]) {
          mainWindow.webContents.send(
            returnCh,
            result[0]["name"],
            result[0]["adresse"]
          );
        } else {
          mainWindow.webContents.send(returnCh, "not-found");
        }
      } else mainWindow.webContents.send(returnCh, result);
    });
  } else if (channel == "update") {
    connection.query(sttmntOrId);

    if (returnCh == "register") {
      regClientWindow.close();

      mainWindow.webContents.send(
        "register",
        sttmntOrId.match(/(?<=')[^',]+(?=')/g)
      );
    } else mainWindow.webContents.send(returnCh);
  } else if (channel == "register-client") {
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

    regClientWindow.webContents.loadFile(
      join(__dirname, "employe", "register", "index.html")
    );

    regClientWindow.once("ready-to-show", () => {
      regClientWindow.webContents.send("client-id", sttmntOrId);
      regClientWindow.show();
    });

    regClientWindow.webContents.once("ipc-message", response);
  } else if (channel == "plc-vide-num") {
    connection.query(
      "select count(*) free_places from T_Place where occupee=0;",
      (err, result) => {
        if (err) throw err;

        mainWindow.webContents.send("plc-vide-num", result[0]["free_places"]);
      }
    );
  } else if (channel == "occ-plc") {
    connection.query(
      "update T_Place set occupee=1 where occupee=0 limit 1;",
      (err) => {
        if (err) throw err;
        connection.query(
          "select * from T_Place where occupee=1 order by numPlace desc limit 1;",
          (err, result) => mainWindow.webContents.send("occ-plc-row", result)
        );
      }
    );
  } else if (channel == "pieces-infos") {
    connection.query("select * from T_SortePieceDetache;", (err, result) => {
      if (err) throw err;
      mainWindow.webContents.send("pieces-infos", result);
    });
  }
};

app.once("ready", () => {
  (<any>process.env["ELECTRON_DISABLE_SECURITY_WARNINGS"]) = true;

  // creates login window
  loginWindow = createWindow({
    resizable: false,
    height: 300,
    width: 300,
    parent: mainWindow,
    webPreferences: {
      nodeIntegration: true,
    },
  });

  loginWindow.loadFile(join("app", "login", "index.html"));

  // creates main window
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
  connection = createConnection({
    database: "prjgl",
    user: username,
    multipleStatements: true,
    password: "root",
  });

  mainWindow.webContents.on("ipc-message", response);
  loginWindow.webContents.on("ipc-message", response);
});

app.on("before-quit", () => connection.end());
