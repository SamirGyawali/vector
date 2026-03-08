"use client";

import { useMutation, useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const x = () => {
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

export default x;
