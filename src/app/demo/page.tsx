"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function DemoPage() {
  const [data, setData] = useState<string | null>("");

  const handleClick = async () => {
    const res = await fetch("/api/demo/blocking", { method: "POST" });
    const textData = await res.text();
    setData(textData);
  };

  return (
    <div className="p-8 space-x-4">
      <Button onClick={handleClick}>Generate Text</Button>
      {data ? <p>{data}</p> : ""}
    </div>
  );
}
