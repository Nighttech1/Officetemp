/** Быстрая проверка автостыковки code / section name → колонки ИУЛ. */
import { autoMapTagsToColumns, IUL_WAYBILL_COLUMNS } from "./iul-to-waybill";

const cols = [...IUL_WAYBILL_COLUMNS];
const mapping = autoMapTagsToColumns(
  ["code", "section name", "invoice number", "invoice date", "n"],
  cols,
);

const expect: Record<string, string> = {
  code: "обозначение",
  "section name": "наименование",
  n: "__seq__",
};

for (const [tag, col] of Object.entries(expect)) {
  if (mapping[tag] !== col) {
    throw new Error(
      `autoMap failed for «${tag}»: got «${mapping[tag]}», want «${col}»`,
    );
  }
}

if (mapping["invoice number"] === "обозначение") {
  throw new Error("invoice number must not map to обозначение");
}

console.log("iul-to-waybill autoMap OK", mapping);
