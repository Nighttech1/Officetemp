"use client";

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Cloud, FileSpreadsheet, Files } from "lucide-react";
import { ApiError, analyzeTemplate, fetchCloudTable, generateDocx, generatePdf, uploadExcel } from "@/lib/api";
import {
  buildWizardContext,
  createGeneratedWaybillSnapshot,
  getDocument,
  loadDocDataFile,
  loadDocTemplate,
  loadWaybillRowsFromIdb,
  resolveRowRange,
  saveDocDataFile,
  saveDocTemplate,
  updateDocument,
  waybillRegistryFromActiveProfile,
  type DocItem,
  type WaybillWizardState,
} from "@/lib/docs-store";
import { SheetMultiSelect } from "@/components/docs/SheetMultiSelect";
import {
  autoMapTagsToColumns,
  IUL_WAYBILL_COLUMNS,
  iulWizardToRow,
} from "@/lib/iul-to-waybill";
import { Button } from "@/components/Button";
import { Field } from "@/components/Field";
import { StatusMessage } from "@/components/StatusMessage";
import { GlassCard } from "@/components/ui/GlassCard";
import { DocsStepMotion } from "@/components/docs/DocsStepMotion";
import { PreferencesCard, type PreferenceRow } from "@/components/ui/preferences-card";
import { CloudSheetsHelp } from "@/components/docs/CloudSheetsHelp";
import { WaybillTemplateHelp } from "@/components/docs/WaybillTemplateHelp";
import { RowRangePicker } from "@/components/docs/RowRangePicker";
import { WaybillLivePreview } from "@/components/docs/WaybillLivePreview";
import { ResizablePreviewShell } from "@/components/docs/ResizablePreviewShell";
import { SlideTabs } from "@/components/ui/slide-tabs";
import {
  normalizeWaybillStep,
  waybillCanGoNext,
  waybillStep2Complete,
  waybillStep4Ready,
  waybillStepUnlocked,
} from "@/lib/waybill-step-guards";
import { WaybillRegistryFieldList } from "@/components/docs/WaybillRegistryFieldList";
import { FieldSelect } from "@/components/ui/FieldSelect";
import { cn } from "@/lib/utils";

const STEPS = [
  { id: "1", n: 1 as const, label: "Шаблон" },
  { id: "2", n: 2 as const, label: "Данные" },
  { id: "3", n: 3 as const, label: "Стыковка" },
  { id: "4", n: 4 as const, label: "Реестр" },
];

type Props = {
  docId: string;
  /** Выбранные в дереве ИУЛ (раздел накладных, C-111). */
  selectedIulIds?: string[];
  /** После генерации / смены дерева — обновить сайдбар. */
  onChanged?: () => void;
  /** Открыть только что созданный снимок накладной в дереве. */
  onOpenDoc?: (docId: string) => void;
};

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function looksLikeCloudTableUrl(url: string): boolean {
  const u = url.trim().toLowerCase();
  return (
    u.includes("docs.google.com/spreadsheets") ||
    u.includes("sheets.google.com") ||
    u.includes("disk.yandex") ||
    u.includes("yadi.sk") ||
    u.includes("docs.yandex")
  );
}

export function WaybillWizard({
  docId,
  selectedIulIds = [],
  onChanged,
  onOpenDoc,
}: Props) {
  const [doc, setDoc] = useState<DocItem | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  /** Только кнопка «Подключить» — не смешивать с busy шаблона/excel. */
  const [cloudConnecting, setCloudConnecting] = useState(false);
  const [stepsVertical, setStepsVertical] = useState(false);
  const [registryRows, setRegistryRows] = useState<
    { field: string; column: string }[]
  >([{ field: "number", column: "" }, { field: "date", column: "" }, { field: "file_link", column: "" }]);
  const [registryColumns, setRegistryColumns] = useState<string[]>([]);
  const [registryConnecting, setRegistryConnecting] = useState(false);
  /** Последняя успешно подключённая ссылка — чтобы не дёргать API повторно. */
  const lastConnectedUrlRef = useRef<string>("");
  const lastRegistryUrlRef = useRef<string>("");
  const connectInFlightRef = useRef(false);

  const reload = useCallback(() => {
    setDoc(getDocument(docId));
  }, [docId]);

  useLayoutEffect(() => {
    reload();
    setError(null);
    setOk(null);
  }, [docId, reload]);

  // После перезагрузки страницы реестр (wizard.rows) не лежит в localStorage —
  // подтягиваем его из IndexedDB и обновляем документ из кэша.
  useEffect(() => {
    const d = getDocument(docId);
    if (!d || d.kind !== "waybill" || d.wizard.rows.length > 0) return;
    let cancelled = false;
    void loadWaybillRowsFromIdb(docId).then((rows) => {
      if (!cancelled && rows && rows.length) reload();
    });
    return () => {
      cancelled = true;
    };
  }, [docId, reload]);

  // Сброс «залипшего» диапазона из старого storage — без явного подтверждения не fill.
  useEffect(() => {
    const d = getDocument(docId);
    if (!d || d.kind !== "waybill") return;
    if (
      !d.wizard.rowRangeConfirmed &&
      (typeof d.wizard.rowFrom === "number" ||
        typeof d.wizard.rowTo === "number")
    ) {
      updateDocument(docId, {
        wizard: {
          rowFrom: undefined,
          rowTo: undefined,
          rowRangeConfirmed: false,
        },
      });
      reload();
      // #region agent log
      fetch(
        "http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6cfa5a",
          },
          body: JSON.stringify({
            sessionId: "6cfa5a",
            runId: "w87",
            hypothesisId: "H-fill",
            location: "WaybillWizard.tsx:clearStaleRange",
            message: "cleared unconfirmed rowFrom/rowTo",
            data: { docId },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
    }
  }, [docId, reload]);

  useEffect(() => {
    if (!doc?.wizard.registryMap) return;
    const entries = Object.entries(doc.wizard.registryMap);
    if (entries.length > 0) {
      setRegistryRows(entries.map(([field, column]) => ({ field, column })));
    }
  }, [doc?.id, doc?.wizard.registryMap]);

  // Шаг реестра: слева поля уже из шаблона накладной (+ ссылка на файл).
  useEffect(() => {
    if (!doc || normalizeWaybillStep(doc.wizard.step) !== 4) return;
    const tags = doc.wizard.tags;
    if (tags.length === 0) return;
    const saved = doc.wizard.registryMap ?? {};
    const fields = [...tags];
    if (!fields.includes("file_link")) fields.push("file_link");
    setRegistryRows(
      fields.map((field) => ({
        field,
        column: saved[field] ?? "",
      })),
    );
  }, [doc?.id, doc?.wizard.step, doc?.wizard.tags, doc?.wizard.registryMap]);

  function persist(
    patch: Partial<Pick<DocItem, "title" | "status">> & {
      wizard?: Partial<WaybillWizardState>;
    },
  ) {
    const updated = updateDocument(docId, patch);
    if (updated) {
      setDoc(updated);
      // C-221: дерево не бампим на смене шага/полей — только при смене заголовка
      if (patch.title !== undefined) onChanged?.();
      return;
    }
    // Ghost docId после workspace pull — документ исчез из store.
    setError(
      "Документ в дереве устарел после синхронизации. Выберите накладную слева или обновите страницу.",
    );
    setDoc(null);
    onChanged?.();
  }

  useEffect(() => {
    if (!doc) return;
    const url = doc.wizard.registryUrl?.trim();
    const map = doc.wizard.registryMap;
    const hasMap = map && Object.keys(map).length > 0;
    if (url || hasMap) return;
    const reg = waybillRegistryFromActiveProfile(doc.projectId);
    if (!reg) return;
    persist({ wizard: { registryUrl: reg.registryUrl, registryMap: reg.registryMap } });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- подстановка при пустом реестре
  }, [doc?.id, doc?.projectId]);

  function setStep(step: WaybillWizardState["step"] | number) {
    persist({ wizard: { step: normalizeWaybillStep(step) } });
  }

  async function onTemplateFile(file: File | undefined) {
    if (!file || !doc) return;
    setError(null);
    setOk(null);
    if (!file.name.toLowerCase().endsWith(".docx")) {
      setError("Нужен файл Word с расширением .docx");
      return;
    }
    setBusy(true);
    try {
      const { tags: rawTags } = await analyzeTemplate(file);
      const tags: string[] = [];
      for (const t of rawTags as unknown[]) {
        if (typeof t === "string") {
          tags.push(t);
          continue;
        }
        if (t && typeof t === "object") {
          const o = t as { name?: string; kind?: string };
          if (
            o.kind === "tr_for" ||
            o.kind === "for" ||
            o.kind === "if" ||
            o.kind === "other"
          ) {
            continue;
          }
          if (o.name) tags.push(o.name);
        }
      }
      const uniqueTags = [...new Set(tags)];
      await saveDocTemplate(docId, file);
      const mapping: Record<string, string> = {};
      for (const tag of uniqueTags) {
        mapping[tag] = doc.wizard.mapping[tag] ?? "";
      }
      const titleFromFile = file.name.replace(/\.docx$/i, "");
      // Важно: templateName пишем всегда — даже если меток 0 (только циклы),
      // иначе на шаге 3 кажется, что шаблон «отвалился».
      persist({
        title: doc.title === "Новый документ" ? titleFromFile : doc.title,
        wizard: {
          templateName: file.name,
          tags: uniqueTags,
          mapping,
        },
      });
      setOk(
        uniqueTags.length
          ? `Шаблон «${file.name}» сохранён. Найдено полей: ${uniqueTags.length}.`
          : `Шаблон «${file.name}» сохранён. Обычных полей {{…}} не найдено — проверьте метки или циклы таблицы.`,
      );
    } catch (err) {
      const raw =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Не удалось разобрать шаблон";
      setError(
        /not authenticated/i.test(raw)
          ? "Нет входа в API. Обновите страницу — кабинет должен подключиться сам. Или войдите через «Личный кабинет» (admin1 / admin1)."
          : raw,
      );
    } finally {
      setBusy(false);
    }
  }

  async function applyDataDataset(
    file: File | null,
    ds: Awaited<ReturnType<typeof uploadExcel>>,
    opts?: {
      dataUrl?: string;
      dataFilename?: string;
      selectedSheetNames?: string[];
    },
  ) {
    if (!doc) return;
    if (file) await saveDocDataFile(docId, file);
    const sheets =
      (ds.meta.extra?.sheets as string[] | undefined)?.filter(Boolean) ?? [];
    const sheetName =
      (ds.meta.extra?.sheet_name as string | undefined) ?? sheets[0] ?? undefined;
    const mapping: Record<string, string> = { ...doc.wizard.mapping };
    for (const tag of doc.wizard.tags) {
      if (!(tag in mapping)) mapping[tag] = "";
    }
    const dataFilename =
      opts?.dataFilename ??
      file?.name ??
      (ds.source === "google"
        ? "Google Таблица"
        : ds.source === "yandex"
          ? "Яндекс Таблица"
          : doc.wizard.dataFilename);
    const allCols =
      (ds.meta.extra?.all_columns as string[] | undefined)?.filter(Boolean) ??
      [];
    const columns =
      allCols.length > 0
        ? [...new Set([...ds.columns, ...allCols])]
        : ds.columns;
    const selectedSheets =
      opts?.selectedSheetNames ??
      (sheetName ? [sheetName] : sheets.length ? [sheets[0]] : []);
    persist({
      wizard: {
        columns,
        rows: ds.rows,
        dataFilename,
        dataUrl: opts?.dataUrl ?? doc.wizard.dataUrl,
        mapping,
        // Диапазон строк — только после явного выбора на стыковке.
        rowFrom: undefined,
        rowTo: undefined,
        rowRangeConfirmed: false,
        sheetName: selectedSheets[0] ?? sheetName,
        sheetNames: sheets,
        selectedSheetNames: selectedSheets,
      },
    });
    setOk(
      `Данные подключены${selectedSheets.length ? `, листы: ${selectedSheets.join(", ")}` : ""}: ${ds.meta.row_count} строк, ${columns.length} колонок${allCols.length > ds.columns.length ? " (имена колонок со всех листов книги)" : ""}. На стыковке укажите строки — тогда данные появятся в предпросмотре.`,
    );
  }

  async function onDataFile(file: File | undefined) {
    if (!file || !doc) return;
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const ds = await uploadExcel(file);
      await applyDataDataset(file, ds);
    } catch (err) {
      const raw =
        err instanceof ApiError
          ? err.detail
          : "Не удалось прочитать Excel или CSV";
      setError(
        /not authenticated/i.test(raw)
          ? "Нет входа в API. Обновите страницу или войдите через «Личный кабинет» (admin1 / admin1)."
          : raw,
      );
    } finally {
      setBusy(false);
    }
  }

  async function onConnectCloudUrl(urlOverride?: string) {
    if (!doc) return;
    if (connectInFlightRef.current && cloudConnecting) return;
    const url = (urlOverride ?? doc.wizard.dataUrl ?? "").trim();
    // #region agent log
    fetch("http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "6cfa5a",
      },
      body: JSON.stringify({
        sessionId: "6cfa5a",
        runId: "post-fix",
        hypothesisId: "H5",
        location: "WaybillWizard.tsx:onConnectCloudUrl:entry",
        message: "connect cloud url invoked",
        data: {
          hasOverride: Boolean(urlOverride),
          urlLen: url.length,
          looksLike: looksLikeCloudTableUrl(url),
          cloudConnecting,
          rows: doc.wizard.rows.length,
          lastConnectedLen: lastConnectedUrlRef.current.length,
          triggerHint: urlOverride ? "override" : "button",
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    if (!url) {
      setError("Вставьте ссылку на Google или Яндекс таблицу.");
      return;
    }
    if (!looksLikeCloudTableUrl(url)) {
      setError(
        "Нужна ссылка на Google Таблицы (docs.google.com/spreadsheets/…) или Яндекс.",
      );
      return;
    }
    if (
      url === lastConnectedUrlRef.current &&
      doc.wizard.rows.length > 0 &&
      (doc.wizard.sheetNames?.length ?? 0) > 0
    ) {
      setOk(
        `Таблица уже подключена (${doc.wizard.rows.length} строк). Можно идти на стыковку.`,
      );
      // #region agent log
      fetch(
        "http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6cfa5a",
          },
          body: JSON.stringify({
            sessionId: "6cfa5a",
            runId: "post-fix",
            hypothesisId: "H5",
            location: "WaybillWizard.tsx:onConnectCloudUrl:dedup",
            message: "connect skipped — same url already loaded",
            data: { rows: doc.wizard.rows.length },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      return;
    }
    connectInFlightRef.current = true;
    setError(null);
    setOk(null);
    setCloudConnecting(true);
    // Даём браузеру отрисовать контур до сетевого вызова.
    await new Promise<void>((r) =>
      requestAnimationFrame(() => requestAnimationFrame(() => r())),
    );
    try {
      const ds = await fetchCloudTable(url);
      // #region agent log
      fetch(
        "http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6cfa5a",
          },
          body: JSON.stringify({
            sessionId: "6cfa5a",
            runId: "post-fix",
            hypothesisId: "H4-H5",
            location: "WaybillWizard.tsx:onConnectCloudUrl:success",
            message: "fetchCloudTable ok",
            data: {
              source: ds.source,
              rowCount: ds.meta?.row_count ?? ds.rows?.length,
              cols: ds.columns?.length,
              sheets: (ds.meta?.extra as { sheets?: string[] } | undefined)
                ?.sheets?.length,
              via: (ds.meta?.extra as { via?: string } | undefined)?.via,
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      await applyDataDataset(null, ds, { dataUrl: url });
      lastConnectedUrlRef.current = url;
    } catch (err) {
      const raw =
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Не удалось подключить таблицу по ссылке";
      // #region agent log
      fetch(
        "http://127.0.0.1:7681/ingest/5f74e7af-cc2f-4b5f-8ca1-8fa8f20ea9e6",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Debug-Session-Id": "6cfa5a",
          },
          body: JSON.stringify({
            sessionId: "6cfa5a",
            runId: "post-fix",
            hypothesisId: "H4-H5",
            location: "WaybillWizard.tsx:onConnectCloudUrl:error",
            message: "fetchCloudTable failed",
            data: {
              status: err instanceof ApiError ? err.status : null,
              detail: String(raw).slice(0, 240),
            },
            timestamp: Date.now(),
          }),
        },
      ).catch(() => {});
      // #endregion
      setError(
        /not authenticated/i.test(raw)
          ? "Нет входа в API. Обновите страницу или войдите через «Личный кабинет»."
          : raw,
      );
    } finally {
      connectInFlightRef.current = false;
      setCloudConnecting(false);
    }
  }

  async function onSheetsChange(selectedNames: string[]) {
    if (!doc || selectedNames.length === 0) return;
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const url = (doc.wizard.dataUrl ?? "").trim();
      const file = await loadDocDataFile(docId);
      const colSet: string[] = [];
      const seenCol = new Set<string>();
      const mergedRows: Record<string, unknown>[] = [];
      let sheetNames = doc.wizard.sheetNames ?? [];
      let dataFilename = doc.wizard.dataFilename;
      let source = "excel";

      for (const name of selectedNames) {
        const ds = file
          ? await uploadExcel(file, name)
          : url
            ? await fetchCloudTable(url, name)
            : null;
        if (!ds) {
          throw new Error(
            "Нет файла и нет ссылки. Загрузите Excel или подключите таблицу по ссылке.",
          );
        }
        source = ds.source;
        const sheets =
          (ds.meta.extra?.sheets as string[] | undefined)?.filter(Boolean) ??
          [];
        if (sheets.length) sheetNames = sheets;
        const allCols =
          (ds.meta.extra?.all_columns as string[] | undefined)?.filter(
            Boolean,
          ) ?? [];
        for (const c of [...ds.columns, ...allCols]) {
          if (c && !seenCol.has(c)) {
            seenCol.add(c);
            colSet.push(c);
          }
        }
        for (const row of ds.rows) {
          mergedRows.push({ ...row, __sheet: name });
        }
        if (!dataFilename) {
          dataFilename =
            source === "google"
              ? "Google Таблица"
              : source === "yandex"
                ? "Яндекс Таблица"
                : file?.name ?? dataFilename;
        }
      }

      if (file) await saveDocDataFile(docId, file);
      const mapping: Record<string, string> = { ...doc.wizard.mapping };
      for (const tag of doc.wizard.tags) {
        if (!(tag in mapping)) mapping[tag] = "";
      }
      persist({
        wizard: {
          columns: colSet,
          rows: mergedRows,
          dataFilename,
          dataUrl: url || doc.wizard.dataUrl,
          mapping,
          rowFrom: undefined,
          rowTo: undefined,
          rowRangeConfirmed: false,
          sheetName: selectedNames[0],
          sheetNames,
          selectedSheetNames: selectedNames,
        },
      });
      setOk(
        `Выбрано листов: ${selectedNames.length}. Строк: ${mergedRows.length}, колонок: ${colSet.length}. Укажите диапазон строк на стыковке.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Не удалось загрузить выбранные листы",
      );
    } finally {
      setBusy(false);
    }
  }

  function setMapping(tag: string, column: string) {
    if (!doc) return;
    persist({
      wizard: {
        mapping: { ...doc.wizard.mapping, [tag]: column },
      },
    });
  }

  async function runGenerate(kind: "docx" | "pdf") {
    if (!doc) return;
    setError(null);
    setOk(null);
    setBusy(true);
    try {
      const file = await loadDocTemplate(docId);
      if (!file) {
        throw new Error(
          "Файл шаблона не найден. Вернитесь к шагу 1 и загрузите .docx ещё раз.",
        );
      }
      if (doc.wizard.rows.length === 0) {
        throw new Error(
          "Нет строк данных. Загрузите Excel/CSV на шаге 2 или дождитесь загрузки из облака.",
        );
      }
      const { selected, fromIdx, toIdx } = resolveRowRange(doc.wizard);
      if (selected.length === 0) {
        throw new Error(
          "В выбранном диапазоне нет строк. Проверьте номера «с» и «по».",
        );
      }
      const context = buildWizardContext(doc.wizard);
      const result =
        kind === "docx"
          ? await generateDocx(file, context)
          : await generatePdf(file, context);
      triggerDownload(result.blob, result.filename);
      const numRaw =
        context.NN ?? context.number ?? context["номер"] ?? "";
      const num = String(numRaw || "").trim() || String(Date.now()).slice(-6);
      const snapTitle = `Накладная №${num}`;
      persist({
        status: "ready",
        wizard: {
          lastGenerateNote: `Скачан ${kind.toUpperCase()} по строкам ${fromIdx + 1}–${toIdx + 1} (${selected.length} шт.)`,
        },
      });
      // Новый файл в дереве проекта с номером; шаблон копируем в IndexedDB.
      const snap = createGeneratedWaybillSnapshot(docId, snapTitle);
      if (snap) {
        try {
          await saveDocTemplate(snap.id, file);
          const dataFile = await loadDocDataFile(docId);
          if (dataFile) await saveDocDataFile(snap.id, dataFile);
        } catch {
          /* снимок без локального файла — wizard всё равно сохранён */
        }
        onChanged?.();
        onOpenDoc?.(snap.id);
      }
      setOk(
        `Готово: «${result.filename}» скачан. В дереве слева появился файл «${snapTitle}».`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Генерация не удалась",
      );
    } finally {
      setBusy(false);
    }
  }

  async function onConnectRegistryUrl() {
    if (!doc) return;
    const url = (doc.wizard.registryUrl ?? "").trim();
    if (!url) {
      setError("Вставьте ссылку на таблицу-реестр (Google или Яндекс).");
      return;
    }
    if (!looksLikeCloudTableUrl(url)) {
      setError(
        "Нужна ссылка на Google Таблицы (docs.google.com/spreadsheets/…) или Яндекс.",
      );
      return;
    }
    if (
      url === lastRegistryUrlRef.current &&
      registryColumns.length > 0
    ) {
      setOk(
        `Реестр уже подключён (${registryColumns.length} колонок). Сопоставьте поля ниже.`,
      );
      return;
    }
    setError(null);
    setOk(null);
    setRegistryConnecting(true);
    try {
      const ds = await fetchCloudTable(url);
      const allCols =
        (ds.meta.extra?.all_columns as string[] | undefined)?.filter(
          Boolean,
        ) ?? [];
      const cols =
        allCols.length > 0
          ? [...new Set([...ds.columns, ...allCols])]
          : ds.columns;
      setRegistryColumns(cols);
      lastRegistryUrlRef.current = url;
      // Авто-стыковка по совпадению имён: поле шаблона → колонка реестра
      const lower = new Map(cols.map((c) => [c.trim().toLowerCase(), c]));
      setRegistryRows((prev) =>
        prev.map((row) => {
          if (row.column) return row;
          const hit = lower.get(row.field.trim().toLowerCase());
          return hit ? { ...row, column: hit } : row;
        }),
      );
      setOk(
        `Реестр подключён: ${cols.length} колонок, ${ds.meta.row_count} строк. Слева поля уже из накладной — выберите колонки справа.`,
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : err instanceof Error
            ? err.message
            : "Не удалось подключить реестр",
      );
    } finally {
      setRegistryConnecting(false);
    }
  }

  function saveRegistry() {
    if (!doc) return;
    const map: Record<string, string> = {};
    for (const row of registryRows) {
      const f = row.field.trim();
      if (!f) continue;
      map[f] = row.column.trim();
    }
    persist({
      wizard: {
        registryUrl: doc.wizard.registryUrl,
        registryMap: map,
      },
    });
    setOk(
      "Настройки реестра сохранены. Автозапись в облачную таблицу появится, когда подключим коннекторы.",
    );
  }

  const selectedIulDocs = useMemo(
    () =>
      selectedIulIds
        .map((id) => getDocument(id))
        .filter((d): d is DocItem => !!d && d.kind === "info_sheet"),
    [selectedIulIds],
  );

  async function applyIulsFromTree() {
    if (!doc) return;
    const rows: Record<string, unknown>[] = [];
    for (const d of selectedIulDocs) {
      if (!d.iulWizard) continue;
      rows.push(iulWizardToRow(d.iulWizard));
    }
    if (!rows.length) {
      setError("Выберите слева один или несколько ИУЛ с заполненными данными");
      return;
    }
    const columns = [...IUL_WAYBILL_COLUMNS];
    let tags = [...(doc.wizard.tags || [])];
    // Если теги шаблона ещё не разобраны — подтянуть с файла
    if (!tags.length && doc.wizard.templateName) {
      try {
        const file = await loadDocTemplate(docId);
        if (file) {
          const analyzed = await analyzeTemplate(file);
          const extracted: string[] = [];
          for (const t of analyzed.tags as unknown[]) {
            if (typeof t === "string") extracted.push(t);
            else if (t && typeof t === "object" && (t as { name?: string }).name) {
              const o = t as { name?: string; kind?: string };
              if (
                o.kind === "tr_for" ||
                o.kind === "for" ||
                o.kind === "if" ||
                o.kind === "other"
              ) {
                continue;
              }
              if (o.name) extracted.push(o.name);
            }
          }
          tags = [...new Set(extracted)];
        }
      } catch {
        /* оставляем tags как есть */
      }
    }
    const mapping = autoMapTagsToColumns(tags, columns);
    persist({
      wizard: {
        columns,
        rows,
        tags,
        mapping,
        dataFilename: `из ИУЛ (${rows.length})`,
        dataUrl: undefined,
        sheetName: undefined,
        sheetNames: undefined,
        rowFrom: 1,
        rowTo: rows.length,
      },
    });
    const mapped = Object.values(mapping).filter(Boolean).length;
    setOk(
      `Подставлено ${rows.length} строк из ИУЛ · автостыковка ${mapped}/${tags.length || "?"} полей. На шаге 3 можно поправить вручную.`,
    );
    setError(null);
  }

  const dataSourceRows: PreferenceRow[] = useMemo(() => {
    if (!doc) return [];
    const wiz = doc.wizard;
    return [
      {
        icon: FileSpreadsheet,
        title: "Файл Excel / CSV",
        hint: wiz.dataFilename
          ? `Загружен: ${wiz.dataFilename}${wiz.rows.length ? ` · ${wiz.rows.length} строк` : ""}`
          : "Выберите файл с компьютера",
        detail: (
          <div className="flex flex-col gap-3 pb-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">Файл Excel / CSV</span>
              <input
                type="file"
                accept=".xlsx,.xls,.csv,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="field-control file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-zinc-950"
                disabled={busy}
                onChange={(e) => void onDataFile(e.target.files?.[0])}
              />
            </label>
            {wiz.dataFilename ? (
              <p className="text-sm text-ink-muted">
                Загружен файл: {wiz.dataFilename} ({wiz.rows.length} строк)
                {wiz.sheetName ? ` · лист «${wiz.sheetName}»` : ""}
              </p>
            ) : null}
          </div>
        ),
      },
      {
        icon: Cloud,
        title: "Облачная таблица",
        hint: wiz.dataUrl
          ? "Ссылка сохранена — при необходимости нажмите «Подключить»"
          : "Google или Яндекс Таблицы по ссылке",
        detail: (
          <div className="flex w-full flex-col gap-3 pb-2">
            <div className="flex w-full flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">
                Ссылка на таблицу в интернете (Google или Яндекс)
              </span>
              <div
                className={cn(
                  cloudConnecting && "cloud-connect-contour",
                )}
              >
                <div
                  className={cn(
                    "flex w-full flex-col gap-2 sm:flex-row sm:items-center",
                    cloudConnecting && "cloud-connect-contour__inner",
                  )}
                >
                  <input
                    className="field-control min-w-0 flex-1"
                    value={wiz.dataUrl ?? ""}
                    disabled={cloudConnecting}
                    placeholder="https://docs.google.com/spreadsheets/d/…"
                    onChange={(e) => {
                      persist({ wizard: { dataUrl: e.target.value } });
                    }}
                    onPaste={(e) => {
                      // Только вставка текста — подключение только по кнопке.
                      const pasted = e.clipboardData.getData("text")?.trim();
                      if (!pasted || !looksLikeCloudTableUrl(pasted)) return;
                      e.preventDefault();
                      persist({ wizard: { dataUrl: pasted } });
                    }}
                  />
                  <div className="flex shrink-0 items-center gap-2">
                    <Button
                      type="button"
                      disabled={
                        !wiz.dataUrl?.trim() || cloudConnecting
                      }
                      onClick={() => void onConnectCloudUrl()}
                    >
                      {cloudConnecting ? "подключаемся…" : "Подключить"}
                    </Button>
                    <CloudSheetsHelp />
                  </div>
                </div>
              </div>
              <span className="text-pretty text-xs text-ink-muted">
                Вставьте ссылку и нажмите «Подключить» — подключение само по
                уходу из поля не запускается. Лучше ссылка с{" "}
                <code className="text-[11px]">#gid=…</code> нужного листа.
                Ожидаемое время: обычно до 1–3 секунд (повтор — из кэша
                мгновенно), без скачивания всей книги Excel.
              </span>
            </div>
            {wiz.sheetNames && wiz.sheetNames.length > 0 ? (
              <label className="flex flex-col gap-1.5 rounded-xl border border-brand/40 bg-brand/5 p-3">
                <span className="text-sm font-medium text-ink">
                  Листы (страницы) таблицы — можно несколько
                </span>
                <p className="text-xs text-ink-muted">
                  Отметьте страницы: с них соберутся имена колонок и строки
                  данных.
                </p>
                <SheetMultiSelect
                  sheetNames={wiz.sheetNames}
                  selected={
                    wiz.selectedSheetNames?.length
                      ? wiz.selectedSheetNames
                      : wiz.sheetName
                        ? [wiz.sheetName]
                        : [wiz.sheetNames[0]]
                  }
                  disabled={busy || cloudConnecting}
                  onChange={(names) => void onSheetsChange(names)}
                />
              </label>
            ) : null}
            {wiz.dataUrl && wiz.rows.length === 0 ? (
              <StatusMessage
                tone="info"
                message="Ссылка сохранена, но данные ещё не загружены. Нажмите «Подключить»."
              />
            ) : null}
          </div>
        ),
      },
      {
        icon: Files,
        title: "Из выбранных ИУЛ",
        hint:
          selectedIulDocs.length > 0
            ? `Выбрано в дереве: ${selectedIulDocs.length}`
            : "Отметьте ИУЛ слева, затем откройте этот пункт",
        detail: (
          <div className="flex flex-col gap-3 pb-2">
            <p className="text-xs text-ink-muted">
              Выберите файлы ИУЛ в дереве слева. Затем нажмите кнопку ниже —
              строки попадут в стыковку на шаге 3.
            </p>
            {selectedIulDocs.length === 0 ? (
              <p className="text-sm text-ink-soft">
                Пока ничего не выбрано. Откройте папку «ИУЛ» слева.
              </p>
            ) : (
              <div className="overflow-x-auto scrollbar-none scrollbar-none rounded-lg border border-line">
                <table className="w-full min-w-[20rem] border-collapse text-center text-sm text-ink">
                  <thead>
                    <tr className="border-b border-line bg-surface-muted/60 text-xs text-ink-muted">
                      <th className="px-2 py-1.5 text-center font-semibold">
                        Наименование
                      </th>
                      <th className="px-2 py-1.5 text-center font-semibold">
                        Код
                      </th>
                      <th className="px-2 py-1.5 text-center font-semibold">
                        Изменение
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedIulDocs.map((d) => {
                      const iw = d.iulWizard;
                      const name = iw?.docName?.trim() || d.title || "—";
                      const code =
                        iw?.docDesignation?.trim() || iw?.ulCode?.trim() || "—";
                      const izm = (iw?.docVersion ?? "").trim() || "—";
                      return (
                        <tr
                          key={d.id}
                          className="border-b border-line/60 last:border-0"
                        >
                          <td className="max-w-[12rem] px-2 py-1.5 align-middle break-words text-center">
                            {name}
                          </td>
                          <td className="max-w-[14rem] px-2 py-1.5 align-middle break-words text-center font-mono text-xs">
                            {code}
                          </td>
                          <td className="whitespace-nowrap px-2 py-1.5 align-middle text-center">
                            {izm}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
            <Button
              type="button"
              disabled={!selectedIulDocs.length || busy}
              onClick={() => void applyIulsFromTree()}
            >
              Подставить выбранные ИУЛ ({selectedIulDocs.length})
            </Button>
          </div>
        ),
      },
    ];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    doc,
    selectedIulDocs,
    busy,
    cloudConnecting, // иначе контур/«подключаемся…» залипают в stale useMemo
  ]);

  if (!doc) {
    return <p className="text-sm text-ink-muted">Документ не найден.</p>;
  }

  const w = doc.wizard;
  const step = normalizeWaybillStep(w.step);
  const canGenerate = waybillStep4Ready(w);
  const canNext = waybillCanGoNext(w, step);
  const generateBtnClass = cn(
    canGenerate
      ? "!bg-brand !text-zinc-950 hover:!bg-brand-hover hover:shadow-glow disabled:!bg-brand/50"
      : "!border !border-zinc-600 !bg-zinc-950 !text-zinc-500 hover:!bg-zinc-950 hover:shadow-none disabled:!bg-zinc-950 disabled:!opacity-100",
  );

  const generateButtons = (
    <>
      <Button
        variant="secondary"
        loading={busy}
        disabled={!canGenerate}
        className={generateBtnClass}
        onClick={() => void runGenerate("docx")}
        title="Собрать накладную в Word"
      >
        Сформировать DOCX
      </Button>
      <Button
        variant="secondary"
        loading={busy}
        disabled={!canGenerate}
        className={generateBtnClass}
        onClick={() => void runGenerate("pdf")}
        title="Собрать накладную в PDF"
      >
        Сформировать PDF
      </Button>
    </>
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <StatusMessage message={error} tone="error" />
      <StatusMessage message={ok} tone="ok" />

      <div className="flex min-h-0 flex-1 flex-col items-stretch gap-4 lg:flex-row">
      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4">
        {/* C-212: SlideTabs + generate above GlassCard */}
        <div
          data-slide-tabs-fit
          className="flex w-full min-w-0 shrink-0 flex-col gap-3"
        >
          {stepsVertical ? (
            <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
              <WaybillTemplateHelp />
              {generateButtons}
            </div>
          ) : null}

          <div
            className={`flex gap-4 ${stepsVertical ? "flex-row items-start" : "flex-col"}`}
          >
            <div
              className={`min-w-0 ${stepsVertical ? "w-[9.5rem] shrink-0 sm:w-44" : "w-full"}`}
            >
              <div
                className={
                  stepsVertical
                    ? undefined
                    : "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                }
              >
                <SlideTabs
                  tabs={STEPS.map((s) => ({
                    id: s.id,
                    label: s.label,
                    subdued: !waybillStepUnlocked(w, s.n),
                  }))}
                  selected={Math.max(0, Math.min(STEPS.length - 1, step - 1))}
                  onSelect={(i) => setStep(STEPS[i].n)}
                  aria-label="Шаги мастера накладной"
                  layout="auto"
                  onOrientationChange={setStepsVertical}
                  className={stepsVertical ? "w-full" : "min-w-0 flex-1"}
                />
                {!stepsVertical ? (
                  <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 self-end sm:self-auto">
                    <WaybillTemplateHelp />
                    {generateButtons}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>

      <GlassCard className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto p-4 pt-6 sm:p-5 sm:pt-7">
        <div className="flex flex-col gap-1 rounded-xl border border-line bg-surface-muted/40 px-3 py-2 text-sm text-ink-soft sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
          <p>
            <span className="font-semibold text-ink">Шаблон: </span>
            {w.templateName ? (
              <span className="text-ink">{w.templateName}</span>
            ) : (
              <span className="text-ink-muted">ещё не загружен</span>
            )}
          </p>
          <p>
            <span className="font-semibold text-ink">Данные: </span>
            {w.dataFilename ? (
              <span className="text-ink">
                {w.dataFilename}
                {w.sheetName ? ` · «${w.sheetName}»` : ""}
                {w.rows.length ? ` · ${w.rows.length} стр.` : ""}
              </span>
            ) : (
              <span className="text-ink-muted">ещё не загружены</span>
            )}
          </p>
        </div>

        <DocsStepMotion
          stepKey={step}
          scopeKey={docId}
          className="scrollbar-brand flex min-h-0 flex-1 flex-col overflow-y-auto"
        >
        {step === 1 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-ink">
              Шаг 1. Шаблон Word
            </h2>
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-medium text-ink">
                Файл шаблона (.docx)
              </span>
              <input
                type="file"
                accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                className="field-control file:mr-3 file:rounded-lg file:border-0 file:bg-brand file:px-3 file:py-1.5 file:text-sm file:font-semibold file:text-zinc-950"
                disabled={busy}
                onChange={(e) => void onTemplateFile(e.target.files?.[0])}
              />
            </label>
            {w.templateName ? (
              <StatusMessage
                tone="ok"
                message={`Шаблон сохранён: «${w.templateName}». Справа — живой предпросмотр. Чтобы заменить — выберите другой .docx.`}
              />
            ) : null}
            {w.tags.length > 0 ? (
              <p className="text-sm text-ink-muted">
                Найденные поля: {w.tags.join(", ")}
              </p>
            ) : w.templateName ? (
              <p className="text-sm text-ink-muted">
                Полей вида {"{{…}}"} пока не видно. Если в шаблоне только таблица
                с циклом — это нормально; обычные поля шапки добавьте метками.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-ink">
              Шаг 2. Данные
            </h2>
            <p className="text-pretty text-sm text-ink-soft">
              Выберите один способ загрузки данных: файл с компьютера, таблица
              по ссылке из интернета или список выбранных
              информационно-удостоверяющих листов слева. Откройте нужный пункт —
              появятся поля только для него.
            </p>
            <div className="rounded-xl border border-line bg-surface-card/40 p-2 sm:p-3">
              <PreferencesCard
                key={w.dataUrl?.trim() ? "cloud-open" : "data-sources"}
                rows={dataSourceRows}
                className="w-full"
                defaultActiveTitle={
                  w.dataUrl?.trim() ? "Облачная таблица" : null
                }
              />
            </div>
            {!waybillStep2Complete(w) ? (
              <p className="text-xs text-ink-muted">
                Чтобы продолжить: загрузите Excel/CSV, подключите облачную
                таблицу или подставьте выбранные ИУЛ.
              </p>
            ) : null}
            {w.rows.length > 0 && w.columns.length > 0 ? (
              <StatusMessage
                tone="ok"
                message={`Готово к стыковке: ${w.columns.length} колонок, ${w.rows.length} строк${w.sheetName ? ` (лист «${w.sheetName}»)` : ""}${w.dataFilename?.startsWith("из ИУЛ") ? " · источник: ИУЛ" : ""}.`}
              />
            ) : null}
          </div>
        ) : null}

        {step === 3 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-ink">
              Шаг 3. Стыковка полей
            </h2>
            <p className="text-pretty text-sm text-ink-soft">
              Для каждого поля из шаблона накладной выберите колонку данных
              (таблица Excel/облако или поля выбранных ИУЛ). Ниже можно
              ограничить строки.
            </p>
            {w.dataFilename?.startsWith("из ИУЛ") ? (
              <StatusMessage
                tone="info"
                message={`Источник строк: ${w.dataFilename}. Колонки: обозначение, наименование, объект, шифр_ул и др.`}
              />
            ) : null}
            {w.rows.length > 0 ? (
              <RowRangePicker
                wizard={w}
                onChange={(patch) =>
                  persist({
                    wizard: { ...patch, rowRangeConfirmed: true },
                  })
                }
              />
            ) : null}
            {w.columns.length > 0 ? (
              <StatusMessage
                tone="ok"
                message={`Таблица подключена${w.sheetName ? ` (лист «${w.sheetName}»)` : ""}: колонки «${w.columns.slice(0, 8).join("», «")}${w.columns.length > 8 ? "»…" : "»"} · ${w.rows.length} строк.`}
              />
            ) : (
              <StatusMessage
                tone="info"
                message="Шаг 3 пока не видит таблицу. Вернитесь на шаг 2: вставьте ссылку Google и нажмите «Подключить» (или загрузите Excel)."
              />
            )}
            {!w.templateName ? (
              <StatusMessage
                tone="info"
                message="Сначала загрузите шаблон Word на шаге 1 — он сохранится и останется виден здесь. После этого появятся выпадающие списки стыковки с колонками таблицы выше."
              />
            ) : w.tags.length === 0 ? (
              <StatusMessage
                tone="info"
                message={`Шаблон «${w.templateName}» на месте, но обычных полей для стыковки нет. Если нужна только таблица с циклом — колонки файла всё равно можно использовать при генерации. Или вернитесь на шаг 1 и добавьте метки {{…}} в шапку.`}
              />
            ) : w.columns.length === 0 ? (
              <StatusMessage
                tone="info"
                message="Нет колонок: на шаге 2 вставьте ссылку и нажмите «Подключить» или загрузите Excel/CSV и выберите лист."
              />
            ) : (
              <div className="overflow-x-auto scrollbar-none">
                <table className="w-full min-w-[20rem] text-left text-sm">
                  <thead>
                    <tr className="border-b border-line text-ink-muted">
                      <th className="py-2 pr-3 font-medium">Поле шаблона</th>
                      <th className="py-2 font-medium">Колонка таблицы</th>
                    </tr>
                  </thead>
                  <tbody>
                    {w.tags.map((tag) => (
                      <tr key={tag} className="border-b border-line/60">
                        <td className="py-2.5 pr-3 font-medium text-ink">
                          {`{{${tag}}}`}
                        </td>
                        <td className="py-2.5">
                          <FieldSelect
                            value={w.mapping[tag] ?? ""}
                            aria-label={`Колонка для {{${tag}}}`}
                            options={[
                              { value: "", label: "— не выбрано —" },
                              {
                                value: "__seq__",
                                label: "№ п/п (авто: 1, 2, 3…)",
                              },
                              ...w.columns.map((col) => ({
                                value: col,
                                label: col,
                              })),
                            ]}
                            onChange={(value) => setMapping(tag, value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        ) : null}

        {normalizeWaybillStep(step) === 4 ? (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold text-ink">
              Шаг 4. Реестр результатов{" "}
              <span className="text-sm font-normal text-ink-muted">
                (необязательно)
              </span>
            </h2>
            <StatusMessage
              tone="info"
              message="Необязательный шаг: куда записать номер/дату/ссылку после скачивания. На формирование DOCX/PDF не влияет — кнопки «Сформировать» сверху."
            />
            <p className="text-pretty text-sm text-ink-soft">
              Вставьте ссылку на таблицу-реестр и нажмите «Подключить» — как на
              шаге 2. Слева поля уже из вашей накладной; справа выберите колонки
              реестра.
            </p>
            <div
              className={cn(
                "flex flex-col gap-2 rounded-xl border border-line p-3 sm:flex-row sm:items-end",
                registryConnecting && "cloud-connect-contour",
              )}
            >
              <div
                className={cn(
                  "min-w-0 flex-1",
                  registryConnecting && "cloud-connect-contour__inner",
                )}
              >
                <Field
                  label="Ссылка на реестр"
                  value={w.registryUrl ?? ""}
                  onChange={(e) =>
                    persist({ wizard: { registryUrl: e.target.value } })
                  }
                  placeholder="https://docs.google.com/spreadsheets/…"
                  disabled={registryConnecting}
                />
              </div>
              <Button
                type="button"
                disabled={!w.registryUrl?.trim() || registryConnecting}
                onClick={() => void onConnectRegistryUrl()}
              >
                {registryConnecting ? "подключаемся…" : "Подключить"}
              </Button>
            </div>
            {registryColumns.length > 0 ? (
              <StatusMessage
                tone="ok"
                message={`Реестр подключён: ${registryColumns.length} колонок. Сопоставьте поля ниже.`}
              />
            ) : null}
            <div>
              <span className="text-sm font-medium text-ink">
                Соответствие полей (из накладной → колонка реестра)
              </span>
              <WaybillRegistryFieldList
                className="mt-2"
                rows={registryRows}
                onChange={setRegistryRows}
                columnOptions={registryColumns}
                lockFields
              />
            </div>
            {w.lastGenerateNote ? (
              <p className="text-sm text-ink-muted">{w.lastGenerateNote}</p>
            ) : null}
          </div>
        ) : null}
        </DocsStepMotion>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-line pt-4">
          <Button
            type="button"
            variant="ghost"
            disabled={step <= 1}
            onClick={() => setStep(Math.max(1, step - 1))}
          >
            Назад
          </Button>
          <div className="flex flex-wrap items-center justify-end gap-2">
            {step === 4 ? (
              <Button
                type="button"
                variant="secondary"
                className="!h-8 !px-2.5 !text-xs"
                onClick={saveRegistry}
              >
                Сохранить настройки реестра
              </Button>
            ) : null}
            <Button
              type="button"
              disabled={step < 4 ? !canNext || busy : busy}
              className={cn(
                step < 4 &&
                  !canNext &&
                  "!bg-brand-muted !text-ink hover:!bg-brand-muted disabled:!opacity-100",
              )}
              onClick={() => {
                if (step === 4) {
                  saveRegistry();
                  return;
                }
                setStep(Math.min(4, step + 1));
              }}
            >
              {step === 4
                ? "Записать данные в реестр"
                : step === 3
                  ? "К реестру (необязательно)"
                  : "Далее"}
            </Button>
          </div>
        </div>
      </GlassCard>
      </div>
      <ResizablePreviewShell
        storageKeyPrefix="waybill"
      >
        <WaybillLivePreview
          wizard={w}
          docId={docId}
          className="h-auto"
        />
      </ResizablePreviewShell>
      </div>
    </div>
  );
}
