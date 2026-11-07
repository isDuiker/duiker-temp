const express = require("express");

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
