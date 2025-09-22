import { DemoResponse } from "@shared/api";
import { useEffect, useState } from "react";
import AppWindow from "@/components/ui/AppWindow";
import type { DemoResponse } from "@shared/api";

export default function Index() {
  const [exampleFromServer, setExampleFromServer] = useState("");
  const [tab, setTab] = useState<'home' | 'settings'>('home');

  const [items, setItems] = useState(() => Array.from({ length: 40 }, () => ({ label: "Za co odpowiada ten box — krótki opis.", description: "", link: "", fileName: "", color: 'blue' })));

  // Fetch users on component mount
  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;
    fetchDemo();
  }, []);

  // Example of how to fetch data from the server (if needed)
  const fetchDemo = async () => {
    const setError = (msg: string) => setExampleFromServer(msg);

    try {
      const response = await fetch('/api/demo', { cache: 'no-store' });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = (await response.json()) as DemoResponse;
      setExampleFromServer(data.message);
      return;
    } catch (err) {
      // Try a direct Netlify function path as a fallback
      try {
        const alt = await fetch('/.netlify/functions/api/demo', { cache: 'no-store' });
        if (alt.ok) {
          const data = (await alt.json()) as DemoResponse;
          setExampleFromServer(data.message);
          return;
        }
      } catch (e) {
        // ignore
      }

      // Final fallback: use a friendly local message without throwing
      setError('Tryb offline — brak dostępu do /api/demo');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center app-background">
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
        <AppWindow mode={tab} editable={tab === 'settings'} items={items} setItems={setItems} />
      </div>
    </div>
  );
}
