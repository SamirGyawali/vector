import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuShortcut,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { cn } from "@/lib/utils";
import { getItemPadding } from "./constants";
import { Doc } from "../../../../../convex/_generated/dataModel";

export const TreeItemWrapper = ({
  item,
  children,
  onClick,
  onDoubleClick,
  onRename,
  onDelete,
  onCreateFolder,
  onCreateFile,
  isActive,
  level,
}: {
  item: Doc<"files">;
  children: React.ReactNode;
  onClick?: () => void;
  onDoubleClick?: () => void;
  onRename?: () => void;
  onDelete?: () => void;
  onCreateFolder?: () => void;
  onCreateFile?: () => void;
  isActive: Boolean;
  level: number;
}) => {
  return (
    <ContextMenu>

      <ContextMenuTrigger asChild>
        <button
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              onRename?.();
            }
          }}
          className={cn(
            "group flex items-center gap-1 w-full min-w-0 h-5.5 hover:bg-accent/30 outline-none focus:ring-1 focus:ring-inset focus:ring-ring",
            isActive && "bg-accent/30",
          )}
          // we need extra padding for file, so we're comparing type against file
          style={{ paddingLeft: getItemPadding(level, item.type === "file") }}
        >
          {children}
        </button>
      </ContextMenuTrigger>


      <ContextMenuContent
        onCloseAutoFocus={(e) => e.preventDefault()}
        className="w-64"
      >
        {item.type === "file" && (
          <>
            <ContextMenuItem onClick={onCreateFile} className="text-sm">
              New File
            </ContextMenuItem>
            <ContextMenuItem onClick={onRename} className="text-sm">
              Rename
            </ContextMenuItem>
            <ContextMenuItem onClick={onDelete} className="text-sm">
              Delete
            </ContextMenuItem>
          </>
        )}
        {item.type === "folder" && (
          <>
            <ContextMenuItem onClick={onCreateFolder} className="text-sm">
              New Folder
            </ContextMenuItem>
            <ContextMenuItem onClick={onCreateFile} className="text-sm">
              New File
            </ContextMenuItem>
            <ContextMenuSeparator />
            <ContextMenuItem onClick={onRename} className="text-sm">
              Rename
              <ContextMenuShortcut>Enter</ContextMenuShortcut>
            </ContextMenuItem>
            <ContextMenuItem onClick={onDelete} className="text-sm">
              Delete Permanently
              <ContextMenuShortcut>ctrl+Backspace</ContextMenuShortcut>
            </ContextMenuItem>
          </>
        )}
      </ContextMenuContent>
      
    </ContextMenu>
  );
};
