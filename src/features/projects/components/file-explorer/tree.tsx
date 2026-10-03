import { useState } from "react";
import { Doc, Id } from "../../../../../convex/_generated/dataModel";
import {
  useCreateFile,
  useCreateFolder,
  useDeleteFile,
  useFolderContents,
  useRenameFile,
} from "../../hooks/use-files";
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuTrigger,
} from "@/components/ui/context-menu";
import { TreeItemWrapper } from "./tree-item-wrapper";
import { FileIcon, FolderIcon } from "@react-symbols/icons/utils";
import { ChevronRightIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { LoadingRow } from "./loading-row";
import { getItemPadding } from "./constants";
import { CreateInput } from "./create-input";
import { RenameInput } from "./rename-input";

export const Tree = ({
  item,
  level = 0,
  projectId,
}: {
  item: Doc<"files">;
  level?: number;
  projectId: Id<"projects">;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [creating, setCreating] = useState<"file" | "folder" | null>(null);

  const renameFile = useRenameFile();
  const deleteFile = useDeleteFile();
  const createFile = useCreateFile();
  const createFolder = useCreateFolder();
  

  const folderContents = useFolderContents({
    projectId,
    parentId: item._id,
    enabled: item.type === "folder" && isOpen,
  });

  const handleCreate = (name: string) => {
    setCreating(null); // note : possible due to react compare with snapshot not actual variable!
    if (creating === "file") {
      createFile({ projectId, name, content: "", parentId: item._id });
    } else {
      createFolder({ projectId, parentId: item._id, name });
    }
  };

  function handleRename(newName: string) {
    setIsRenaming(false);
    if (newName === item.name) return;
    renameFile({ id: item._id, newName });
  }

  const startCreating = (type: "file" | "folder") => {
    setIsOpen(true);
    setCreating(type);
  };

  if (item.type === "file") {
    const filename = item.name;

    if (isRenaming) {
      return (
        <RenameInput
          type="file"
          level={level}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
          defaultValue={filename}
          isOpen
        />
      );
    }

    return (
      <TreeItemWrapper
        item={item}
        isActive={false}
        level={level}
        onClick={() => null}
        onDoubleClick={() => null}
        onRename={() => setIsRenaming(true)}
        onDelete={() => {
          // close tab
          deleteFile({ id: item._id });
        }}
      >
        <FileIcon className="size-4 shrink-0" autoAssign fileName={filename} />
        <span className="truncate text-sm">{filename}</span>
      </TreeItemWrapper>
    );
  }

  const folderName = item.name;
  const folderRender = (
    <>
      <div className="flex items-center gap-0.5">
        <ChevronRightIcon
          className={cn(
            "size-4 shrink-0 text-muted-foreground",
            isOpen && "rotate-90",
          )}
        />
        <FolderIcon className="size-4" folderName={folderName} />
      </div>
      <span className="truncate text-sm">{folderName}</span>
    </>
  );

  if (creating) {
    return (
      <>
        {/* 1. The folder row itself (still clickable to toggle) */}
        <button
          onClick={() => setIsOpen((value) => !value)}
          className="group flex items-center gap-1 h-5.5 hover:bg-accent/30 w-full"
          style={{ paddingLeft: getItemPadding(level, false) }}
        >
          {folderRender}
        </button>
        {/* 2. If open, show children + the creation input */}
        {isOpen && (
          <>
            {folderContents === undefined && <LoadingRow level={level + 1} />}
            {/* THIS is the inline input for the new name */}
            <CreateInput
              type={creating}
              level={level + 1}
              onSubmit={handleCreate}
              onCancel={() => setCreating(null)}
            />
            {/* Existing children still render */}
            {folderContents?.map((subItem) => (
              <Tree
                key={subItem._id}
                item={subItem}
                level={level + 1}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }

  if (isRenaming) {
    return (
      <>
        <RenameInput
          type="folder"
          defaultValue={folderName}
          isOpen={isOpen}
          level={level}
          onSubmit={handleRename}
          onCancel={() => setIsRenaming(false)}
        />
        {/* 2. If open, show children + the creation input */}
        {isOpen && (
          <>
            {folderContents === undefined && <LoadingRow level={level + 1} />}
            {/* Existing children still render */}
            {folderContents?.map((subItem) => (
              <Tree
                key={subItem._id}
                item={subItem}
                level={level + 1}
                projectId={projectId}
              />
            ))}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <TreeItemWrapper
        item={item}
        isActive={true}
        level={level}
        onClick={() => setIsOpen((value) => !value)}
        onDoubleClick={() => {}}
        onRename={() => setIsRenaming(true)}
        onDelete={() => {
          // TODO: close tab
          deleteFile({ id: item._id });
        }}
        onCreateFile={() => startCreating("file")}
        onCreateFolder={() => startCreating("folder")}
      >
        {folderRender}
      </TreeItemWrapper>
      {isOpen && (
        <>
          {folderContents === undefined && <LoadingRow level={level + 1} />}
          {folderContents?.map((subItem) => (
            <Tree
              key={subItem._id}
              item={subItem}
              level={level + 1}
              projectId={projectId}
            />
          ))}
        </>
      )}
    </>
  );
};
