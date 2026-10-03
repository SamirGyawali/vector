import { useMutation, useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Doc, Id } from "../../../../convex/_generated/dataModel";

const sortItems = (items: Doc<"files">[]): Doc<"files">[] => {
  return [...items].sort((a, b) => {
    if (a.type === "folder" && b.type === "file") return -1;
    if (a.type === "file" && b.type === "folder") return 1;
    return a.name.localeCompare(b.name);
  });
};

export const useCreateFile = () => {
  return useMutation(api.files.createFile).withOptimisticUpdate(
    (localStore, args) => {
      const queryArgs = { projectId: args.projectId, parentId: args.parentId };
      // do some work
      const existingFiles = localStore.getQuery(
        api.files.getFolderContents,
        queryArgs,
      );
      if (existingFiles === undefined) return;

      const now = Date.now();
      const optimisticFile: Doc<"files"> = {
        _id: crypto.randomUUID() as Id<"files">, // temp fake id
        _creationTime: now,
        projectId: args.projectId,
        parentId: args.parentId,
        name: args.name,
        type: "file" as const, // prevent Ts inferring type as generic string
        content: args.content,
        updatedAt: now,
      };

      localStore.setQuery(
        api.files.getFolderContents,
        queryArgs,
        sortItems([...existingFiles, optimisticFile]),
      );
    },
  );
};

export const useCreateFolder = () => {
  return useMutation(api.files.createFolder).withOptimisticUpdate(
    (localStorage, args) => {
      const queryArgs = { projectId: args.projectId, parentId: args.parentId };

      const existingFiles = localStorage.getQuery(
        api.files.getFolderContents,
        queryArgs,
      );

      if (existingFiles === undefined) return;

      const now = Date.now();
      const optimisticFolder: Doc<"files"> = {
        _id: crypto.randomUUID() as Id<"files">,
        _creationTime: now,
        projectId: args.projectId,
        parentId: args.parentId,
        name: args.name,
        type: "folder" as const, // same as above
        updatedAt: now,
      };

      localStorage.setQuery(
        api.files.getFolderContents,
        queryArgs,
        sortItems([...existingFiles, optimisticFolder]),
      );
    },
  );
};

export const useFolderContents = ({
  projectId,
  parentId,
  enabled,
}: {
  projectId: Id<"projects">;
  parentId?: Id<"files">;
  enabled?: boolean;
}) => {
  return useQuery(
    api.files.getFolderContents,
    enabled ? { projectId, parentId } : "skip", // need to look at this syntax. is it only the convex thing or we can do similar thing in other, if so how?
  );
};

export const useRenameFile = () => {
  return useMutation(api.files.renameFile);
};

export const useDeleteFile = () => {
  return useMutation(api.files.deleteFile);
};
