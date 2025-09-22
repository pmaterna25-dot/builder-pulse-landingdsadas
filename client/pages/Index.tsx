import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";
import AppWindow from "@/components/ui/AppWindow";
import type { DemoResponse } from "@shared/api";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  const [tab, setTab] = useState<'home' | 'settings'>('home');

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
      setExampleFromServer("Błąd połączenia z serwerem");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="flex flex-col items-center gap-6">
        <div className="flex gap-3">
          <button
            onClick={() => setTab('home')}
            className={`px-4 py-2 rounded ${tab === 'home' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800'}`}>
            Główna strona
          </button>
          <button
            onClick={() => setTab('settings')}
            className={`px-4 py-2 rounded ${tab === 'settings' ? 'bg-slate-800 text-white' : 'bg-white border border-slate-300 text-slate-800'}`}>
            Ustawienia
          </button>
        </div>
        <AppWindow mode={tab} />
      </div>
    </div>
  );
}
