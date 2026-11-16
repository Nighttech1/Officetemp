"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type MouseEvent as ReactMouseEvent,
  type ReactNode,
} from "react";
import {
  FilePlus,
  FolderPlus,
  FolderX,
  FileX,
  Search,
} from "lucide-react";
import {
  createDocument,
  createFolder,
  createProject,
  deleteDocuments,
  deleteFolder,
  deleteProject,
  getDocument,
  getFolder,
  listDocuments,
  listDocumentsInFolder,
  listFolders,
  listProjects,
  moveDocument,
  renameFolder,
  renameProject,
  searchDocuments,
  updateDocument,
  type DocItem,
  type DocKind,
} from "@/lib/docs-store";
import { TreeView, type TreeNode } from "@/components/ui/tree-view";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
  MultiButton,
  type MultiButtonItem,
} from "@/components/ui/multi-button";

type Props = {
  kind: DocKind;
  selectedProjectId: string | null;
  selectedFolderId: string | null;
  selectedDocId: string | null;
  signaturesOpen: boolean;
  onSelectProject: (id: string | null) => void;
  onSelectFolder: (id: string | null) => void;
  onSelectDoc: (id: string | null) => void;
  /** @deprecated библиотека открывается кнопкой на странице */
  onSelectSignatures?: (projectId: string) => void;
  refreshKey?: number;
  onLibraryChange?: () => void;
  /** Пакетное создание ИУЛ из нескольких PDF */
  onBatchCreateRequest?: (payload: {
    projectId: string;
    folderId: string | null;
    files: File[];
  }) => void;
  /** Мультивыбор документов (для «Сформировать накладную») */
  onMultiDocChange?: (ids: string[]) => void;
};

type ConfirmState =
  | { kind: "folder"; id: string; name: string }
  | { kind: "docs"; ids: string[]; titles: string[] }
  | { kind: "project"; id: string; name: string }
  | null;

type EditState =
  | { type: "fld"; id: string; value: string }
  | { type: "doc"; id: string; value: string }
  | { type: "prj"; id: string; value: string }
  | null;

/** DFS-порядок документов в проекте. */
function flattenVisibleDocs(projectId: string, query: string): string[] {
  const out: string[] = [];
  function walk(parentId: string | null) {
    const folders = listFolders(projectId).filter(
      (f) => (f.parentId ?? null) === parentId && f.systemKey !== "signatures",
    );
    for (const f of folders) walk(f.id);
    const docs = query.trim()
      ? searchDocuments(projectId, query).filter(
          (d) => (d.folderId ?? null) === parentId,
        )
      : listDocumentsInFolder(projectId, parentId);
    for (const d of docs) out.push(d.id);
  }
  walk(null);
  return out;
}

function rangeSelect(ordered: string[], fromId: string, toId: string): string[] {
  const a = ordered.indexOf(fromId);
  const b = ordered.indexOf(toId);
  if (a < 0 || b < 0) return [toId];
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  return ordered.slice(lo, hi + 1);
}

function IconBatchDocs({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden>
      <rect x="3" y="5" width="9" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" />
      <rect x="8" y="3" width="9" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" fill="rgba(0,0,0,0.15)" />
      <rect x="12" y="7" width="9" height="12" rx="1.2" stroke="currentColor" strokeWidth="1.5" fill="rgba(0,0,0,0.25)" />
      <circle cx="19.5" cy="5.5" r="3.2" fill="#2fc6f6" />
      <path d="M19.5 4v3M18 5.5h3" stroke="#0b1a22" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

export function ProjectSidebar({
  kind,
  selectedProjectId,
  selectedFolderId,
  selectedDocId,
  signaturesOpen,
  onSelectProject,
  onSelectFolder,
  onSelectDoc,
  refreshKey = 0,
  onLibraryChange,
  onBatchCreateRequest,
  onMultiDocChange,
}: Props) {
  const [tick, setTick] = useState(0);
  const [query, setQuery] = useState("");
  const [newName, setNewName] = useState("");
  const [showNew, setShowNew] = useState(false);
  // C-223: общее дерево ИУЛ/Накладные — expand общий, не сбрасывать при смене раздела
  const [expanded, setExpandedState] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const batchInputRef = useRef<HTMLInputElement>(null);
  const [multiDocIds, setMultiDocIds] = useState<string[]>([]);
  const [multiFolderIds, setMultiFolderIds] = useState<string[]>([]);
  const anchorDocIdRef = useRef<string | null>(null);
  const [confirm, setConfirm] = useState<ConfirmState>(null);
  const [editing, setEditing] = useState<EditState>(null);

  const TREE_EXPANDED_KEY = "docsaas_tree_expanded_v1";

  const setExpanded = useCallback(
    (next: string[] | ((prev: string[]) => string[])) => {
      setExpandedState((prev) => {
        const value = typeof next === "function" ? next(prev) : next;
        try {
          sessionStorage.setItem(TREE_EXPANDED_KEY, JSON.stringify(value));
        } catch {
          /* ignore */
        }
        return value;
      });
    },
    [],
  );

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(TREE_EXPANDED_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as unknown;
        if (Array.isArray(parsed)) {
          setExpandedState(
            parsed.filter((x): x is string => typeof x === "string"),
          );
        }
      }
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    setTick((t) => t + 1);
  }, [refreshKey]);

  const onMultiRef = useRef(onMultiDocChange);
  onMultiRef.current = onMultiDocChange;
  useEffect(() => {
    onMultiRef.current?.(multiDocIds);
  }, [multiDocIds]);

  const projects = useMemo(
    () => (hydrated ? listProjects(kind) : []),
    [kind, tick, hydrated],
  );

  // expanded: controlled TreeView (toggle только внутри TreeView)
  const [sidebarWidth, setSidebarWidth] = useState(296);
  const dragRef = useRef<{ startX: number; startW: number } | null>(null);
  const widthRef = useRef(296);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem("docsaas_sidebar_w");
      const n = raw ? Number(raw) : NaN;
      if (Number.isFinite(n) && n >= 220 && n <= 520) {
        setSidebarWidth(n);
        widthRef.current = n;
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!dragRef.current) return;
      const dx = e.clientX - dragRef.current.startX;
      const next = Math.min(520, Math.max(220, dragRef.current.startW + dx));
      widthRef.current = next;
      setSidebarWidth(next);
    }
    function onUp() {
      if (!dragRef.current) return;
      dragRef.current = null;
      try {
        localStorage.setItem("docsaas_sidebar_w", String(widthRef.current));
      } catch {
        /* ignore */
      }
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  function bump() {
    setTick((t) => t + 1);
  }

  function setMulti(ids: string[]) {
    setMultiDocIds(ids);
    onMultiDocChange?.(ids);
  }

  function handleCreateProject() {
    const name = newName.trim() || "Новый проект";
    const p = createProject(kind, name);
    setNewName("");
    setShowNew(false);
    bump();
    setExpanded((prev) =>
      prev.includes(`prj:${p.id}`) ? prev : [...prev, `prj:${p.id}`],
    );
    onSelectProject(p.id);
    onSelectFolder(null);
    onSelectDoc(null);
  }

  function targetFolderForCreate(): string | null {
    if (!selectedProjectId) return null;
    if (signaturesOpen) return null;
    if (selectedFolderId) {
      const f = listFolders(selectedProjectId).find(
        (x) => x.id === selectedFolderId,
      );
      if (f?.systemKey === "signatures") return null;
      return selectedFolderId;
    }
    // По умолчанию — корень проекта (системные ИУЛ/Накладные сняты, C-222)
    return null;
  }

  function handleAddFolder() {
    if (!selectedProjectId) {
      window.alert("Сначала выберите проект");
      return;
    }
    const parentId = targetFolderForCreate();
    try {
      const f = createFolder(selectedProjectId, "папка", parentId);
      bump();
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(`prj:${selectedProjectId}`);
        if (parentId) next.add(`fld:${parentId}`);
        next.add(`fld:${f.id}`);
        return [...next];
      });
      // C-133: не переключать выделение на новую папку — иначе следующий
      // «+» создаст внутри неё, а не в выбранной ранее.
      if (parentId) {
        onSelectFolder(parentId);
      }
      onSelectDoc(null);
      onLibraryChange?.();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Не удалось создать папку");
    }
  }

  function handleAddDoc() {
    if (!selectedProjectId) {
      window.alert("Сначала выберите проект");
      return;
    }
    try {
      const doc = createDocument(
        selectedProjectId,
        kind,
        kind === "info_sheet" ? "Новый ИУЛ" : "Новый документ",
        targetFolderForCreate(),
      );
      bump();
      setExpanded((prev) => {
        const next = new Set(prev);
        next.add(`prj:${selectedProjectId}`);
        if (doc.folderId) next.add(`fld:${doc.folderId}`);
        return [...next];
      });
      onSelectProject(selectedProjectId);
      onSelectFolder(doc.folderId);
      onSelectDoc(doc.id);
      setMulti([doc.id]);
    } catch (e) {
      window.alert(
        e instanceof Error ? e.message : "Не удалось создать документ",
      );
    }
  }

  function handleDeleteFolder() {
    const folderId =
      selectedFolderId ||
      multiFolderIds[0] ||
      (selectedDocId ? getDocument(selectedDocId)?.folderId : null) ||
      null;
    if (!folderId) {
      window.alert("Выберите папку для удаления");
      return;
    }
    const f = listFolders(selectedProjectId ?? "").find((x) => x.id === folderId);
    if (!f) return;
    if (f.systemKey) {
      window.alert("Системную папку удалить нельзя");
      return;
    }
    setConfirm({ kind: "folder", id: f.id, name: f.name });
  }

  function handleDeleteDoc() {
    const ids =
      multiDocIds.length > 0
        ? multiDocIds
        : selectedDocId
          ? [selectedDocId]
          : [];
    if (!ids.length) {
      window.alert("Выберите файл для удаления");
      return;
    }
    const titles = ids.map((id) => getDocument(id)?.title ?? "документ");
    setConfirm({ kind: "docs", ids, titles });
  }

  function applyConfirm() {
    if (!confirm) return;
    if (confirm.kind === "folder") {
      deleteFolder(confirm.id);
      bump();
      onSelectFolder(null);
      onSelectDoc(null);
      setMulti([]);
    } else if (confirm.kind === "docs") {
      deleteDocuments(confirm.ids);
      bump();
      onSelectDoc(null);
      setMulti([]);
      anchorDocIdRef.current = null;
    } else if (confirm.kind === "project") {
      deleteProject(confirm.id);
      bump();
      if (selectedProjectId === confirm.id) {
        onSelectProject(null);
        onSelectFolder(null);
        onSelectDoc(null);
      }
      setMulti([]);
    }
    setConfirm(null);
  }

  function commitEdit() {
    if (!editing) return;
    const next = editing.value.trim();
    try {
      if (!next) {
        setEditing(null);
        return;
      }
      if (editing.type === "fld") {
        renameFolder(editing.id, next);
      } else if (editing.type === "doc") {
        updateDocument(editing.id, { title: next.slice(0, 200) });
      } else if (editing.type === "prj") {
        renameProject(editing.id, next);
      }
      bump();
    } catch (e) {
      window.alert(e instanceof Error ? e.message : "Не удалось переименовать");
    }
    setEditing(null);
  }

  function renderInlineName(
    label: string,
    edit: EditState,
    match: NonNullable<EditState>,
  ): ReactNode {
    if (edit && edit.type === match.type && edit.id === match.id) {
      return (
        <input
          className="w-full min-w-0 rounded border border-[#2fc6f6]/50 bg-black/40 px-1 py-0.5 text-xs text-white outline-none"
          value={edit.value}
          autoFocus
          onClick={(e) => e.stopPropagation()}
          onDoubleClick={(e) => e.stopPropagation()}
          onChange={(e) =>
            setEditing({ ...edit, value: e.target.value } as EditState)
          }
          onBlur={() => commitEdit()}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              commitEdit();
            }
            if (e.key === "Escape") {
              e.preventDefault();
              setEditing(null);
            }
          }}
        />
      );
    }
    return label;
  }

  function handleBatchClick() {
    if (!selectedProjectId) {
      window.alert("Сначала выберите проект");
      return;
    }
    batchInputRef.current?.click();
  }

  function onBatchFilesChosen(files: FileList | null) {
    if (!files?.length || !selectedProjectId || !onBatchCreateRequest) return;
    const pdfs = Array.from(files).filter((f) =>
      f.name.toLowerCase().endsWith(".pdf"),
    );
    if (!pdfs.length) {
      window.alert("Нужны файлы PDF");
      return;
    }
    onBatchCreateRequest({
      projectId: selectedProjectId,
      folderId: targetFolderForCreate(),
      files: pdfs,
    });
    if (batchInputRef.current) batchInputRef.current.value = "";
  }

  function buildFolderBranch(
    projectId: string,
    parentId: string | null,
  ): TreeNode[] {
    const q = query.trim().toLowerCase();
    const folders = listFolders(projectId).filter(
      (f) =>
        (f.parentId ?? null) === parentId && f.systemKey !== "signatures",
    );
    const knownFolderIds = new Set(listFolders(projectId).map((f) => f.id));

    const softNameMatch = (name: string) => {
      if (!q) return true;
      const n = name.toLowerCase();
      if (n.includes(q) || q.includes(n)) return true;
      const stem = (s: string) => s.replace(/(ые|ая|ие|ый|ой|ое)$/i, "");
      return stem(n).includes(stem(q)) || stem(q).includes(stem(n));
    };

    // В разделе ИУЛ не прячем Накладные; Подписи оставляем внизу (sort уже)
    const docs = (() => {
      const base = q
        ? searchDocuments(projectId, query)
        : listDocuments(projectId);
      return base.filter((d) => {
        if ((d.folderId ?? null) === parentId) return true;
        // Сироты (folderId на несуществующую папку) — под системной папкой по виду
        const orphan = !!d.folderId && !knownFolderIds.has(d.folderId);
        if (!orphan || !parentId) return false;
        const parentFolder = listFolders(projectId).find((f) => f.id === parentId);
        if (!parentFolder?.systemKey) return false;
        if (parentFolder.systemKey === "waybills" && d.kind === "waybill")
          return true;
        if (parentFolder.systemKey === "iul" && d.kind === "info_sheet")
          return true;
        return false;
      });
    })();

    const folderNodes: TreeNode[] = [];
    for (const f of folders) {
      const children = buildFolderBranch(projectId, f.id);
      const nameMatch = softNameMatch(f.name);
      // При поиске — только папки с совпадением имени или с совпавшими потомками
      if (q && !nameMatch && children.length === 0) continue;
      folderNodes.push({
        id: `fld:${f.id}`,
        label: renderInlineName(f.name, editing, {
          type: "fld",
          id: f.id,
          value: f.name,
        }),
        // Иконки open/closed рисует TreeView — иначе смена icon на каждый expand дергает анимацию
        data: { type: "folder", folderId: f.id, projectId, systemKey: f.systemKey },
        children,
      });
    }

    const docNodes: TreeNode[] = docs.map((d) => {
      // ИУЛ в дереве — только шифр (обозначение), без длинного наименования раздела
      const treeLabel =
        d.kind === "info_sheet"
          ? (
              d.iulWizard?.docDesignation?.trim() ||
              d.iulWizard?.ulCode?.trim() ||
              d.title ||
              "ИУЛ"
            ).slice(0, 200)
          : d.title;
      return {
        id: `doc:${d.id}`,
        label: renderInlineName(treeLabel, editing, {
          type: "doc",
          id: d.id,
          value: treeLabel,
        }),
        data: {
          type: "doc",
          docId: d.id,
          projectId: d.projectId,
          folderId: d.folderId,
          kind: d.kind,
        },
      };
    });

    return [...folderNodes, ...docNodes];
  }

  const treeData: TreeNode[] = useMemo(() => {
    void tick;
    void editing;
    void query;
    const q = query.trim().toLowerCase();
    return projects
      .map((p) => {
        const children = buildFolderBranch(p.id, null);
        if (q && !p.name.toLowerCase().includes(q) && children.length === 0) {
          return null;
        }
        return {
          id: `prj:${p.id}`,
          label: renderInlineName(p.name, editing, {
            type: "prj",
            id: p.id,
            value: p.name,
          }),
          data: { type: "project", projectId: p.id },
          children,
        };
      })
      .filter((n): n is NonNullable<typeof n> => n != null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projects, tick, editing, query]);

  // При поиске — раскрыть все видимые ветки, чтобы совпадения не прятались
  useEffect(() => {
    if (!query.trim()) return;
    const ids: string[] = [];
    function walk(nodes: TreeNode[]) {
      for (const n of nodes) {
        if (n.children?.length) {
          ids.push(n.id);
          walk(n.children);
        }
      }
    }
    walk(treeData);
    setExpanded(ids);
  }, [query, treeData]);

  const selectedIds = useMemo(() => {
    const ids: string[] = [];
    for (const id of multiDocIds) ids.push(`doc:${id}`);
    for (const id of multiFolderIds) ids.push(`fld:${id}`);
    if (signaturesOpen && selectedProjectId) {
      ids.push(`prj:${selectedProjectId}`);
    } else if (selectedDocId && !multiDocIds.includes(selectedDocId)) {
      ids.push(`doc:${selectedDocId}`);
    } else if (
      selectedFolderId &&
      !multiFolderIds.includes(selectedFolderId) &&
      !selectedDocId
    ) {
      ids.push(`fld:${selectedFolderId}`);
    } else if (
      selectedProjectId &&
      !selectedDocId &&
      !selectedFolderId &&
      !signaturesOpen
    ) {
      ids.push(`prj:${selectedProjectId}`);
    }
    return [...new Set(ids)];
  }, [
    multiDocIds,
    multiFolderIds,
    selectedDocId,
    selectedFolderId,
    selectedProjectId,
    signaturesOpen,
  ]);

  function onNodeClick(node: TreeNode, e: ReactMouseEvent) {
    const data = node.data || {};
    const type = data.type as string | undefined;

    if (type === "project") {
      const pid = String(data.projectId);
      if (editing?.type === "prj" && editing.id === pid) return;
      // Не сбрасываем multiDocIds — иначе пропадает выбор ИУЛ при открытии/закрытии папки
      setMultiFolderIds([]);
      onSelectProject(pid);
      onSelectFolder(null);
      // Не трогаем выбранный документ/ИУЛ: раскрытие дерева ≠ смена документа
      return;
    }

    if (type === "folder") {
      const fid = String(data.folderId);
      const pid = String(data.projectId);
      if (editing?.type === "fld" && editing.id === fid) return;
      if (e.ctrlKey || e.metaKey) {
        setMultiFolderIds((prev) =>
          prev.includes(fid) ? prev.filter((x) => x !== fid) : [...prev, fid],
        );
      } else {
        setMultiFolderIds([fid]);
      }
      // Не очищаем выбранные ИУЛ при клике по папке (C-111)
      onSelectProject(pid);
      onSelectFolder(fid);
      return;
    }

    if (type === "doc") {
      const docId = String(data.docId);
      const pid = String(data.projectId);
      const folderId = (data.folderId as string | null) ?? null;
      const d = getDocument(docId);
      if (!d) return;

      onSelectProject(pid);
      onSelectFolder(folderId);

      if (e.shiftKey && anchorDocIdRef.current) {
        const ordered = flattenVisibleDocs(pid, query);
        const range = rangeSelect(ordered, anchorDocIdRef.current, docId);
        setMulti(range);
        setMultiFolderIds([]);
        onSelectDoc(docId);
      } else if (e.ctrlKey || e.metaKey) {
        const next = multiDocIds.includes(docId)
          ? multiDocIds.filter((x) => x !== docId)
          : [...multiDocIds, docId];
        if (!next.length) {
          setMulti([docId]);
        } else {
          setMulti(next);
        }
        anchorDocIdRef.current = docId;
        setMultiFolderIds([]);
        onSelectDoc(docId);
      } else if (kind === "waybill") {
        // В разделе накладных: ИУЛ накапливаются кликом; накладная меняется, не стирая ИУЛ
        anchorDocIdRef.current = docId;
        setMultiFolderIds([]);
        if (d.kind === "info_sheet") {
          const keepWaybills = multiDocIds.filter(
            (id) => getDocument(id)?.kind === "waybill",
          );
          const iuls = multiDocIds.filter(
            (id) => getDocument(id)?.kind === "info_sheet",
          );
          const nextIuls = iuls.includes(docId)
            ? iuls.filter((x) => x !== docId)
            : [...iuls, docId];
          setMulti([...keepWaybills, ...nextIuls]);
        } else {
          const keepIuls = multiDocIds.filter(
            (id) => getDocument(id)?.kind === "info_sheet",
          );
          setMulti([...keepIuls, docId]);
        }
        onSelectDoc(docId);
      } else {
        anchorDocIdRef.current = docId;
        setMulti([docId]);
        setMultiFolderIds([]);
        onSelectDoc(docId);
      }
    }
  }

  function onNodeDoubleClick(node: TreeNode) {
    const data = node.data || {};
    const type = data.type as string | undefined;
    if (type === "project") {
      const pid = String(data.projectId);
      const p = projects.find((x) => x.id === pid);
      if (p) setEditing({ type: "prj", id: pid, value: p.name });
    } else if (type === "folder") {
      const fid = String(data.folderId);
      const f = getFolder(fid);
      if (f && !f.systemKey) setEditing({ type: "fld", id: fid, value: f.name });
    } else if (type === "doc") {
      const docId = String(data.docId);
      const d = getDocument(docId);
      if (d) {
        const value =
          d.kind === "info_sheet"
            ? (
                d.iulWizard?.docDesignation?.trim() ||
                d.iulWizard?.ulCode?.trim() ||
                d.title
              ).slice(0, 200)
            : d.title;
        setEditing({ type: "doc", id: docId, value });
      }
    }
  }

  const folderDeleteTarget =
    selectedFolderId ||
    multiFolderIds[0] ||
    (selectedDocId ? getDocument(selectedDocId)?.folderId : null) ||
    null;

  const treeActions: MultiButtonItem[] = [
    {
      id: "add-folder",
      icon: FolderPlus,
      label: "Добавить папку",
      ariaLabel: "Добавить папку",
      onClick: () => handleAddFolder(),
    },
    {
      id: "add-doc",
      icon: FilePlus,
      label: "Добавить файл",
      ariaLabel: kind === "waybill" ? "Добавить накладную" : "Добавить файл",
      onClick: () => handleAddDoc(),
    },
    {
      id: "del-folder",
      icon: FolderX,
      label: "Удалить папку",
      ariaLabel: "Удалить папку",
      onClick: () => handleDeleteFolder(),
      disabled:
        !folderDeleteTarget ||
        (kind === "info_sheet" && signaturesOpen),
    },
    {
      id: "del-doc",
      icon: FileX,
      label: "Удалить файл",
      ariaLabel: "Удалить файл",
      onClick: () => handleDeleteDoc(),
      disabled:
        (!selectedDocId && multiDocIds.length === 0) ||
        (kind === "info_sheet" && signaturesOpen),
    },
    ...(kind === "info_sheet"
      ? [
          {
            id: "batch",
            icon: IconBatchDocs,
            label: "Пакет PDF",
            ariaLabel: "Создать несколько документов",
            onClick: () => handleBatchClick(),
          } satisfies MultiButtonItem,
        ]
      : []),
  ];

  return (
    <aside
      className="relative flex w-full shrink-0 flex-col border-b border-white/10 bg-[rgba(22,22,24,0.72)] text-white backdrop-blur-xl sm:h-full sm:min-h-0 sm:w-[var(--sw)] sm:self-stretch sm:border-b-0 sm:border-r sm:border-white/10"
      style={{ ["--sw" as string]: `${sidebarWidth}px` } as CSSProperties}
      aria-label="Меню проектов"
    >
      <div className="w-full border-b border-white/10 px-2 py-2">
        <MultiButton
          items={treeActions}
          size="sm"
          variant="ghost"
          highlightColor="#2fc6f6"
          reserveLabelSpace={false}
          fillWidth
          className="w-full"
          aria-label="Действия с деревом"
        />
        {kind === "info_sheet" ? (
          <input
            ref={batchInputRef}
            type="file"
            accept="application/pdf,.pdf"
            multiple
            className="sr-only"
            onChange={(e) => onBatchFilesChosen(e.target.files)}
          />
        ) : null}
      </div>

      <div className="border-b border-white/10 px-3 py-2.5">
        <label className="relative block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
          <input
            className="w-full rounded-lg border border-white/10 bg-white/5 py-2 pl-9 pr-3 text-sm text-white placeholder:text-white/35 outline-none focus:border-white/25 focus:bg-white/10"
            placeholder="Поиск…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Поиск документов"
          />
        </label>
      </div>

      <div className="scrollbar-brand min-h-0 flex-1 overflow-y-auto py-2 pl-1 pr-1.5">
        {!hydrated ? (
          <p className="px-2 py-3 text-xs text-white/45">Загрузка…</p>
        ) : projects.length === 0 ? (
          <p className="px-2 py-3 text-xs text-white/45">Пока нет проектов</p>
        ) : (
          <TreeView
            data={treeData}
            className="bg-transparent text-white"
            multiSelect
            selectable
            selectedIds={selectedIds}
            onSelectionChange={() => {
              /* выбор в onNodeClick */
            }}
            expandedIds={expanded}
            onExpandedChange={setExpanded}
            onNodeClick={onNodeClick}
            onNodeDoubleClick={onNodeDoubleClick}
            onDropDocs={(docIds, target) => {
              const t = target.data?.type as string | undefined;
              let folderId: string | null = null;
              if (t === "folder") {
                folderId = String(target.data?.folderId ?? "");
                const f = getFolder(folderId);
                if (f?.systemKey === "signatures") {
                  window.alert("Нельзя переносить документы в «Подписи»");
                  return;
                }
              } else if (t === "project") {
                folderId = null;
              } else {
                return;
              }
              try {
                for (const id of docIds) {
                  moveDocument(id, folderId);
                }
                bump();
                onLibraryChange?.();
                if (folderId) {
                  setExpanded((prev) =>
                    prev.includes(`fld:${folderId}`)
                      ? prev
                      : [...prev, `fld:${folderId}`],
                  );
                  onSelectFolder(folderId);
                }
              } catch (err) {
                window.alert(
                  err instanceof Error
                    ? err.message
                    : "Не удалось перенести файлы",
                );
              }
            }}
            showLines={false}
            showIcons
            animateExpand
            indent={14}
          />
        )}
      </div>

      <div className="border-t border-white/10 p-3">
        {showNew ? (
          <div className="flex flex-col gap-2">
            <input
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none placeholder:text-white/35 focus:border-white/25"
              placeholder="Название проекта"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateProject();
                if (e.key === "Escape") setShowNew(false);
              }}
              autoFocus
            />
            <div className="flex gap-2">
              <button
                type="button"
                className="flex-1 rounded-lg bg-[#2fc6f6] px-3 py-2 text-xs font-semibold text-[#0b1a22] hover:bg-[#4dd0f7]"
                onClick={handleCreateProject}
              >
                Создать
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-2 text-xs text-white/60 hover:bg-white/8"
                onClick={() => setShowNew(false)}
              >
                Отмена
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white/85 transition-colors hover:bg-white/10"
            onClick={() => setShowNew(true)}
          >
            + Новый проект
          </button>
        )}
      </div>

      <ConfirmDialog
        open={!!confirm}
        title={
          confirm?.kind === "folder"
            ? "Удалить папку?"
            : confirm?.kind === "project"
              ? "Удалить проект?"
              : confirm && confirm.ids.length > 1
                ? `Удалить ${confirm.ids.length} документа?`
                : "Удалить документ?"
        }
        description={
          confirm?.kind === "folder" ? (
            <>
              Папка «{confirm.name}» и всё содержимое будут удалены без
              возможности восстановления из корзины.
            </>
          ) : confirm?.kind === "project" ? (
            <>
              Проект «{confirm.name}» будет удалён целиком вместе с папками и
              документами.
            </>
          ) : confirm?.kind === "docs" ? (
            confirm.titles.length <= 3 ? (
              <>
                Будут удалены:{" "}
                {confirm.titles.map((t) => `«${t}»`).join(", ")}.
              </>
            ) : (
              <>
                Будут удалены {confirm.titles.length} документов, в том числе «
                {confirm.titles[0]}» и ещё {confirm.titles.length - 1}.
              </>
            )
          ) : null
        }
        confirmLabel="Удалить"
        onCancel={() => setConfirm(null)}
        onConfirm={applyConfirm}
      />

      {/* Resize handle */}
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Изменить ширину дерева"
        title="Потяните, чтобы изменить ширину"
        className="absolute inset-y-0 right-0 z-10 hidden w-1.5 cursor-col-resize bg-transparent hover:bg-[#2fc6f6]/35 sm:block"
        onMouseDown={(e) => {
          e.preventDefault();
          dragRef.current = { startX: e.clientX, startW: sidebarWidth };
          document.body.style.cursor = "col-resize";
          document.body.style.userSelect = "none";
        }}
      />
    </aside>
  );
}
