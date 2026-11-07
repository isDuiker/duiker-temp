const express = require("express");
const pool = require("../db");

const router = express.Router();

const CHART_KEYS = [
  "usage",
  "basicPie",
  "multiPie",
  "ratio",
  "bar",
  "trend",
];

// 图表示例汇总数据
router.get("/overview", async (req, res) => {
  try {
    const name = String(req.query.name || "").trim();
    const category = String(req.query.category || "").trim();
    const startDate = String(req.query.startDate || "").trim();
    const endDate = String(req.query.endDate || "").trim();

    const conditions = [];
    const params = [];

    if (name) {
      conditions.push("name LIKE ?");
      params.push(`%${name}%`);
    }

    if (category) {
      conditions.push("name LIKE ?");
      params.push(`%${category}%`);
    }

    let sql = "SELECT chart_key, name, value FROM chart_demo_data";

    if (conditions.length) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += " ORDER BY chart_key, sort_order, id";

    const [rows] = await pool.query(sql, params);

    const result = Object.fromEntries(
      CHART_KEYS.map((key) => [key, []]),
    );

    rows.forEach((row) => {
      if (!result[row.chart_key]) return;
      result[row.chart_key].push({
        name: row.name,
        value: Number(row.value) || 0,
      });
    });

    // 趋势数据按月份区间筛选
    if (startDate) {
      const startMonth = startDate.slice(0, 7);
      result.trend = result.trend.filter(
        (item) => item.name >= startMonth,
      );
    }

    if (endDate) {
      const endMonth = endDate.slice(0, 7);
      result.trend = result.trend.filter(
        (item) => item.name <= endMonth,
      );
    }

    res.json(result);
  } catch (error) {
    console.error("[charts] 查询失败:", error);
    res.status(500).json({ message: "数据库查询失败" });
  }
});

module.exports = router;
