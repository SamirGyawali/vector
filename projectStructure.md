# Polaris (Vector) - Project Structure & Architecture Guide

## Overview

**Polaris** (branded as **Vector** in the UI) is a **web-based code editor/project management tool** built with Next.js 16, Convex (real-time database), Clerk (authentication), and Inngest (background jobs). Think of it as a simplified version of CodeSandbox/StackBlitz - users can create projects, manage files/folders, and eventually edit code with a preview.

---

## Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Framework | Next.js 16 (App Router) | Frontend + API routes |
| Database | Convex | Real-time serverless DB |
| Auth | Clerk | User authentication |
| Background Jobs | Inngest | Async workflows (AI generation, imports) |
| AI | Vercel AI SDK + Google Gemini | Text generation |
| Web Scraping | Firecrawl | URL content extraction |
| Monitoring | Sentry | Error tracking |
| UI | Tailwind + Radix/shadcn | Component library |

---

## Folder Structure

```
polaris/
├── convex/                   # Convex backend (database layer)
│   ├── _generated/           # Auto-generated Convex types/API
│   ├── auth.config.ts        # Clerk JWT auth config for Convex
│   ├── auth.ts               # Auth helper (verifyAuth)
│   ├── files.ts              # File/folder CRUD operations
│   ├── projects.ts           # Project CRUD operations
│   └── schema.ts             # Database schema definition
│
├── src/
│   ├── app/                  # Next.js App Router (pages/routes)
│   │   ├── api/              # API routes
│   │   │   └── inngest/      # Inngest webhook endpoint
│   │   ├── projects/         # Project routes
│   │   │   └── [projectId]/  # Dynamic route: /projects/:id
│   │   │       ├── layout.tsx
│   │   │       └── page.tsx
│   │   ├── layout.tsx        # Root layout (providers wrapper)
│   │   └── page.tsx          # Home page (/)
│   │
│   ├── components/           # Shared/global components
│   │   ├── ui/              # shadcn UI components (button, dialog, etc.)
│   │   ├── providers.tsx    # Clerk + Convex + Theme providers
│   │   └── theme-provider.tsx
│   │
│   ├── features/             # Feature-based modules (domain logic)
│   │   ├── auth/            # Authentication feature
│   │   │   └── components/
│   │   │       ├── auth-loading-view.tsx
│   │   │       └── unauthenticated-view.tsx
│   │   │
│   │   └── projects/        # Projects feature (main feature)
│   │       ├── components/
│   │       │   ├── file-explorer/     # File tree UI
│   │       │   │   ├── index.tsx      # FileExplorer root
│   │       │   │   ├── tree.tsx       # Tree recursive component
│   │       │   │   ├── tree-item-wrapper.tsx
│   │       │   │   ├── create-input.tsx
│   │       │   │   ├── loading-row.tsx
│   │       │   │   └── constants.ts
│   │       │   ├── navbar.tsx
│   │       │   ├── project-id-layout.tsx
│   │       │   ├── project-id-view.tsx
│   │       │   ├── project-view.tsx
│   │       │   ├── projects-command-dialog.tsx
│   │       │   └── projects-list.tsx
│   │       └── hooks/
│   │           ├── use-files.ts
│   │           └── use-projects.ts
│   │
│   ├── hooks/                # Shared React hooks
│   │   └── use-mobile.ts
│   │
│   ├── inngest/              # Inngest background job setup
│   │   ├── client.ts         # Inngest client initialization
│   │   └── functions.ts      # Job definitions (AI generation, etc.)
│   │
│   ├── lib/                  # Utility/library files
│   │   ├── utils.ts          # cn() helper, etc.
│   │   └── firecrawl.ts      # Firecrawl client setup
│   │
│   └── declaration.d.ts      # TypeScript declarations
│
├── public/                   # Static assets
├── .env.local               # Environment variables (Convex URL, Clerk keys)
├── package.json
├── tsconfig.json
├── next.config.ts           # Next.js config (Sentry integration)
├── sentry.server.config.ts  # Sentry server config
├── sentry.edge.config.ts    # Sentry edge config
└── components.json          # shadcn config
```

---

## Architecture & Design Principles

### 1. Feature-Based Architecture

The project follows a **feature-based organization** pattern:

```
src/features/
├── auth/           # Authentication concerns
│   └── components/ # UI components specific to auth
└── projects/       # Project management concerns
    ├── components/ # UI components specific to projects
    └── hooks/      # React hooks specific to projects
```

**Why?** Each feature is self-contained with its own components and hooks. This makes it easy to:
- Find related code
- Remove a feature without breaking others
- Scale the app by adding new features

### 2. Convex as Backend (BaaS)

Instead of a traditional Express/Fastify backend, this project uses **Convex** - a serverless database with real-time subscriptions.

**Key Concepts:**
- `convex/schema.ts` - Defines your database tables (like SQL migrations)
- `convex/projects.ts` - Contains `query` (read) and `mutation` (write) functions
- `convex/files.ts` - Same pattern for file operations
- `convex/_generated/` - Auto-generated types and API client

**Flow:**
```
React Component → useQuery(api.projects.get) → Convex Server → Database
React Component → useMutation(api.projects.create) → Convex Server → Database
```

### 3. Authentication Flow

```
User → Clerk Login → JWT Token → Convex Provider → Authenticated API calls
```

- `providers.tsx` wraps the app with `ClerkProvider` and `ConvexProviderWithClerk`
- `convex/auth.config.ts` tells Convex to trust Clerk JWTs
- `convex/auth.ts` provides `verifyAuth()` helper to protect queries/mutations

### 4. Real-Time Data with Optimistic Updates

The hooks in `use-projects.ts` use **optimistic updates**:

```typescript
export const useCreateProject = () => {
  return useMutation(api.projects.create).withOptimisticUpdate(
    (localStore, args) => {
      // Immediately update UI before server confirms
      const existingProjects = localStore.getQuery(api.projects.get);
      if (existingProjects !== undefined) {
        localStore.setQuery(api.projects.get, {}, [
          { ...newProject },  // Add fake project instantly
          ...existingProjects,
        ]);
      }
    },
  );
};
```

**Why?** Users see instant feedback while the actual save happens in the background.

### 5. File Explorer (Tree Structure)

The file system is stored as a **flat table with parent references**:

```
files table:
┌─────────┬───────────┬──────────┬────────────────┐
│ id      │ parentId  │ type     │ name           │
├─────────┼───────────┼──────────┼────────────────┤
│ file_1  │ null      │ folder   │ src            │
│ file_2  │ file_1    │ file     │ index.ts       │
│ file_3  │ file_1    │ folder   │ components     │
│ file_4  │ file_3    │ file     │ Button.tsx     │
└─────────┴───────────┴──────────┴────────────────┘
```

**Recursive rendering:**
- `FileExplorer` → loads root files (parentId = null)
- `Tree` component → if folder, loads children with `useFolderContents`
- Each `Tree` renders its children recursively

### 6. Route Structure (Next.js App Router)

```
/                           → Home page (ProjectsView)
/projects/[projectId]       → Project workspace
  ├── layout.tsx            → ProjectIdLayout (navbar + split pane)
  └── page.tsx              → ProjectIdView (file explorer + editor + preview)
```

**Layout Hierarchy:**
```
RootLayout (providers.tsx)
  └── /projects/[projectId]/layout.tsx (ProjectIdLayout)
        ├── Navbar
        └── Allotment (split panes)
            ├── Sidebar (conversation - placeholder)
            └── Main
                └── ProjectIdView
                    ├── Tab bar (Code/Preview)
                    └── Allotment
                        ├── FileExplorer
                        └── Editor (placeholder)
```

---

## Data Flow Diagrams

### 1. Creating a Project

```
User clicks "New" button
        ↓
useCreateProject() mutation called
        ↓
Optimistic update: UI shows new project immediately
        ↓
Convex server: inserts into "projects" table
        ↓
Real-time subscription: all clients see the update
```

### 2. Loading Files in Explorer

```
FileExplorer mounts
        ↓
useFolderContents({ projectId }) called
        ↓
Convex query: getFiles by projectId
        ↓
Returns flat list of files
        ↓
Filter: only root files (parentId === undefined)
        ↓
Render each with <Tree /> component
        ↓
When folder clicked → useFolderContents({ parentId: folderId })
        ↓
Load and render children recursively
```

### 3. Background Job (Inngest)

```
UI triggers event: inngest.send("test/gemini.generate", { prompt })
        ↓
Inngest receives event via /api/inngest endpoint
        ↓
executeFunction runs:
  1. step.run("extract-urls") - parse URLs from prompt
  2. step.run("scrape-urls") - Firecrawl scrapes each URL
  3. step.run("generate-text") - Gemini generates response
        ↓
Each step is retried on failure, logged to Sentry
```

---

## Key Files to Understand

| File | Why It Matters |
|------|---------------|
| `convex/schema.ts` | Your database structure - READ THIS FIRST |
| `convex/projects.ts` | Example of query/mutation pattern |
| `convex/files.ts` | Complex CRUD with recursive delete |
| `src/components/providers.tsx` | App initialization & auth setup |
| `src/features/projects/hooks/use-projects.ts` | How to use Convex with optimistic updates |
| `src/features/projects/components/file-explorer/tree.tsx` | Recursive component pattern |
| `src/inngest/functions.ts` | Background job with AI integration |

---

## Current State / TODO

Based on `notes.md`:
- [ ] How to trigger Inngest functions from UI

**Incomplete features (placeholder UI):**
- Editor view (just shows "Editor view" text)
- Preview view (just shows "Preview for {projectId}" text)
- Conversation sidebar (just shows "conversation sidebar" text)
- GitHub import functionality (button exists but onClick is empty)
- File double-click to open in editor

---

## Common Patterns You'll See

### 1. Convex Query Hook
```typescript
const projects = useQuery(api.projects.get);           // Returns T[] | undefined
const project = useQuery(api.projects.getById, { id }); // Returns T | undefined
```

### 2. Convex Mutation Hook
```typescript
const createProject = useMutation(api.projects.create);
createProject({ name: "my-project" }); // Returns promise
```

### 3. Conditional Query
```typescript
const contents = useFolderContents({
  projectId,
  parentId,
  enabled: isOpen,  // Only fetch when expanded
});
// Returns T[] | undefined (undefined while loading or disabled)
```

### 4. Feature Component Structure
```
feature/
├── components/      # UI components
│   ├── feature-view.tsx      # Main view
│   └── feature-item.tsx      # Sub-components
└── hooks/           # Business logic
    └── use-feature.ts        # Custom hooks
```

---

## Development Commands

```bash
npm run dev      # Start Next.js dev server
npm run build    # Production build
npm run lint     # Run ESLint
```

---

## Environment Variables Needed

```env
# Convex
NEXT_PUBLIC_CONVEX_URL=

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=
CLERK_SECRET_KEY=

# Sentry
SENTRY_DSN=

# Firecrawl (for Inngest functions)
FIRECRAWL_API_KEY=
```

---

## Quick Reference: Where Is What?

| I want to... | Look at... |
|-------------|-----------|
| Add a new database table | `convex/schema.ts` |
| Add a new API endpoint | `convex/*.ts` (create new file) |
| Add a new page/route | `src/app/` folder |
| Add a new UI component | `src/components/ui/` |
| Add a new feature | `src/features/` (create new folder) |
| Add a background job | `src/inngest/functions.ts` |
| Modify the file tree UI | `src/features/projects/components/file-explorer/` |
| Change auth behavior | `convex/auth.config.ts` + `src/components/providers.tsx` |
