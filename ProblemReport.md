# Problem Report

Date: 2026-08-01

## 1. File Explorer Header — Action Icons Clipped When Panel Shrinks (Open State)

**File:** `src/features/projects/components/file-explorer/index.tsx` (lines 48-102)

**Symptom:**
- When `isOpen` is `true`, `ml-auto` on the actions div behaves like a fixed margin (not auto).
- The actions div (line 62) cannot be made smaller.
- Shrinking the container hides/clips the action icons.
- When `isOpen` is `false`, `ml-auto` works correctly and the icons shift with the container size.

**The Cause**
The Radix ScrollArea's content wrapper (<div style="display: table; min-width: 100%">) — the inline display: table forces table layout, so its width comes from its widest content's max-content (~525px) instead of its parent. The viewport is overflow: hidden and narrower, so anything past its right edge — your header icons — gets clipped. min-width: 100% only sets a floor, not a cap.
display: block makes the wrapper's width come from the viewport instead of the content, so nothing ever overflows. Everything else (truncate, min-w-0, ml-auto) was an effect, not the cause.

### Appendix: The confirmed fix and "how is this the solution?" (Q&A)

**The fix that actually works** (verified against the real `@radix-ui/react-scroll-area` build, measured with Playwright/headless Chromium):

```css
[data-radix-scroll-area-viewport] > div {
  display: block !important;
}
```

**Question:** How is this the solution?

**Answer — the full mechanism, from the DOM up:**

**1. The box stack.** The scroll area nests 4 boxes, each a different width-behavior world:

```
[data-radix-scroll-area-root]            ← fixed width, set by the sidebar pane (~400px)
└─ [data-radix-scroll-area-viewport]     ← overflow: hidden; the visible window, same 400px
   └─ <div style="display: table; min-width: 100%">   ← Radix's content wrapper
      ├─ header row  (name … icons)
      └─ tree rows   (folder/file names)
```

The viewport is the "window." Everything inside it is drawn in the window's coordinate space, and **whatever sticks out past the window's edge gets clipped** by `overflow: hidden`. That's the entire bug: the header icons weren't out of the component — they were out of the *window*, painted beyond its right edge, then cut.

**2. The two worlds: `block` vs `table` sizing.** Both are layout modes, and they answer the question *"how wide am I?"* completely differently:

| | `display: block` | `display: table` |
|---|---|---|
| Width comes from | **my parent** ("as wide as I'm allowed") | **my content** ("as wide as my widest row demands") |
| Result | = containing block width (400px) | = max-content of widest child (could be 525px) |

A `table` box runs the CSS *table layout algorithm*: it sums up its columns and sizes itself to fit the widest cell. It will happily be **wider than its parent**. `min-width: 100%` is just a *floor* — "at least as wide as the viewport" — it puts no cap on the ceiling. That's why Radix used it: it guarantees the wrapper fills the viewport even when content is short. Fine for short content; fatal for wide content.

**3. Why the tree being open is the trigger.** Table width = max-content of **all** content, not just the header.

- **Tree closed:** the only content is the header. Its max-content (name + icons) is ~400px, which fits. No stretch → icons visible.
- **Tree open:** the tree rows' long file/folder names have a bigger max-content — say **525px**. That becomes the wrapper's width. The header row is laid out *inside a 525px-wide table*, so its icons get pinned at x=525px — 125px past the 400px window → **clipped**.

That's exactly why the threshold was ~525px: that's the max-content of the widest tree row, measured live.

**4. Why `truncate` alone did nothing.** `truncate` (overflow hidden + ellipsis) only changes how *one flex child* handles being squeezed. It does **not** change the wrapper's width. The wrapper was already blown out to 525px by a *different* row further down the tree — the header's own truncation can't shrink that. So the earlier attempts were fixing the wrong box: constraining the child while the *parent* was still `display: table`. No effect. The name only ellipsizes *after* the wrapper becomes `block` and genuinely narrows.

**5. Why `!important` is mandatory.** Radix sets those styles **inline** (`style="display: table; min-width: 100%"`). In CSS, inline styles beat any selector specificity — the only thing that outranks them is a `!important` declaration in a stylesheet. So:

- `[&>div]:block` (no `!`) → inline `table` wins → silently nothing.
- `[&>div]:!block` (Tailwind v3 prefix syntax, invalid in v4) → ignored.
- `[data-radix-scroll-area-viewport] > div { display: block !important }` → outranks inline → wins.

**6. Putting it together.** `display: block` makes the wrapper's width come from **the viewport** instead of **the content**:

1. Wrapper now exactly 400px (never wider than the window).
2. Header row does its `flex` dance inside 400px: name `truncate`s, icons stay at the right edge of the *viewport* → **visible**.
3. Long tree rows overflow their *row* box, but the wrapper no longer stretches to contain them — so nothing pushes the header.

Every earlier attempt attacked symptoms (`truncate`, `min-w-0`) on the wrong box; the one-line override changes the width model of the box that's actually oversized. This is also a known Radix gap — [radix-ui/primitives#2964](https://github.com/radix-ui/primitives/issues/2964) asks for a prop to disable the `display: table`; until it lands, the CSS override is the fix.

**Measurement evidence** (real Radix component, real project's dependency tree, esbuild bundle + headless Chromium):

| mode | container | content wrapper | icons at | clipped? |
|---|---|---|---|---|
| current (`display: table`) | 352 / 402 / 527 | **629px** (fixed) | 630px | **yes, at all three** |
| current | 702 | 700px | 701px | no |
| **fix (`display: block`)** | 352 / 402 / 527 / 702 | = container | = container | **no, never** |

Side note: the header `truncate` (`index.tsx:59`) is complementary, not redundant — now that the wrapper is block-width, it is what lets the name ellipsize instead of pushing the icons. Keep both.

---

## 2. File Tree: Folders Can Never Expand (Primary Functional Bug)

**File:** `src/features/projects/components/file-explorer/tree.tsx`

**Symptom:** The explorer shows only root-level items; folders cannot be expanded, so the recursive tree is dead.

**Root Cause:**
- `isOpen` / `setIsOpen` (line 28) are declared but never called — no click handler, no chevron, no expand toggle on the folder row.
- `folderContents` (line 37) is fetched but never rendered — no children output, no recursion.
- The folder branch (lines 65-72) renders `<TreeItemWrapper item={item} isActive={true} level={0}>` — hardcoded `level={0}`, no `onClick`, no handlers.

**Solution:**
- Render a chevron button on the folder row that toggles `isOpen`.
- Pass `onClick` to `TreeItemWrapper` to toggle.
- Render `folderContents` recursively using `<Tree>` when `isOpen`.
- Pass the real `level` prop instead of `0`.

---

## 3. `deleteFile` Never Deletes Files

**File:** `convex/files.ts` (lines 263-294)

**Symptom:** Deleting a file is a no-op (mutation succeeds, file stays). Deleting a folder leaves all its file descendants orphaned.

**Root Cause:**
`deleteRecursively` only calls `ctx.db.delete` inside `if (item.type === "folder")`. A `"file"` node hits the empty else path, so files are skipped entirely.

**Solution:**
Move the storage cleanup + `ctx.db.delete` outside the `type === "folder"` guard so both files and folders are deleted, and keep the recursive descent for folders only:

```ts
const deleteRecursively = async (fileId: Id<"files">) => {
  const item = await ctx.db.get("files", fileId);
  if (!item) return;

  if (item.type === "folder") {
    const children = await ctx.db
      .query("files")
      .withIndex("by_project_parent", (q) =>
        q.eq("projectId", item.projectId).eq("parentId", fileId),
      )
      .collect();

    for (const child of children) {
      await deleteRecursively(child._id);
    }
  }

  if (item.storageId) {
    await ctx.storage.delete(item.storageId);
  }

  await ctx.db.delete("files", fileId);
};
```

---

## 4. Context-Menu Actions Are Dead

**Files:** `tree.tsx`, `tree-item-wrapper.tsx`

**Symptom:** Right-click actions do nothing.
- File row (`tree.tsx:46-61`): "New File" item (`tree-item-wrapper.tsx:61`) calls `onCreateFile`, never passed.
- Folder row (`tree.tsx:65-72`): passes none of `onCreateFolder` / `onCreateFile` / `onRename` / `onDelete`, so all four folder menu items are no-ops.
- `createFile` / `createFolder` in `tree.tsx:34-35` are imported but never wired.

**Solution:** Pass all handlers into `TreeItemWrapper` for both file and folder branches, and implement the corresponding actions (create input, rename input, delete).

---

## 5. Rename Has No UI

**File:** `tree.tsx`

**Symptom:** `setIsRenaming(true)` (line 53) is called but nothing renders an edit input; renaming appears to do nothing. Nested create state `creating` (line 30) is never used either.

**Solution:** Render a `CreateInput`-style input when `isRenaming` is true, prefilled with the current name, committing on Enter/blur.

---

## 6. Type Error Blocks Build

**File:** `src/app/projects/[projectId]/layout.tsx` (line 10)

**Symptom:** `npx tsc --noEmit` fails in `.next/dev/types/validator.ts` (param contravariance).

**Root Cause:** `params` is typed as `Promise<{ projectId: Id<"projects"> }>` but Next 16's generated layout types expect `Promise<{ projectId: string }>`.

**Solution:** Type `params` as `Promise<{ projectId: string }>` and cast/validate inside the layout, or drop the manual type annotation and let Next infer it.

---

## Verified Non-Issues

- `q.eq("parentId", undefined)` in `getFolderContents` is **not** a bug — Convex serializes it as `$undefined` and it correctly matches root files.
- `h-5.5` is valid Tailwind v4 dynamic spacing.
