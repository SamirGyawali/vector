"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import * as Sentry from "@sentry/nextjs";

const DemoPage = () => {
  const { userId } = useAuth();

  const projects = useQuery(api.projects.get);
  const createProject = useMutation(api.projects.create);

  const [loading, setLoading] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const handleBlocking = async () => {
    setLoading(true);
    await fetch("/api/demo/blocking", { method: "POST" });
    setLoading(false);
  };

  const handleBackground = async () => {
    setLoading2(true);
    await fetch("/api/demo/background", { method: "POST" });
    setLoading2(false);
  };

  const handleClientError = async () => {
    // this is inside the logs in sentry
    Sentry.logger.info("User attempting to click on client function", {
      userId,
    });
    throw new Error("Client error: Something went wrong in browser!");
  };

  const handleAPIError = async () => {
    await fetch("/api/demo/error", { method: "POST" });
  };

  const handleInngestError = async () => {
    await fetch("/api/demo/inngest-error", { method: "POST" });
  };

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <Button
          onClick={() =>
            createProject({
              name: "New project123",
            })
          }
        >
          Add new
        </Button>

        <Button disabled={loading} onClick={handleBlocking}>
          {loading ? "Loading..." : "Blocking Job"}
        </Button>
        <Button disabled={loading2} onClick={handleBackground}>
          {loading2 ? "Loading..." : "Background Job"}
        </Button>
        <Button variant="destructive" onClick={handleClientError}>
          Client Error
        </Button>
        <Button variant="destructive" onClick={handleAPIError}>
          Server Error
        </Button>
        <Button variant="destructive" onClick={handleInngestError}>
          Inngest Error
        </Button>
      </div>
      {projects?.map((project) => (
        <div key={project._id}>
          <p>{project.name}</p>
          <p>{project.ownerId}</p>
        </div>
      ))}
    </div>
  );
};

export default DemoPage;
