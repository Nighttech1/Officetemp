"use client";

import React, {
  createContext,
  forwardRef,
  useCallback,
  useContext,
  useEffect,
  useState,
  type HTMLAttributes,
  type ReactNode,
} from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { FileIcon, FolderIcon, FolderOpenIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export type TreeViewElement = {
  id: string;
  name: string;
  type?: "file" | "folder";
  isSelectable?: boolean;
  children?: TreeViewElement[];
};

type TreeSortMode =
  | "default"
  | "none"
  | ((a: TreeViewElement, b: TreeViewElement) => number);

type TreeContextProps = {
  selectedId: string | undefined;
  expandedItems: string[] | undefined;
  indicator: boolean;
  handleExpand: (id: string) => void;
  selectItem: (id: string) => void;
  setExpandedItems?: React.Dispatch<
    React.SetStateAction<string[] | undefined>
  >;
  openIcon?: ReactNode;
  closeIcon?: ReactNode;
  direction: "rtl" | "ltr";
  onSelectId?: (id: string) => void;
};

const TreeContext = createContext<TreeContextProps | null>(null);

export const useTree = () => {
  const context = useContext(TreeContext);
  if (!context) {
    throw new Error("useTree must be used within a TreeProvider");
  }
  return context;
};

const isFolderElement = (element: TreeViewElement) => {
  if (element.type) return element.type === "folder";
  return Array.isArray(element.children);
};

const mergeExpandedItems = (
  currentItems: string[] | undefined,
  nextItems: string[],
) => [...new Set([...(currentItems ?? []), ...nextItems])];

const treeCollator = new Intl.Collator("ru", {
  numeric: true,
  sensitivity: "base",
});

const defaultTreeComparator = (a: TreeViewElement, b: TreeViewElement) => {
  const aIsFolder = isFolderElement(a);
  const bIsFolder = isFolderElement(b);
  if (aIsFolder !== bIsFolder) return aIsFolder ? -1 : 1;
  return treeCollator.compare(a.name, b.name);
};

const getTreeComparator = (sort: TreeSortMode) => {
  if (sort === "none") return undefined;
  if (sort === "default") return defaultTreeComparator;
  return sort;
};

const sortTreeElements = (
  elements: TreeViewElement[],
  sort: TreeSortMode,
): TreeViewElement[] => {
  const comparator = getTreeComparator(sort);
  const nextElements = elements.map((element) => {
    if (!Array.isArray(element.children)) return element;
    return {
      ...element,
      children: sortTreeElements(element.children, sort),
    };
  });
  if (!comparator) return nextElements;
  return [...nextElements].sort(comparator);
};

const renderTreeElements = (
  elements: TreeViewElement[],
  sort: TreeSortMode,
): ReactNode =>
  sortTreeElements(elements, sort).map((element) => {
    if (isFolderElement(element)) {
      return (
        <Folder
          key={element.id}
          element={element.name}
          value={element.id}
          isSelectable={element.isSelectable}
        >
          {Array.isArray(element.children)
            ? renderTreeElements(element.children, sort)
            : null}
        </Folder>
      );
    }
    return (
      <File
        key={element.id}
        value={element.id}
        isSelectable={element.isSelectable}
      >
        {element.name}
      </File>
    );
  });

type TreeViewProps = {
  initialSelectedId?: string;
  selectedId?: string;
  indicator?: boolean;
  elements?: TreeViewElement[];
  initialExpandedItems?: string[];
  expandedItems?: string[];
  onExpandedChange?: (ids: string[]) => void;
  onSelectId?: (id: string) => void;
  openIcon?: ReactNode;
  closeIcon?: ReactNode;
  sort?: TreeSortMode;
  dir?: "rtl" | "ltr";
  children?: ReactNode;
  className?: string;
} & Omit<
  HTMLAttributes<HTMLDivElement>,
  "defaultValue" | "onSelect" | "children"
>;

const Tree = forwardRef<HTMLDivElement, TreeViewProps>(
  (
    {
      className,
      elements,
      initialSelectedId,
      selectedId: controlledSelected,
      initialExpandedItems,
      expandedItems: controlledExpanded,
      onExpandedChange,
      onSelectId,
      children,
      indicator = true,
      openIcon,
      closeIcon,
      sort = "default",
      dir,
      ...props
    },
    ref,
  ) => {
    const [selectedId, setSelectedId] = useState<string | undefined>(
      controlledSelected ?? initialSelectedId,
    );
    const [expandedItems, setExpandedItems] = useState<string[] | undefined>(
      controlledExpanded ?? initialExpandedItems,
    );

    useEffect(() => {
      if (controlledSelected !== undefined) setSelectedId(controlledSelected);
    }, [controlledSelected]);

    useEffect(() => {
      if (controlledExpanded !== undefined) setExpandedItems(controlledExpanded);
    }, [controlledExpanded]);

    const selectItem = useCallback(
      (id: string) => {
        setSelectedId(id);
        onSelectId?.(id);
      },
      [onSelectId],
    );

    const handleExpand = useCallback(
      (id: string) => {
        setExpandedItems((prev) => {
          const next = prev?.includes(id)
            ? prev.filter((item) => item !== id)
            : [...(prev ?? []), id];
          onExpandedChange?.(next);
          return next;
        });
      },
      [onExpandedChange],
    );

    const expandSpecificTargetedElements = useCallback(
      (els?: TreeViewElement[], selectId?: string) => {
        if (!els || !selectId) return;
        const findParent = (
          currentElement: TreeViewElement,
          currentPath: string[] = [],
        ) => {
          const isSelectable = currentElement.isSelectable ?? true;
          const newPath = [...currentPath, currentElement.id];
          if (currentElement.id === selectId) {
            if (isSelectable) {
              setExpandedItems((prev) => mergeExpandedItems(prev, newPath));
            } else if (newPath.includes(currentElement.id)) {
              newPath.pop();
              setExpandedItems((prev) => mergeExpandedItems(prev, newPath));
            }
            return;
          }
          if (
            Array.isArray(currentElement.children) &&
            currentElement.children.length > 0
          ) {
            currentElement.children.forEach((child) => {
              findParent(child, newPath);
            });
          }
        };
        els.forEach((element) => {
          findParent(element);
        });
      },
      [],
    );

    useEffect(() => {
      if (initialSelectedId) {
        expandSpecificTargetedElements(elements, initialSelectedId);
      }
    }, [initialSelectedId, elements, expandSpecificTargetedElements]);

    const direction = dir === "rtl" ? "rtl" : "ltr";
    const treeChildren =
      children ?? (elements ? renderTreeElements(elements, sort) : null);

    return (
      <TreeContext.Provider
        value={{
          selectedId,
          expandedItems,
          handleExpand,
          selectItem,
          setExpandedItems,
          indicator,
          openIcon,
          closeIcon,
          direction,
          onSelectId,
        }}
      >
        <div
          ref={ref}
          className={cn("relative overflow-hidden", className)}
          {...props}
        >
          <AccordionPrimitive.Root
            type="multiple"
            value={expandedItems}
            onValueChange={(v) => {
              setExpandedItems(v);
              onExpandedChange?.(v);
            }}
            className="flex flex-col gap-1"
            dir={direction}
          >
            {treeChildren}
          </AccordionPrimitive.Root>
        </div>
      </TreeContext.Provider>
    );
  },
);

Tree.displayName = "Tree";

const TreeIndicator = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => {
  const { direction } = useTree();
  return (
    <div
      ref={ref}
      dir={direction}
      className={cn(
        "absolute left-1.5 h-full w-px rounded-md bg-white/15 py-3 duration-300 ease-in-out rtl:right-1.5",
        className,
      )}
      {...props}
    />
  );
});

TreeIndicator.displayName = "TreeIndicator";

type FolderProps = {
  element: ReactNode;
  value: string;
  isSelectable?: boolean;
  isSelect?: boolean;
  children?: ReactNode;
  className?: string;
  /** Вызов при клике по строке папки (после select). */
  onActivate?: () => void;
} & Omit<HTMLAttributes<HTMLDivElement>, "onClick"> & {
    onClick?: React.MouseEventHandler<HTMLButtonElement>;
  };

const Folder = forwardRef<HTMLDivElement, FolderProps>(
  (
    {
      className,
      element,
      value,
      isSelectable = true,
      isSelect,
      children,
      onActivate,
      onClick,
      onDragOver,
      onDragLeave,
      onDrop,
      onContextMenu,
      onDoubleClick,
      ...props
    },
    ref,
  ) => {
    const {
      direction,
      expandedItems,
      indicator,
      selectedId,
      selectItem,
      openIcon,
      closeIcon,
      setExpandedItems,
    } = useTree();
    const isSelected = isSelect ?? selectedId === value;

    return (
      <AccordionPrimitive.Item
        ref={ref}
        value={value}
        className="relative h-full overflow-hidden"
        {...props}
      >
        <AccordionPrimitive.Trigger
          className={cn(
            "flex w-full items-center gap-1 rounded-md px-1 py-1 text-sm",
            {
              "rounded-md bg-white/14": isSelected && isSelectable,
              "cursor-pointer": isSelectable,
              "cursor-not-allowed opacity-50": !isSelectable,
            },
            className,
          )}
          disabled={!isSelectable}
          onClick={(e) => {
            selectItem(value);
            onActivate?.();
            onClick?.(e as unknown as React.MouseEvent<HTMLButtonElement>);
          }}
          onDoubleClick={
            onDoubleClick as unknown as React.MouseEventHandler
          }
          onDragOver={onDragOver as unknown as React.DragEventHandler}
          onDragLeave={onDragLeave as unknown as React.DragEventHandler}
          onDrop={onDrop as unknown as React.DragEventHandler}
          onContextMenu={
            onContextMenu as unknown as React.MouseEventHandler
          }
        >
          {expandedItems?.includes(value)
            ? (openIcon ?? (
                <FolderOpenIcon className="size-3.5 shrink-0 text-white/65" />
              ))
            : (closeIcon ?? (
                <FolderIcon className="size-3.5 shrink-0 text-white/65" />
              ))}
          <span className="min-w-0 flex-1 truncate text-left">{element}</span>
        </AccordionPrimitive.Trigger>
        <AccordionPrimitive.Content className="relative h-full overflow-hidden text-sm data-[state=closed]:animate-accordion-up data-[state=open]:animate-accordion-down">
          {element != null && indicator ? <TreeIndicator aria-hidden /> : null}
          <AccordionPrimitive.Root
            dir={direction}
            type="multiple"
            className="ml-5 flex flex-col gap-1 py-1 rtl:mr-5"
            value={expandedItems}
            onValueChange={(v) => setExpandedItems?.(v)}
          >
            {children}
          </AccordionPrimitive.Root>
        </AccordionPrimitive.Content>
      </AccordionPrimitive.Item>
    );
  },
);

Folder.displayName = "Folder";

type FileProps = {
  value: string;
  handleSelect?: (id: string) => void;
  isSelectable?: boolean;
  isSelect?: boolean;
  fileIcon?: ReactNode;
  children?: ReactNode;
  className?: string;
} & React.ButtonHTMLAttributes<HTMLButtonElement>;

const File = forwardRef<HTMLButtonElement, FileProps>(
  (
    {
      value,
      className,
      handleSelect,
      onClick,
      isSelectable = true,
      isSelect,
      fileIcon,
      children,
      ...props
    },
    ref,
  ) => {
    const { selectedId, selectItem } = useTree();
    const isSelected = isSelect ?? selectedId === value;
    return (
      <button
        ref={ref}
        type="button"
        disabled={!isSelectable}
        className={cn(
          "flex w-full items-center gap-1 rounded-md px-1 py-1 text-sm duration-200 ease-in-out",
          {
            "bg-white/14": isSelected && isSelectable,
            "cursor-pointer": isSelectable,
            "cursor-not-allowed opacity-50": !isSelectable,
          },
          className,
        )}
        onClick={(event) => {
          selectItem(value);
          handleSelect?.(value);
          onClick?.(event);
        }}
        {...props}
      >
        {fileIcon ?? (
          <FileIcon className="size-3.5 shrink-0 text-white/65" />
        )}
        <span className="truncate text-left">{children}</span>
      </button>
    );
  },
);

File.displayName = "File";

export { File, Folder, Tree, type TreeSortMode };
