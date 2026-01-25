"use client";

import { useLaunchParams } from "@telegram-apps/sdk-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const [userName, setUserName] = useState("");

  const [counter, setCounter] = useState(0);

  const data = useLaunchParams(true);
  
  useEffect(() => {
    setUserName(data.tgWebAppData?.user?.firstName ?? "");
  }, [data]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <main className="flex flex-col gap-4 items-center justify-center">
        <h3>Hello {userName}!</h3>
        <Button variant="outline" onClick={() => setCounter(counter + 1)}>
          Clicked: {counter}
        </Button>
      </main>
    </div>
  );
}
