import React, { useState } from "react";

type Props = { mode?: 'home' | 'settings' };

export default function AppWindow({ mode = 'home' }: Props) {
  type Item = { description: string; link: string; fileName: string };
  const [items, setItems] = useState<Item[]>(() =>
    Array.from({ length: 40 }, () => ({ description: "", link: "", fileName: "" }))
  );

  const handleChange = (idx: number, field: keyof Item, value: string) => {
    setItems((prev) => {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleFileChange = (idx: number, file?: File | null) => {
    setItems((prev) => {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], fileName: file ? file.name : "" };
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
                  {items.map((item, idx) => (
                    <div key={idx} className="mb-3 border rounded p-2 bg-white">
                      <div className="mb-2 text-sm font-medium text-slate-700">Pozycja {idx + 1}</div>
                      <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Opis umowy</label>
                          <input
                            value={item.description}
                            onChange={(e) => handleChange(idx, 'description', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                            placeholder={`Opis umowy dla pozycji ${idx + 1}`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Link do OWU</label>
                          <input
                            value={item.link}
                            onChange={(e) => handleChange(idx, 'link', e.target.value)}
                            className="w-full border rounded px-2 py-1 text-sm"
                            placeholder={`https://`}
                          />
                        </div>

                        <div>
                          <label className="block text-xs text-slate-600 mb-1">Plik do pobrania</label>
                          <div className="flex items-center gap-2">
                            <input
                              type="file"
                              onChange={(e) => handleFileChange(idx, e.target.files && e.target.files[0])}
                              className="text-xs"
                            />
                            <span className="text-xs text-slate-500">{item.fileName}</span>
                          </div>
                        </div>
                      </div>
                      <p className="text-xs text-slate-500 mt-2">Za co odpowiada ten box — krótki opis.</p>
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
