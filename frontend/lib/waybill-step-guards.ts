import type { WaybillWizardState } from "@/lib/docs-store";
import { normalizeWaybillStep, resolveRowRange } from "@/lib/docs-store";

export { normalizeWaybillStep };

export function waybillStep1Complete(w: WaybillWizardState): boolean {
  return Boolean(w.templateName?.trim());
}

export function waybillStep2Complete(w: WaybillWizardState): boolean {
  return w.rows.length > 0 && w.columns.length > 0;
}

export function waybillStep3Complete(w: WaybillWizardState): boolean {
  if (!waybillStep1Complete(w) || !waybillStep2Complete(w)) return false;
  if (
    !w.rowRangeConfirmed ||
    typeof w.rowFrom !== "number" ||
    typeof w.rowTo !== "number"
  ) {
    return false;
  }
  if (w.tags.length === 0) return true;
  return w.tags.every((tag) => {
    const col = (w.mapping[tag] ?? "").trim();
    return col.length > 0;
  });
}

/** Готовность к скачиванию DOCX/PDF (стыковка + диапазон строк). */
export function waybillStep4Ready(w: WaybillWizardState): boolean {
  if (!waybillStep3Complete(w)) return false;
  const { selected } = resolveRowRange(w);
  return selected.length > 0;
}

/** Шаг N доступен (предыдущие выполнены). Мастер: 1 Шаблон → 2 Данные → 3 Стыковка → 4 Реестр. */
export function waybillStepUnlocked(
  w: WaybillWizardState,
  stepNum: 1 | 2 | 3 | 4,
): boolean {
  if (stepNum === 1) return true;
  if (stepNum === 2) return waybillStep1Complete(w);
  if (stepNum === 3) return waybillStep1Complete(w) && waybillStep2Complete(w);
  // Реестр необязателен — доступен после шаблона (клик сверху всегда работает).
  return waybillStep1Complete(w);
}

export function waybillCanGoNext(
  w: WaybillWizardState,
  stepNum: WaybillWizardState["step"],
): boolean {
  const n = normalizeWaybillStep(stepNum);
  if (n === 1) return waybillStep1Complete(w);
  if (n === 2) return waybillStep2Complete(w);
  if (n === 3) return waybillStep3Complete(w);
  return true;
}
