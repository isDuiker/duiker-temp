const path = require("path");
const mysql = require("mysql2/promise");

// 显式指定 server/.env，避免从其他目录启动时读取到错误的环境变量
require("dotenv").config({ path: path.join(__dirname, ".env"), quiet: true });

const DB_NAME = process.env.DB_NAME || "duiker_db";

function createConfig(withDatabase = true) {
  const config = {
    host: process.env.DB_HOST || "127.0.0.1",
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    charset: "utf8mb4",
  };

  if (withDatabase) {
    config.database = DB_NAME;
  }

  return config;
}

const pool = mysql.createPool({
  ...createConfig(true),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  dateStrings: true,
});

module.exports = pool;
module.exports.createConfig = createConfig;
module.exports.dbName = DB_NAME;
