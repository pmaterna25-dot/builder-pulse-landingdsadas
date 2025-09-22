import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";
import AppWindow from "@/components/ui/AppWindow";
import type { DemoResponse } from "@shared/api";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  // Fetch users on component mount
  useEffect(() => {
    fetchDemo();
  }, []);

  // Example of how to fetch data from the server (if needed)
  const fetchDemo = async () => {
    try {
      const response = await fetch("/api/demo");
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
    } catch (error) {
      console.error("Error fetching hello:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-3">
          <button className="px-4 py-2 bg-slate-800 text-white rounded">Główna strona</button>
          <button className="px-4 py-2 bg-white border border-slate-300 text-slate-800 rounded">Ustawienia</button>
        </div>
        <AppWindow />
      </div>
    </div>
  );
}
