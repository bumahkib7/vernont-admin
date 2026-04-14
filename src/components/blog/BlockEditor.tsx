"use client";

import { useState, useCallback, useMemo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Card,
  CardContent,
  CardHeader,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  GripVertical,
  Trash2,
  Copy,
  Plus,
  ChevronDown,
  ChevronRight,
  Heading,
  AlignLeft,
  ImageIcon,
  ShoppingBag,
  BarChart3,
  AlertTriangle,
  HelpCircle,
  MousePointerClick,
  Quote,
  Minus,
} from "lucide-react";
import { BlockForm } from "./BlockForm";
import type { BlogBlock } from "@/lib/api/blog";

// Re-export for convenience
export type { BlogBlock } from "@/lib/api/blog";

export type BlockType = BlogBlock["type"];

// ---------------------------------------------------------------------------
// Internal wrapper: attaches a stable key for dnd-kit + React
// ---------------------------------------------------------------------------

interface EditorBlock {
  _key: string;
  block: BlogBlock;
}

// ---------------------------------------------------------------------------
// Block type metadata (icon + label)
// ---------------------------------------------------------------------------

const BLOCK_TYPES: {
  type: BlockType;
  label: string;
  icon: React.ReactNode;
}[] = [
  { type: "heading", label: "Heading", icon: <Heading className="h-4 w-4" /> },
  { type: "paragraph", label: "Paragraph", icon: <AlignLeft className="h-4 w-4" /> },
  { type: "image", label: "Image", icon: <ImageIcon className="h-4 w-4" /> },
  { type: "product-card", label: "Product Card", icon: <ShoppingBag className="h-4 w-4" /> },
  { type: "product-comparison", label: "Product Comparison", icon: <BarChart3 className="h-4 w-4" /> },
  { type: "callout", label: "Callout", icon: <AlertTriangle className="h-4 w-4" /> },
  { type: "faq", label: "FAQ", icon: <HelpCircle className="h-4 w-4" /> },
  { type: "cta", label: "Call to Action", icon: <MousePointerClick className="h-4 w-4" /> },
  { type: "quote", label: "Quote", icon: <Quote className="h-4 w-4" /> },
  { type: "divider", label: "Divider", icon: <Minus className="h-4 w-4" /> },
];

function blockLabel(type: BlockType): string {
  return BLOCK_TYPES.find((b) => b.type === type)?.label ?? type;
}

// ---------------------------------------------------------------------------
// Unique key generator
// ---------------------------------------------------------------------------

let _counter = 0;
function uid(): string {
  return `blk_${Date.now()}_${++_counter}`;
}

// ---------------------------------------------------------------------------
// Sortable block card
// ---------------------------------------------------------------------------

interface SortableBlockProps {
  editorBlock: EditorBlock;
  collapsed: boolean;
  onToggle: () => void;
  onUpdate: (updated: BlogBlock) => void;
  onDelete: () => void;
  onDuplicate: () => void;
}

function SortableBlock({
  editorBlock,
  collapsed,
  onToggle,
  onUpdate,
  onDelete,
  onDuplicate,
}: SortableBlockProps) {
  const { block, _key } = editorBlock;

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: _key });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Preview snippet from common text fields
  const previewText =
    (block.text as string) ||
    (block.question as string) ||
    (block.buttonText as string) ||
    "";

  return (
    <Card ref={setNodeRef} style={style} className="relative">
      <CardHeader className="cursor-pointer select-none py-3" onClick={onToggle}>
        <div className="flex items-center gap-2">
          {/* Drag handle */}
          <button
            type="button"
            className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-accent active:cursor-grabbing"
            {...attributes}
            {...listeners}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="h-4 w-4" />
          </button>

          {/* Collapse chevron */}
          {collapsed ? (
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}

          {/* Block type badge */}
          <Badge variant="outline" className="text-xs">
            {blockLabel(block.type)}
          </Badge>

          {/* Preview snippet when collapsed */}
          {collapsed && previewText && (
            <span className="truncate text-xs text-muted-foreground max-w-[260px]">
              {previewText.slice(0, 60)}
            </span>
          )}

          {/* Spacer */}
          <span className="flex-1" />

          {/* Actions */}
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDuplicate();
            }}
            title="Duplicate block"
          >
            <Copy className="h-3.5 w-3.5" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Delete block"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>

      {!collapsed && (
        <CardContent className="pt-0 pb-4">
          <BlockForm block={block} onChange={onUpdate} />
        </CardContent>
      )}
    </Card>
  );
}

// ---------------------------------------------------------------------------
// BlockEditor (main export)
// ---------------------------------------------------------------------------

interface BlockEditorProps {
  blocks: BlogBlock[];
  onChange: (blocks: BlogBlock[]) => void;
}

export function BlockEditor({ blocks, onChange }: BlockEditorProps) {
  // Stable internal keys for each block position. We regenerate keys when
  // the length changes externally (e.g. AI generation replaces all blocks).
  const [keyMap, setKeyMap] = useState<string[]>(() =>
    blocks.map(() => uid())
  );

  // Keep keyMap in sync with incoming blocks length
  const editorBlocks: EditorBlock[] = useMemo(() => {
    // Grow/shrink keyMap to match blocks
    let keys = keyMap;
    if (keys.length < blocks.length) {
      keys = [...keys, ...blocks.slice(keys.length).map(() => uid())];
      setKeyMap(keys);
    } else if (keys.length > blocks.length) {
      keys = keys.slice(0, blocks.length);
      setKeyMap(keys);
    }
    return blocks.map((block, i) => ({ _key: keys[i], block }));
  }, [blocks, keyMap]);

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [addOpen, setAddOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor)
  );

  // -- Handlers --

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;
      const oldIndex = editorBlocks.findIndex((eb) => eb._key === active.id);
      const newIndex = editorBlocks.findIndex((eb) => eb._key === over.id);
      if (oldIndex === -1 || newIndex === -1) return;

      const newBlocks = arrayMove(blocks, oldIndex, newIndex);
      const newKeys = arrayMove(keyMap, oldIndex, newIndex);
      setKeyMap(newKeys);
      onChange(newBlocks);
    },
    [blocks, editorBlocks, keyMap, onChange]
  );

  const handleToggle = useCallback((key: string) => {
    setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  const handleUpdate = useCallback(
    (index: number, updated: BlogBlock) => {
      const next = [...blocks];
      next[index] = updated;
      onChange(next);
    },
    [blocks, onChange]
  );

  const handleDelete = useCallback(
    (index: number) => {
      const next = blocks.filter((_, i) => i !== index);
      const nextKeys = keyMap.filter((_, i) => i !== index);
      setKeyMap(nextKeys);
      onChange(next);
    },
    [blocks, keyMap, onChange]
  );

  const handleDuplicate = useCallback(
    (index: number) => {
      const source = blocks[index];
      const dup: BlogBlock = { ...source };
      const next = [...blocks];
      next.splice(index + 1, 0, dup);
      const nextKeys = [...keyMap];
      nextKeys.splice(index + 1, 0, uid());
      setKeyMap(nextKeys);
      onChange(next);
    },
    [blocks, keyMap, onChange]
  );

  const handleAddBlock = useCallback(
    (type: BlockType) => {
      let newBlock: BlogBlock = { type };
      // Seed sensible defaults
      if (type === "heading") newBlock = { type, level: "h2", text: "" };
      if (type === "callout") newBlock = { type, icon: "info", title: "", text: "" };
      if (type === "cta") newBlock = { type, buttonText: "", url: "", variant: "primary" };
      if (type === "product-comparison") newBlock = { type, productIds: [] };

      setKeyMap((prev) => [...prev, uid()]);
      onChange([...blocks, newBlock]);
      setAddOpen(false);
    },
    [blocks, onChange]
  );

  const sortableIds = useMemo(
    () => editorBlocks.map((eb) => eb._key),
    [editorBlocks]
  );

  return (
    <div className="space-y-3">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sortableIds} strategy={verticalListSortingStrategy}>
          {editorBlocks.map((eb, idx) => (
            <SortableBlock
              key={eb._key}
              editorBlock={eb}
              collapsed={!!collapsed[eb._key]}
              onToggle={() => handleToggle(eb._key)}
              onUpdate={(updated) => handleUpdate(idx, updated)}
              onDelete={() => handleDelete(idx)}
              onDuplicate={() => handleDuplicate(idx)}
            />
          ))}
        </SortableContext>
      </DndContext>

      {blocks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed py-12 text-muted-foreground">
          <AlignLeft className="mb-2 h-8 w-8" />
          <p className="text-sm">No blocks yet. Add your first block below.</p>
        </div>
      )}

      {/* Add Block button */}
      <Popover open={addOpen} onOpenChange={setAddOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" className="w-full">
            <Plus className="mr-2 h-4 w-4" />
            Add Block
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="center">
          <div className="grid gap-0.5">
            {BLOCK_TYPES.map((bt) => (
              <button
                key={bt.type}
                type="button"
                className="flex items-center gap-2 rounded-md px-3 py-2 text-sm hover:bg-accent text-left"
                onClick={() => handleAddBlock(bt.type)}
              >
                {bt.icon}
                {bt.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
