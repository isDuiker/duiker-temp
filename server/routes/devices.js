const express = require("express");
const XLSX = require("xlsx");

const router = express.Router();

const owners = ["张伟", "李娜", "王强", "赵敏"];

// 演示数据，仅保存在内存中；服务重启后会恢复初始数据
const devices = Array.from({ length: 48 }, (_, index) => {
  const id = index + 1;
  return {
    id,
    name: `设备-${String(id).padStart(2, "0")}`,
    code: `EQ-${1000 + id}`,
    status: index % 4 === 0 ? "disabled" : "enabled",
    owner: owners[index % 4],
    date: `2026-${String((index % 12) + 1).padStart(2, "0")}-${String(
      (index % 27) + 1
    ).padStart(2, "0")}`,
    remark: index % 3 === 0 ? "需要定期维护" : "运行正常",
  };
});

function toPositiveInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isNaN(parsed) ? fallback : parsed;
}

function includesText(value, keyword) {
  if (!keyword) return true;
  return String(value ?? "")
    .toLowerCase()
    .includes(String(keyword).toLowerCase());
}

function compareValues(left, right, direction) {
  if (left === right) return 0;
  if (left == null) return 1;
  if (right == null) return -1;
  return left > right ? direction : -direction;
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

function filterAndSort(query) {
  const filtered = devices.filter((device) => {
    return (
      includesText(device.name, query.name) &&
      includesText(device.code, query.code) &&
      (!query.status || device.status === query.status) &&
      includesText(device.owner, query.owner) &&
      (!query.date || device.date === query.date) &&
      includesText(device.remark, query.remark)
    );
  });

  const sortFields = getSortFields(query).filter(([field]) =>
    Object.prototype.hasOwnProperty.call(devices[0] || {}, field)
  );

  if (!sortFields.length) return filtered;

  return [...filtered].sort((left, right) => {
    for (const [field, direction] of sortFields) {
      const result = compareValues(left[field], right[field], direction);
      if (result !== 0) return result;
    }
    return 0;
  });
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

// 导出设备 Excel
router.get("/export", (req, res) => {
  const rows = filterAndSort(req.query);
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
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.send(buffer);
});

// 导入设备 Excel
router.post("/import", (req, res) => {
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

  let nextId = devices.reduce((max, item) => Math.max(max, item.id), 0) + 1;
  const newDevices = imported.map((item) => {
    const device = { id: nextId, ...item };
    nextId += 1;
    return device;
  });

  devices.unshift(...newDevices);
  res.json({ imported: newDevices.length, total: devices.length });
});



// 分页查询设备列表
router.get("/", (req, res) => {
  const current = Math.max(1, toPositiveInt(req.query.current, 1));
  const size = Math.min(500, Math.max(1, toPositiveInt(req.query.size, 10)));
  const result = filterAndSort(req.query);
  const start = (current - 1) * size;

  res.json({
    records: result.slice(start, start + size),
    total: result.length,
  });
});

// 新增设备
router.post("/", (req, res) => {
  const body = req.body || {};
  const id = devices.reduce((max, item) => Math.max(max, item.id), 0) + 1;

  const device = {
    id,
    name: body.name || `设备-${String(id).padStart(2, "0")}`,
    code: body.code || `EQ-${1000 + id}`,
    status: body.status === "disabled" ? "disabled" : "enabled",
    owner: body.owner || "张伟",
    date: body.date || new Date().toISOString().slice(0, 10),
    remark: body.remark || "新增设备",
  };

  devices.unshift(device);
  res.status(201).json(device);
});

// 更新设备
router.put("/:id", (req, res) => {
  const id = toPositiveInt(req.params.id, 0);
  const device = devices.find((item) => item.id === id);

  if (!device) {
    res.status(404).json({ message: "设备不存在" });
    return;
  }

  const body = req.body || {};
  if (body.name !== undefined) device.name = body.name;
  if (body.code !== undefined) device.code = body.code;
  if (body.status !== undefined) {
    device.status = body.status === "disabled" ? "disabled" : "enabled";
  }
  if (body.owner !== undefined) device.owner = body.owner;
  if (body.date !== undefined) device.date = body.date;
  if (body.remark !== undefined) device.remark = body.remark;

  res.json(device);
});

// 批量删除设备
router.post("/batch-delete", (req, res) => {
  const ids = new Set(
    (Array.isArray(req.body?.ids) ? req.body.ids : []).map((id) =>
      Number.parseInt(id, 10)
    )
  );

  if (!ids.size) {
    res.status(400).json({ message: "请选择要删除的设备" });
    return;
  }

  const before = devices.length;
  for (let index = devices.length - 1; index >= 0; index -= 1) {
    if (ids.has(devices[index].id)) {
      devices.splice(index, 1);
    }
  }

  res.json({ deleted: before - devices.length });
});

// 删除单个设备
router.delete("/:id", (req, res) => {
  const id = toPositiveInt(req.params.id, 0);
  const index = devices.findIndex((item) => item.id === id);

  if (index === -1) {
    res.status(404).json({ message: "设备不存在" });
    return;
  }

  devices.splice(index, 1);
  res.json({ success: true, id });
});

module.exports = router;
