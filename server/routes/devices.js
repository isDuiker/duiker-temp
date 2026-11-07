const express = require("express");
const XLSX = require("xlsx");
const pool = require("../db");

const router = express.Router();

const SORTABLE_FIELDS = new Set([
  "id",
  "name",
  "code",
  "status",
  "owner",
  "date",
  "remark",
]);

const DEVICE_FIELDS = "id, name, code, status, owner, `date`, remark";

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function getSortFields(query) {
  const fields = [];
  const ascs = String(query.ascs || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  const descs = String(query.descs || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  ascs.forEach((field) => fields.push([field, 1]));
  descs.forEach((field) => fields.push([field, -1]));

  return fields;
}

function buildOrderBy(query) {
  const parts = getSortFields(query)
    .filter(([field]) => SORTABLE_FIELDS.has(field))
    .map(
      ([field, direction]) =>
        `\`${field}\` ${direction === 1 ? "ASC" : "DESC"}`,
    );

  return parts.length
    ? `ORDER BY ${parts.join(", ")}`
    : "ORDER BY `date` DESC, id DESC";
}

function buildFilters(query) {
  const conditions = [];
  const params = [];

  if (query.name) {
    conditions.push("name LIKE ?");
    params.push(`%${query.name}%`);
  }
  if (query.code) {
    conditions.push("code LIKE ?");
    params.push(`%${query.code}%`);
  }
  if (query.status) {
    conditions.push("status = ?");
    params.push(normalizeStatus(query.status));
  }
  if (query.owner) {
    conditions.push("owner LIKE ?");
    params.push(`%${query.owner}%`);
  }
  if (query.date) {
    conditions.push("`date` = ?");
    params.push(normalizeDate(query.date));
  }
  if (query.startDate) {
    conditions.push("`date` >= ?");
    params.push(normalizeDate(query.startDate));
  }
  if (query.endDate) {
    conditions.push("`date` <= ?");
    params.push(normalizeDate(query.endDate));
  }
  if (query.remark) {
    conditions.push("remark LIKE ?");
    params.push(`%${query.remark}%`);
  }

  return {
    whereSql: conditions.length
      ? `WHERE ${conditions.join(" AND ")}`
      : "",
    params,
  };
}

function normalizeStatus(value) {
  const text = String(value ?? "").trim().toLowerCase();
  return ["停用", "disabled", "0", "false"].includes(text)
    ? "disabled"
    : "enabled";
}

function padNumber(value) {
  return String(value).padStart(2, "0");
}

function normalizeDate(value) {
  if (!value) return new Date().toISOString().slice(0, 10);

  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "number") {
    const parsed = XLSX.SSF.parse_date_code(value);
    if (parsed) {
      return `${parsed.y}-${padNumber(parsed.m)}-${padNumber(parsed.d)}`;
    }
  }

  const text = String(value).trim();
  const date = new Date(text.replace(/\//g, "-"));
  return Number.isNaN(date.getTime()) ? text : date.toISOString().slice(0, 10);
}

function getRowValue(row, names) {
  for (const name of names) {
    if (row[name] !== undefined && row[name] !== null && row[name] !== "") {
      return row[name];
    }
  }
  return "";
}

function parseImportBuffer(buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer", cellDates: true });
  const sheetName = workbook.SheetNames[0];

  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: "" });

  return rows
    .map((row) => {
      const name = String(getRowValue(row, ["设备名称", "name"])).trim();
      const code = String(getRowValue(row, ["设备编码", "code"])).trim();

      return {
        name: name || code,
        code,
        status: normalizeStatus(getRowValue(row, ["状态", "status"])),
        owner: String(getRowValue(row, ["负责人", "owner"]) || "未知").trim(),
        date: normalizeDate(getRowValue(row, ["创建日期", "date"])),
        remark: String(getRowValue(row, ["备注", "remark"])).trim(),
      };
    })
    .filter((row) => row.name || row.code);
}

function parseMultipartFile(req) {
  const contentType = req.headers["content-type"] || "";
  const match = contentType.match(/boundary=(?:"([^"]+)"|([^;]+))/i);
  const boundary = match && (match[1] || match[2]);

  if (!boundary || !Buffer.isBuffer(req.body)) return null;

  const raw = req.body;
  const boundaryBuffer = Buffer.from(`--${boundary}`);
  let start = raw.indexOf(boundaryBuffer);

  while (start !== -1) {
    let headerStart = start + boundaryBuffer.length;

    if (raw[headerStart] === 13 && raw[headerStart + 1] === 10) {
      headerStart += 2;
    }

    // 最后一个边界
    if (raw[headerStart] === 45 && raw[headerStart + 1] === 45) {
      break;
    }

    const headerEnd = raw.indexOf(Buffer.from("\r\n\r\n"), headerStart);
    if (headerEnd === -1) break;

    const headers = raw.toString("utf8", headerStart, headerEnd);
    const contentStart = headerEnd + 4;
    const nextBoundary = raw.indexOf(boundaryBuffer, contentStart);
    if (nextBoundary === -1) break;

    let contentEnd = nextBoundary;
    if (raw[contentEnd - 2] === 13 && raw[contentEnd - 1] === 10) {
      contentEnd -= 2;
    }

    if (/name="file"/i.test(headers)) {
      return raw.subarray(contentStart, contentEnd);
    }

    start = nextBoundary;
  }

  return null;
}

function sendError(res, error, message) {
  console.error(`[devices] ${message}:`, error);
  res.status(500).json({ message });
}

// 导出设备 Excel
router.get("/export", async (req, res) => {
  try {
    const { whereSql, params } = buildFilters(req.query);
    const orderSql = buildOrderBy(req.query);
    const [rows] = await pool.query(
      `SELECT ${DEVICE_FIELDS} FROM devices ${whereSql} ${orderSql}`,
      params,
    );

    const data = rows.map((device, index) => ({
      序号: index + 1,
      设备名称: device.name,
      设备编码: device.code,
      状态: device.status === "enabled" ? "启用" : "停用",
      负责人: device.owner,
      创建日期: device.date,
      备注: device.remark,
    }));

    const sheet = XLSX.utils.json_to_sheet(data);
    sheet["!cols"] = [
      { wch: 8 },
      { wch: 18 },
      { wch: 16 },
      { wch: 10 },
      { wch: 12 },
      { wch: 14 },
      { wch: 28 },
    ];

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, sheet, "设备列表");

    const buffer = XLSX.write(workbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    res.attachment("devices.xlsx");
    res.type(
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.send(buffer);
  } catch (error) {
    sendError(res, error, "导出失败");
  }
});

// 导入设备 Excel
router.post("/import", async (req, res) => {
  const content = parseMultipartFile(req);

  if (content === null) {
    res.status(400).json({ message: "请选择要导入的文件" });
    return;
  }

  let imported = [];

  try {
    imported = parseImportBuffer(content);
  } catch (error) {
    res.status(400).json({ message: "文件解析失败，请上传有效的 Excel 文件" });
    return;
  }

  if (!imported.length) {
    res.status(400).json({ message: "未解析到有效的设备数据" });
    return;
  }

  try {
    const values = imported.map((item) => [
      item.name,
      item.code,
      item.status,
      item.owner,
      item.date,
      item.remark,
    ]);

    const [result] = await pool.query(
      "INSERT INTO devices (name, code, status, owner, `date`, remark) VALUES ?",
      [values],
    );

    const [[{ total }]] = await pool.query(
      "SELECT COUNT(*) AS total FROM devices",
    );

    res.json({ imported: result.affectedRows, total });
  } catch (error) {
    sendError(res, error, "导入失败");
  }
});

// 分页查询设备列表
router.get("/", async (req, res) => {
  try {
    const current = Math.max(1, toPositiveInt(req.query.current, 1));
    const size = Math.min(500, Math.max(1, toPositiveInt(req.query.size, 10)));
    const start = (current - 1) * size;

    const { whereSql, params } = buildFilters(req.query);
    const orderSql = buildOrderBy(req.query);

    const [[{ total }]] = await pool.query(
      `SELECT COUNT(*) AS total FROM devices ${whereSql}`,
      params,
    );

    const [records] = await pool.query(
      `SELECT ${DEVICE_FIELDS} FROM devices ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
      [...params, size, start],
    );

    res.json({ records, total });
  } catch (error) {
    sendError(res, error, "查询设备列表失败");
  }
});

// 新增设备
router.post("/", async (req, res) => {
  try {
    const body = req.body || {};
    const values = [
      body.name || "新设备",
      body.code || `EQ-${Date.now().toString().slice(-6)}`,
      normalizeStatus(body.status),
      body.owner || "未知",
      normalizeDate(body.date),
      body.remark || "",
    ];

    const [result] = await pool.query(
      "INSERT INTO devices (name, code, status, owner, `date`, remark) VALUES (?, ?, ?, ?, ?, ?)",
      values,
    );

    const [rows] = await pool.query(
      `SELECT ${DEVICE_FIELDS} FROM devices WHERE id = ?`,
      [result.insertId],
    );

    res.status(201).json(rows[0]);
  } catch (error) {
    sendError(res, error, "新增设备失败");
  }
});

// 更新设备
router.put("/:id", async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id, 0);

    if (!id) {
      res.status(400).json({ message: "设备 ID 无效" });
      return;
    }

    const [existing] = await pool.query(
      "SELECT id FROM devices WHERE id = ?",
      [id],
    );

    if (!existing.length) {
      res.status(404).json({ message: "设备不存在" });
      return;
    }

    const body = req.body || {};
    const fields = [];
    const params = [];

    if (body.name !== undefined) {
      fields.push("name = ?");
      params.push(body.name);
    }
    if (body.code !== undefined) {
      fields.push("code = ?");
      params.push(body.code);
    }
    if (body.status !== undefined) {
      fields.push("status = ?");
      params.push(normalizeStatus(body.status));
    }
    if (body.owner !== undefined) {
      fields.push("owner = ?");
      params.push(body.owner);
    }
    if (body.date !== undefined) {
      fields.push("`date` = ?");
      params.push(normalizeDate(body.date));
    }
    if (body.remark !== undefined) {
      fields.push("remark = ?");
      params.push(body.remark);
    }

    if (fields.length) {
      params.push(id);
      await pool.query(
        `UPDATE devices SET ${fields.join(", ")} WHERE id = ?`,
        params,
      );
    }

    const [rows] = await pool.query(
      `SELECT ${DEVICE_FIELDS} FROM devices WHERE id = ?`,
      [id],
    );

    res.json(rows[0]);
  } catch (error) {
    sendError(res, error, "更新设备失败");
  }
});

// 批量删除设备
router.post("/batch-delete", async (req, res) => {
  const ids = [
    ...new Set(
      (Array.isArray(req.body?.ids) ? req.body.ids : [])
        .map((id) => Number.parseInt(id, 10))
        .filter((id) => Number.isInteger(id) && id > 0),
    ),
  ];

  if (!ids.length) {
    res.status(400).json({ message: "请选择要删除的设备" });
    return;
  }

  try {
    const [result] = await pool.query(
      "DELETE FROM devices WHERE id IN (?)",
      [ids],
    );
    res.json({ deleted: result.affectedRows });
  } catch (error) {
    sendError(res, error, "批量删除设备失败");
  }
});

// 删除单个设备
router.delete("/:id", async (req, res) => {
  try {
    const id = toPositiveInt(req.params.id, 0);

    if (!id) {
      res.status(400).json({ message: "设备 ID 无效" });
      return;
    }

    const [result] = await pool.query(
      "DELETE FROM devices WHERE id = ?",
      [id],
    );

    if (!result.affectedRows) {
      res.status(404).json({ message: "设备不存在" });
      return;
    }

    res.json({ success: true, id });
  } catch (error) {
    sendError(res, error, "删除设备失败");
  }
});

module.exports = router;
