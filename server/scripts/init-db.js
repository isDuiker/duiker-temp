const mysql = require("mysql2/promise");
const { createConfig, dbName } = require("../db");

if (!/^[A-Za-z0-9_]+$/.test(dbName)) {
  throw new Error("DB_NAME 只能包含字母、数字和下划线");
}

const SEED_DATA = [
  // 基础环形图
  { chartKey: "usage", name: "已使用", value: 341 },
  { chartKey: "usage", name: "未使用", value: 539 },
  // 基础饼图
  { chartKey: "basicPie", name: "类别A", value: 848 },
  { chartKey: "basicPie", name: "类别B", value: 835 },
  { chartKey: "basicPie", name: "类别C", value: 265 },
  { chartKey: "basicPie", name: "类别D", value: 484 },
  { chartKey: "basicPie", name: "类别E", value: 352 },
  // 多分类饼图
  { chartKey: "multiPie", name: "类别A", value: 4031 },
  { chartKey: "multiPie", name: "类别B", value: 1247 },
  { chartKey: "multiPie", name: "类别C", value: 540 },
  { chartKey: "multiPie", name: "类别D", value: 368 },
  { chartKey: "multiPie", name: "类别E", value: 284 },
  { chartKey: "multiPie", name: "类别F", value: 193 },
  { chartKey: "multiPie", name: "类别G", value: 100 },
  { chartKey: "multiPie", name: "类别H", value: 80 },
  // 占比环形图
  { chartKey: "ratio", name: "类别A", value: 1538 },
  { chartKey: "ratio", name: "类别B", value: 1120 },
  { chartKey: "ratio", name: "类别C", value: 1002 },
  // 基础柱状图
  { chartKey: "bar", name: "2020及以前", value: 483 },
  { chartKey: "bar", name: "2021", value: 842 },
  { chartKey: "bar", name: "2022", value: 1766 },
  { chartKey: "bar", name: "2023", value: 1620 },
  { chartKey: "bar", name: "2024", value: 2800 },
  { chartKey: "bar", name: "2025", value: 1200 },
  // 面积折线图
  { chartKey: "trend", name: "2025-01", value: 8700, statDate: "2025-01-01" },
  { chartKey: "trend", name: "2025-02", value: 8950, statDate: "2025-02-01" },
  { chartKey: "trend", name: "2025-03", value: 8600, statDate: "2025-03-01" },
  { chartKey: "trend", name: "2025-04", value: 9800, statDate: "2025-04-01" },
  { chartKey: "trend", name: "2025-05", value: 9600, statDate: "2025-05-01" },
  { chartKey: "trend", name: "2025-06", value: 10050, statDate: "2025-06-01" },
];

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function createDeviceSeed() {
  const owners = ["张伟", "李娜", "王强", "赵敏"];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return Array.from({ length: 48 }, (_, index) => {
    const id = index + 1;
    const date = new Date(today);
    date.setDate(today.getDate() - (48 - index));

    return {
      name: `设备-${String(id).padStart(2, "0")}`,
      code: `EQ-${1000 + id}`,
      status: index % 4 === 0 ? "disabled" : "enabled",
      owner: owners[index % 4],
      date: formatDate(date),
      remark: index % 3 === 0 ? "需要定期维护" : "运行正常",
    };
  });
}

const DEVICE_SEED = createDeviceSeed();

async function main() {
  const connection = await mysql.createConnection(createConfig(false));

  try {
    await connection.query(
      `CREATE DATABASE IF NOT EXISTS \`${dbName}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`,
    );
    await connection.query(`USE \`${dbName}\``);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chart_demo_data (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        chart_key VARCHAR(32) NOT NULL,
        name VARCHAR(64) NOT NULL,
        value INT NOT NULL DEFAULT 0,
        stat_date DATE NULL,
        sort_order INT NOT NULL DEFAULT 0,
        PRIMARY KEY (id),
        KEY idx_chart_key (chart_key),
        KEY idx_stat_date (stat_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS devices (
        id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        name VARCHAR(120) NOT NULL,
        code VARCHAR(64) NOT NULL,
        status ENUM('enabled', 'disabled') NOT NULL DEFAULT 'enabled',
        owner VARCHAR(64) NOT NULL DEFAULT '',
        \`date\` DATE NOT NULL,
        remark VARCHAR(255) NOT NULL DEFAULT '',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        KEY idx_name (name),
        KEY idx_code (code),
        KEY idx_status (status),
        KEY idx_date (\`date\`)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    const [[chartCount]] = await connection.query(
      "SELECT COUNT(*) AS count FROM chart_demo_data",
    );

    if (!chartCount.count) {
      const values = SEED_DATA.map((item, index) => [
        item.chartKey,
        item.name,
        item.value,
        item.statDate || null,
        index,
      ]);

      await connection.query(
        "INSERT INTO chart_demo_data (chart_key, name, value, stat_date, sort_order) VALUES ?",
        [values],
      );
    }

    const [[deviceCount]] = await connection.query(
      "SELECT COUNT(*) AS count FROM devices",
    );

    if (!deviceCount.count) {
      const values = DEVICE_SEED.map((item) => [
        item.name,
        item.code,
        item.status,
        item.owner,
        item.date,
        item.remark,
      ]);

      await connection.query(
        "INSERT INTO devices (name, code, status, owner, `date`, remark) VALUES ?",
        [values],
      );
    }

    const [[chartTotal]] = await connection.query(
      "SELECT COUNT(*) AS count FROM chart_demo_data",
    );
    const [[deviceTotal]] = await connection.query(
      "SELECT COUNT(*) AS count FROM devices",
    );

    console.log(
      `数据库 ${dbName} 初始化完成：图表数据 ${chartTotal.count} 条，设备数据 ${deviceTotal.count} 条。`,
    );
  } finally {
    await connection.end();
  }
}

main().catch((error) => {
  console.error("数据库初始化失败:", error.message);
  process.exitCode = 1;
});
