"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mysql_1 = require("mysql");
const fs_1 = require("fs");
const path_1 = require("path");
var connection = mysql_1.createConnection({
    host: 'localhost',
    database: 'prjgl',
    user: 'root',
    multipleStatements: true
});
connection.connect();
fs_1.readFile(path_1.join(__dirname, 'prjgl.sql'), { encoding: 'utf8' }, (err, data) => {
    if (err)
        throw err;
    connection.query(data, function (error) {
        if (error)
            throw error;
        connection.end();
    });
});
//# sourceMappingURL=dbsetter.js.map