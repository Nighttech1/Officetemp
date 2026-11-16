"use client";

import { HelpHoverPopover } from "@/components/docs/HelpHoverPopover";
import { IUL_WAYBILL_COLUMNS } from "@/lib/iul-to-waybill";

type Props = {
  className?: string;
};

/**
 * Общая кнопка «?» мастера накладной (на всех шагах).
 */
export function WaybillTemplateHelp({ className }: Props) {
  return (
    <HelpHoverPopover
      className={className}
      trigger="?"
      ariaLabel="Как подготовить шаблон Word"
      title="Как подготовить шаблон Word"
      panelClassName="sm:left-auto sm:right-0"
    >
      <p>
        В обычных полях (номер, дата, заказчик…) поставьте метки в двойных
        фигурных скобках, например{" "}
        <code className="rounded bg-surface-muted px-1">{"{{номер}}"}</code> или{" "}
        <code className="rounded bg-surface-muted px-1">{"{{дата}}"}</code>.
      </p>
      <p className="font-semibold text-ink">Таблица в накладной</p>
      <ol className="list-decimal space-y-1 pl-4">
        <li>
          Сделайте в Word шапку таблицы и <strong className="text-ink">одну</strong>{" "}
          строку под ней.
        </li>
        <li>
          В этой одной строке в ячейках напишите метки, например{" "}
          <code className="rounded bg-surface-muted px-1">{"{{code}}"}</code>,{" "}
          <code className="rounded bg-surface-muted px-1">
            {"{{section_name}}"}
          </code>
          .
        </li>
        <li>
          Не рисуйте десятки пустых строк — программа сама добавит столько
          строк, сколько придёт из Excel, Google, Яндекса или из выбранных
          информационно-удостоверяющих листов.
        </li>
      </ol>
      <p className="font-semibold text-ink">Данные из ИУЛ / других документов</p>
      <p>
        Чтобы подставить данные из ИУЛ (или тех же полей из таблицы), названия
        полей/столбцов в шаблоне накладной должны совпадать с исходными именами.
        Для ИУЛ используйте, например:{" "}
        {IUL_WAYBILL_COLUMNS.map((c, i) => (
          <span key={c}>
            {i > 0 ? ", " : null}
            <code className="rounded bg-surface-muted px-1">{`{{${c}}}`}</code>
          </span>
        ))}
        .
      </p>
      <p className="font-semibold text-ink">Столбец «№ п/п» (нумерация)</p>
      <p>
        Поставьте метку{" "}
        <code className="rounded bg-surface-muted px-1">{"{{n}}"}</code> и на
        шаге стыковки выберите «№ п/п (авто: 1, 2, 3…)».
      </p>
      <p className="font-semibold text-ink">Имена меток</p>
      <p>
        Лучше без пробелов:{" "}
        <code className="rounded bg-surface-muted px-1">
          {"{{section_name}}"}
        </code>
        . Если напишете{" "}
        <code className="rounded bg-surface-muted px-1">
          {"{{section name}}"}
        </code>
        , программа заменит пробел на подчёркивание при сборке.
      </p>
    </HelpHoverPopover>
  );
}
