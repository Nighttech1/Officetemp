"use client";

import type { InfoSheetWizardState } from "@/lib/docs-store";
import {
  formatFileModifiedDisplay,
  formatIulDisplayDate,
  iulVersionCell,
} from "@/lib/iul-hash";
import { cn } from "@/lib/utils";

type Props = {
  wizard: InfoSheetWizardState;
  title?: string;
  className?: string;
};

/** Ячейка факсимиле — Times New Roman 10pt как в Word. */
const cell =
  "border border-zinc-300 px-1 py-1 text-center align-middle font-normal";
const th =
  "border border-zinc-300 bg-zinc-50 px-1 py-1 text-center font-bold";

function footerStampLabel(w: InfoSheetWizardState): string {
  const ver = iulVersionCell(w.docVersion);
  const verBit = ver !== "-" ? ` Изм.${ver}` : "";
  const des = (w.docDesignation || "")
    .replace(/\s*\(?\s*Изм\.?\s*\d+\s*\)?/gi, "")
    .trim();
  const name = (w.docName || "").trim();
  const parts = [des, name].filter(Boolean).join(" ");
  if (parts) return `${parts}${verBit}_УЛ`;
  return w.ulCode || "—_УЛ";
}

/**
 * Живой макет ИУЛ — пропорции/шрифт как в `ИУЛ template.docx`
 * (Times New Roman 10pt, bold только у заголовков).
 */
export function InfoSheetLivePreview({ wizard, title, className }: Props) {
  const w = wizard;
  const algo = (w.hashAlgo || "MD5").toUpperCase();

  return (
    <aside
      className={cn(
        "flex h-auto flex-col gap-3 rounded-2xl border border-line bg-surface-card p-3 shadow-sm sm:p-4",
        className,
      )}
      aria-label="Предпросмотр ИУЛ"
    >
      <div className="flex shrink-0 items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
            Предпросмотр
          </p>
          <p className="text-sm font-semibold text-ink">
            {title || "Информационно-удостоверяющий лист"}
          </p>
        </div>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-sm font-medium text-ink-muted">
          Шаг {w.step}/3
        </span>
      </div>

      <div className="iul-sheet-preview h-auto overflow-visible rounded-lg border border-line bg-white text-zinc-900">
        <table className="w-full border-collapse table-fixed">
          <colgroup>
            {/* C-205: доли как в ИУЛ template.docx table0 (17.69/52.51/85.3/30.5) */}
            <col style={{ width: "9.5%" }} />
            <col style={{ width: "28.2%" }} />
            <col style={{ width: "45.9%" }} />
            <col style={{ width: "16.4%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td
                colSpan={2}
                className={cn(cell, "bg-zinc-50")}
                style={{ height: "2.6rem" }}
              >
                Наименование объекта
              </td>
              <td colSpan={2} className={cell} style={{ height: "2.6rem" }}>
                {w.objectName || "-"}
              </td>
            </tr>
            <tr>
              <th className={th}>№ п/п</th>
              <th className={th}>Обозначение документа</th>
              <th className={th}>Наименование документа</th>
              <th className={th}>Номер последнего изменения (версии)</th>
            </tr>
            <tr>
              <td className={cell}>1</td>
              <td className={cell}>{w.docDesignation || "-"}</td>
              <td className={cell}>{w.docName || "-"}</td>
              <td className={cell}>{iulVersionCell(w.docVersion)}</td>
            </tr>
            <tr>
              <td
                className={cn(
                  cell,
                  "bg-zinc-50 font-bold break-words leading-tight",
                )}
              >
                {algo}
              </td>
              <td colSpan={2} className={cn(cell, "break-all font-mono")}>
                {w.fileHash || "-"}
              </td>
              <td className={cell}> </td>
            </tr>
            <tr>
              <th colSpan={2} className={th}>
                Наименование файла
              </th>
              <th className={th}>
                Дата и время последнего изменения файла
              </th>
              <th className={th}>Размер, байт</th>
            </tr>
            <tr>
              <td colSpan={2} className={cn(cell, "break-all")}>
                {w.sourceFileName || "-"}
              </td>
              <td className={cell}>
                {formatFileModifiedDisplay(w.fileModifiedAt) || "-"}
              </td>
              <td className={cell}>
                {w.fileSizeBytes != null ? w.fileSizeBytes : "-"}
              </td>
            </tr>
          </tbody>
        </table>

        <table className="mt-1 w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "22%" }} />
            <col style={{ width: "30%" }} />
            <col style={{ width: "22%" }} />
          </colgroup>
          <thead>
            <tr>
              <th className={th}>Характер работы</th>
              <th className={th}>Фамилия</th>
              <th className={th}>Подпись</th>
              <th className={th}>Дата подписания</th>
            </tr>
          </thead>
          <tbody>
            {(w.signatures.length
              ? w.signatures
              : [{ role: "", surname: "", signedAt: "", note: "" }]
            ).map((s, i) => (
              <tr key={i} style={{ height: "2.8rem" }}>
                <td className={cell}>{s.role || "-"}</td>
                <td className={cell}>{s.surname || "-"}</td>
                <td className={cell}>
                  {s.signatureImageDataUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={s.signatureImageDataUrl}
                      alt=""
                      className="mx-auto max-h-9 w-auto max-w-[5.5rem] object-contain"
                    />
                  ) : (
                    s.note || "-"
                  )}
                </td>
                <td className={cell}>
                  {formatIulDisplayDate(s.signedAt) || "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <table className="mt-1 w-full border-collapse table-fixed">
          <colgroup>
            <col style={{ width: "26%" }} />
            <col style={{ width: "52%" }} />
            <col style={{ width: "11%" }} />
            <col style={{ width: "11%" }} />
          </colgroup>
          <tbody>
            <tr>
              <td rowSpan={2} className={cell}>
                Информационно-удостоверяющий лист
              </td>
              <td rowSpan={2} className={cn(cell, "break-words")}>
                {footerStampLabel(w)}
              </td>
              <td className={cell}>Лист</td>
              <td className={cell}>Листов</td>
            </tr>
            <tr>
              <td className={cell}>{w.sheetNo || "1"}</td>
              <td className={cell}>{w.sheetsTotal || "1"}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </aside>
  );
}
