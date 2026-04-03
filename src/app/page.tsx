"use client";

import { ProjectsView } from "@/features/projects/components/project-view";


const Home = () => {

  return (
    <div className="flex flex-col gap-3">
      <ProjectsView />
    </div>
  );
};

export default Home;
