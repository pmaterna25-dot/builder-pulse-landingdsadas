import React, { useState } from "react";

type Props = { mode?: 'home' | 'settings' };

export default function AppWindow({ mode = 'home' }: Props) {
  const [items, setItems] = useState<string[]>(() => Array(40).fill(""));

  const handleChange = (idx: number, value: string) => {
    setItems((prev) => {
      const copy = [...prev];
      copy[idx] = value;
      return copy;
    });
  };

  return (
    <div className="w-[1100px] h-[700px] bg-white rounded shadow-xl">
      <div className="w-full h-full bg-white p-6">
        <div className="flex h-full gap-6">
          <div className="w-1/3 flex flex-col gap-4 min-h-0">
            <div aria-hidden className="h-20 border-2 border-slate-800 bg-white" />

            <div className="flex-1 border-2 border-slate-800 bg-white p-2 min-h-0">
              {mode === 'settings' ? (
                <div className="h-full overflow-y-auto pr-2">
                  {items.map((val, idx) => (
                    <div key={idx} className="mb-3">
                      <label className="block text-sm font-medium text-slate-700 mb-1">Pozycja {idx + 1}</label>
                      <input
                        value={val}
                        onChange={(e) => handleChange(idx, e.target.value)}
                        className="w-full border rounded px-2 py-1 text-sm"
                        placeholder={`Opis pozycji ${idx + 1}`}
                      />
                      <p className="text-xs text-slate-500 mt-1">Za co odpowiada ten box — krótki opis.</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div aria-hidden className="h-full bg-white" />
              )}
            </div>

            <div aria-hidden className="h-20 border-2 border-slate-800 bg-white" />
          </div>

          <div aria-hidden className="flex-1 border-2 border-slate-800 bg-white" />
        </div>
      </div>
    </div>
  );
}
