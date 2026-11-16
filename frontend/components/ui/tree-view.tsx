"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import { ChevronRight, Folder, File, FolderOpen } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export type TreeNode = {
  id: string;
  label: React.ReactNode;
  icon?: React.ReactNode;
  children?: TreeNode[];
  data?: Record<string, unknown>;
};

export type TreeViewProps = {
  data: TreeNode[];
  className?: string;
  onNodeClick?: (node: TreeNode, event: React.MouseEvent) => void;
  onNodeDoubleClick?: (node: TreeNode, event: React.MouseEvent) => void;
  onNodeExpand?: (nodeId: string, expanded: boolean) => void;
  defaultExpandedIds?: string[];
  expandedIds?: string[];
  onExpandedChange?: (ids: string[]) => void;
  showLines?: boolean;
  showIcons?: boolean;
  selectable?: boolean;
  multiSelect?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (selectedIds: string[]) => void;
  indent?: number;
  animateExpand?: boolean;
  /** C-130: drop документов на папку / корень проекта */
  onDropDocs?: (docIds: string[], target: TreeNode) => void;
};

const EXPAND_EASE: [number, number, number, number] = [0.2, 0.9, 0.2, 1];
/** C-210: короткое раскрытие — без ощутимой задержки height:auto */
const EXPAND_MS = 0.09;
const DND_MIME = "application/x-docsaas-docs";

export function TreeView({
  data,
  className,
  onNodeClick,
  onNodeDoubleClick,
  onNodeExpand,
  defaultExpandedIds = [],
  expandedIds: controlledExpanded,
  onExpandedChange,
  showLines = false,
  showIcons = true,
  selectable = true,
  multiSelect = false,
  selectedIds = [],
  onSelectionChange,
  indent = 16,
  animateExpand = true,
  onDropDocs,
}: TreeViewProps) {
  const [internalExpanded, setInternalExpanded] = useState<Set<string>>(
    () => new Set(defaultExpandedIds),
  );
  const [internalSelectedIds, setInternalSelectedIds] =
    useState<string[]>(selectedIds);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const isExpandedControlled = controlledExpanded !== undefined;
  const expandedIds = isExpandedControlled
    ? new Set(controlledExpanded)
    : internalExpanded;

  const isControlled =
    selectedIds !== undefined && onSelectionChange !== undefined;
  const currentSelectedIds = isControlled ? selectedIds : internalSelectedIds;
  const selectedRef = useRef(currentSelectedIds);
  selectedRef.current = currentSelectedIds;

  useEffect(() => {
    if (!isControlled) setInternalSelectedIds(selectedIds);
  }, [selectedIds, isControlled]);

  const setExpandedSet = useCallback(
    (next: Set<string>) => {
      if (isExpandedControlled) {
        onExpandedChange?.([...next]);
      } else {
        setInternalExpanded(next);
        onExpandedChange?.([...next]);
      }
    },
    [isExpandedControlled, onExpandedChange],
  );

  const toggleExpanded = useCallback(
    (nodeId: string) => {
      const newSet = new Set(expandedIds);
      const isExpanded = newSet.has(nodeId);
      if (isExpanded) newSet.delete(nodeId);
      else newSet.add(nodeId);
      onNodeExpand?.(nodeId, !isExpanded);
      setExpandedSet(newSet);
    },
    [expandedIds, onNodeExpand, setExpandedSet],
  );

  const handleSelection = useCallback(
    (nodeId: string, opts: { ctrlKey?: boolean; shiftKey?: boolean } = {}) => {
      if (!selectable) return;
      let newSelection: string[];
      if (multiSelect && opts.ctrlKey) {
        newSelection = currentSelectedIds.includes(nodeId)
          ? currentSelectedIds.filter((id) => id !== nodeId)
          : [...currentSelectedIds, nodeId];
      } else if (multiSelect && opts.shiftKey && currentSelectedIds.length) {
        newSelection = [...new Set([...currentSelectedIds, nodeId])];
      } else {
        newSelection = [nodeId];
      }
      isControlled
        ? onSelectionChange?.(newSelection)
        : setInternalSelectedIds(newSelection);
    },
    [
      selectable,
      multiSelect,
      currentSelectedIds,
      isControlled,
      onSelectionChange,
    ],
  );

  const renderNode = (node: TreeNode, level = 0) => {
    const type = (node.data?.type as string | undefined) ?? "";
    const isFolder = type === "folder";
    const isProject = type === "project";
    const isDoc = type === "doc";
    const hasChildren = (node.children?.length ?? 0) > 0;
    const isExpanded = expandedIds.has(node.id);
    const isSelected = currentSelectedIds.includes(node.id);
    const isDropTarget = dropTargetId === node.id && (isFolder || isProject);

    const getDefaultIcon = () =>
      hasChildren || isFolder || isProject ? (
        isExpanded ? (
          <FolderOpen className="h-4 w-4 shrink-0 text-[#2fc6f6]" />
        ) : (
          <Folder className="h-4 w-4 shrink-0 text-white/70" />
        )
      ) : (
        <File className="h-4 w-4 shrink-0 text-white/65" />
      );

    return (
      <div key={node.id} className="select-none">
        <div
          className="flex items-start py-0.5 pr-2"
          style={{ paddingLeft: level * indent + 4 }}
        >
          <div
            className={cn(
              "flex w-full min-w-0 max-w-full items-start gap-1 rounded-md py-1.5 pl-1 pr-2 my-0.5 cursor-pointer transition-colors duration-150",
              "hover:bg-white/10",
              isSelected && "bg-[#2fc6f6]/28 ring-1 ring-[#2fc6f6]/50",
              isDropTarget && "ring-2 ring-[#2fc6f6] bg-[#2fc6f6]/20",
              dragging && isDoc && isSelected && "opacity-50",
              onDropDocs && isDoc && "cursor-grab active:cursor-grabbing",
            )}
            draggable={Boolean(onDropDocs && isDoc)}
            onDragStart={(e) => {
              if (!onDropDocs || !isDoc) return;
              const docId = String(node.data?.docId ?? "");
              if (!docId) return;
              const selected = selectedRef.current;
              const selectedDocIds = selected
                .filter((id) => id.startsWith("doc:"))
                .map((id) => id.slice(4));
              const ids =
                selectedDocIds.includes(docId) && selectedDocIds.length > 0
                  ? selectedDocIds
                  : [docId];
              const payload = JSON.stringify({ kind: "docs", ids });
              e.dataTransfer.setData(DND_MIME, payload);
              e.dataTransfer.setData("text/plain", payload);
              e.dataTransfer.effectAllowed = "move";
              setDragging(true);
            }}
            onDragEnd={() => {
              setDragging(false);
              setDropTargetId(null);
            }}
            onDragOver={(e) => {
              if (!onDropDocs || !(isFolder || isProject)) return;
              e.preventDefault();
              e.dataTransfer.dropEffect = "move";
              if (dropTargetId !== node.id) setDropTargetId(node.id);
            }}
            onDragLeave={(e) => {
              if (dropTargetId === node.id) {
                const related = e.relatedTarget as Node | null;
                if (related && e.currentTarget.contains(related)) return;
                setDropTargetId(null);
              }
            }}
            onDrop={(e) => {
              if (!onDropDocs || !(isFolder || isProject)) return;
              e.preventDefault();
              e.stopPropagation();
              setDropTargetId(null);
              setDragging(false);
              const raw =
                e.dataTransfer.getData(DND_MIME) ||
                e.dataTransfer.getData("text/plain");
              if (!raw) return;
              try {
                const parsed = JSON.parse(raw) as {
                  kind?: string;
                  ids?: string[];
                };
                if (parsed.kind !== "docs" || !Array.isArray(parsed.ids)) return;
                const ids = parsed.ids.filter(Boolean);
                if (!ids.length) return;
                onDropDocs(ids, node);
              } catch {
                /* ignore bad payload */
              }
            }}
            onClick={(e) => {
              const target = e.target as HTMLElement;
              if (target.closest("[data-tree-chevron]")) return;
              if (hasChildren) toggleExpanded(node.id);
              handleSelection(node.id, {
                ctrlKey: e.ctrlKey || e.metaKey,
                shiftKey: e.shiftKey,
              });
              onNodeClick?.(node, e);
            }}
            onDoubleClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              onNodeDoubleClick?.(node, e);
            }}
            data-tree-id={node.id}
            data-selected={isSelected ? "true" : "false"}
            data-expanded={hasChildren && isExpanded ? "true" : "false"}
          >
            <motion.span
              data-tree-chevron={hasChildren ? "true" : undefined}
              className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center"
              animate={{ rotate: hasChildren && isExpanded ? 90 : 0 }}
              transition={{ duration: EXPAND_MS, ease: EXPAND_EASE }}
              onClick={(e) => {
                if (!hasChildren) return;
                e.preventDefault();
                e.stopPropagation();
                toggleExpanded(node.id);
              }}
            >
              {hasChildren ? (
                <ChevronRight className="h-3 w-3 text-white/55" />
              ) : (
                <span className="h-3 w-3" />
              )}
            </motion.span>

            {showIcons ? (
              <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center text-white/70">
                {node.icon ?? getDefaultIcon()}
              </span>
            ) : null}

            <span className="min-w-0 flex-1 whitespace-normal break-words text-sm leading-snug text-white/90">
              {node.label}
            </span>
          </div>
        </div>

        <AnimatePresence initial={false}>
          {hasChildren && isExpanded ? (
            <motion.div
              key={`${node.id}-kids`}
              initial={
                animateExpand
                  ? { height: 0, opacity: 0.5 }
                  : { height: "auto", opacity: 1 }
              }
              animate={{ height: "auto", opacity: 1 }}
              exit={
                animateExpand
                  ? { height: 0, opacity: 0.5 }
                  : { height: 0, opacity: 0 }
              }
              transition={{
                duration: animateExpand ? EXPAND_MS : 0,
                ease: EXPAND_EASE,
              }}
              className="overflow-hidden will-change-[height,opacity]"
            >
              {node.children!.map((child) => renderNode(child, level + 1))}
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    );
  };

  void showLines;

  return (
    <div className={cn("w-full", className)}>
      <div className="py-1">
        {data.map((node) => renderNode(node, 0))}
      </div>
    </div>
  );
}
