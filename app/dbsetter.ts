import { createConnection } from 'mysql';
import { readFile } from 'fs';
import { join } from 'path';
var connection = createConnection({
  host: 'localhost',
  database: 'prjgl',
  user: 'root',
  multipleStatements: true
});

connection.connect();
readFile(
  join(__dirname, 'prjgl.sql'),
  { encoding: 'utf8' },
  (err: NodeJS.ErrnoException, data: string) => {
    if (err) throw err;
    connection.query(data, function(error) {
      if (error) throw error;
      connection.end();
    });
  }
);
