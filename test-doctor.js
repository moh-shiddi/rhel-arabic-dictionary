"use strict";

const fs = require("fs");
const path = require("path");

const doctorPath = path.join(__dirname, "doctor-data.json");
const knowledgePath = path.join(__dirname, "knowledge.json");
const doctor = JSON.parse(fs.readFileSync(doctorPath, "utf8"));
const knowledge = JSON.parse(fs.readFileSync(knowledgePath, "utf8"));
const entityIds = new Set((knowledge.entities || []).map(item => item.id));
const errors = [];
const warnings = [];
let nodesCount = 0;
let resultCount = 0;

function error(message) { errors.push(message); }
function warning(message) { warnings.push(message); }

for (const flow of doctor.flows || []) {
  const nodes = flow.nodes || {};
  const nodeIds = new Set(Object.keys(nodes));
  nodesCount += nodeIds.size;

  if (!flow.id) error("مسار بدون id");
  if (!nodeIds.has(flow.start_node)) error(`${flow.id}: start_node غير موجود (${flow.start_node})`);
  if (!Object.values(nodes).some(node => node.type === "result")) error(`${flow.id}: لا يحتوي أي نتيجة نهائية`);

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.id !== nodeId) error(`${flow.id}: مفتاح العقدة ${nodeId} لا يطابق id ${node.id}`);
    if (!["question", "check", "result"].includes(node.type)) error(`${flow.id}/${nodeId}: نوع غير صالح`);

    if (node.type === "result") {
      resultCount += 1;
      for (const relatedId of node.related_entity_ids || []) {
        if (!entityIds.has(relatedId)) warning(`${flow.id}/${nodeId}: مرجع غير موجود ${relatedId}`);
      }
    } else {
      if (!Array.isArray(node.choices) || !node.choices.length) error(`${flow.id}/${nodeId}: لا توجد اختيارات`);
      for (const choice of node.choices || []) {
        if (!nodeIds.has(choice.next)) error(`${flow.id}/${nodeId}: الخيار ${choice.id} يشير إلى عقدة غير موجودة ${choice.next}`);
      }
      if (node.type === "check" && !node.command) error(`${flow.id}/${nodeId}: عقدة check دون command`);
    }
  }

  // Reachability from start.
  const visited = new Set();
  const stack = [flow.start_node];
  while (stack.length) {
    const id = stack.pop();
    if (visited.has(id) || !nodes[id]) continue;
    visited.add(id);
    for (const choice of nodes[id].choices || []) stack.push(choice.next);
  }
  for (const id of nodeIds) {
    if (!visited.has(id)) warning(`${flow.id}: عقدة غير قابلة للوصول ${id}`);
  }

  if (flow.related_entity_id && !entityIds.has(flow.related_entity_id)) {
    warning(`${flow.id}: related_entity_id غير موجود ${flow.related_entity_id}`);
  }
}

console.log(`المسارات: ${(doctor.flows || []).length}`);
console.log(`العقد: ${nodesCount}`);
console.log(`النتائج النهائية: ${resultCount}`);
console.log(`التحذيرات: ${warnings.length}`);
for (const item of warnings) console.log(`تحذير: ${item}`);

if (errors.length) {
  console.error(`الأخطاء: ${errors.length}`);
  for (const item of errors) console.error(`خطأ: ${item}`);
  process.exit(1);
}

console.log("Linux Doctor data: VALID");
