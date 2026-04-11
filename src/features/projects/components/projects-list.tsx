import { useProjectsPartial } from "@/features/projects/hooks/use-projects";
import { Spinner } from "../../../components/ui/spinner";
import { Kbd } from "../../../components/ui/kbd";
import { Doc } from "../../../../convex/_generated/dataModel";
import Link from "next/link";
import {
  AlertCircleIcon,
  ArrowRight,
  GlobeIcon,
  Loader2Icon,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { FaGithub } from "react-icons/fa";
import { Button } from "../../../components/ui/button";

interface ProjectListProps {
  onViewAll: () => void;
}

function formatTimestamp(timestamp: number) {
  return formatDistanceToNow(new Date(timestamp), {
    addSuffix: true,
  });
}

const getProjectIcon = (project: Doc<"projects">) => {
  if (project.importStatus === "completed") {
    return <FaGithub className="size-3.5 text-muted-foreground" />;
  }

  if (project.importStatus === "failed") {
    return (
      <AlertCircleIcon className="size-3.5 text-yellow-500 animate-pulse" />
    );
  }

  if (project.importStatus === "importing") {
    return (
      <Loader2Icon className="size-3.5 text-muted-foreground animate-spin" />
    );
  }

  return <GlobeIcon className="size-3.5" />;
};

const ContinueCard = ({ data }: { data: Doc<"projects"> }) => {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-xs text-muted-foreground">Last Updated</span>
      <Button
        variant="outline"
        asChild
        className="h-auto items-start justify-start p-4 bg-background border rounded-none flex flex-col gap-2"
      >
        <Link href={`/projects/${data._id}`} className="group">
          <div className="flex items-center justify-between w-full">
            <div className="flex flex-col gap-2 items-start">
              <div className="flex items-center gap-2">
                {getProjectIcon(data)}
                <span className="font-medium truncate">{data.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(data.updatedAt)}
              </span>
            </div>
            <div>
              <ArrowRight className="text-xs text-muted-foreground group-hover:translate-x-0.5 transition-transform" />
            </div>
          </div>
        </Link>
      </Button>
    </div>
  );
};

const ProjectItem = ({ data }: { data: Doc<"projects"> }) => (
  <Link
    href={`/projects/${data._id}`}
    className="text-sm text-foreground/60 font-medium hover:text-foreground py-1 flex items-center justify-between w-full group"
  >
    <div className="flex items-center gap-2">
      {getProjectIcon(data)}
      <span>{data.name}</span>
    </div>
    <span className="text-xs text-muted-foreground">
      {formatTimestamp(data.updatedAt)}
    </span>
  </Link>
);

export const ProjectsList = ({ onViewAll }: ProjectListProps) => {
  const projects = useProjectsPartial(6);
  if (projects === undefined) {
    return <Spinner className="size-4 text-ring" />;
  }
  const [mostRecent, ...rest] = projects;
  return (
    <div className="flex flex-col gap-4">
      <div>{mostRecent ? <ContinueCard data={mostRecent} /> : null}</div>
      {rest.length > 0 && (
        <>
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">
              Recent Projects
            </span>
            <button
              onClick={onViewAll}
              className="flex items-center gap-2 text-muted-foreground text-xs hover:text-foreground transition-colors"
            >
              <span>View all</span>
              <Kbd className="bg-accent border">Ctrl+K</Kbd>
            </button>
          </div>
          <ul>
            {projects.map((project) => (
              <ProjectItem key={project._id} data={project} />
            ))}
          </ul>
        </>
      )}
    </div>
  );
};
