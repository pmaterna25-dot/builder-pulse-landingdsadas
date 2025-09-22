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
          <div className="w-[480px] flex flex-col gap-4 min-h-0">
            <div aria-hidden className="h-20 border-2 border-slate-800 bg-white" />

            <div className="flex-1 border-2 border-slate-800 bg-white p-2 min-h-0">
              {mode === 'settings' ? (
                <div className="h-full overflow-y-auto pr-2 min-w-0">
                  {items.map((item, idx) => (
                    <div key={idx} className="mb-3 border rounded p-4 bg-white min-h-[150px]">
                      <div className="flex items-start justify-between">
                        <div className="text-sm font-medium text-slate-700">Pozycja {idx + 1}</div>
                        <div className="text-xs text-slate-500 max-w-[65%] text-right">Za co odpowiada ten box — krótki opis.</div>
                      </div>

                      <div className="flex gap-3 mt-3">
                        <div className="flex-1">
                          <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col items-center justify-center text-center">
                            <div className="bg-blue-500 rounded-full p-3 mb-3 inline-flex">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3l-2-2H9L7 5H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div className="font-medium text-sm">Pozycja {idx + 1}</div>
                            <div className="text-xs text-slate-500 mt-1">{item.description || 'opis umowy'}</div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col items-center justify-center text-center">
                            <div className="bg-green-500 rounded-full p-3 mb-3 inline-flex">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 14.828a4 4 0 010-5.656L15 7.999m-6 8l1.172-1.172a4 4 0 005.656 0L19 13.657" />
                              </svg>
                            </div>
                            <div className="font-medium text-sm text-green-600">link do OWU</div>
                            <div className="text-xs text-slate-500 mt-1 break-all">{item.link || 'https://...'}</div>
                          </div>
                        </div>

                        <div className="flex-1">
                          <div className="bg-white rounded-lg shadow-md p-4 h-full flex flex-col items-center justify-center text-center">
                            <div className="bg-amber-400 rounded-full p-3 mb-3 inline-flex">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12v9m0-9l3 3m-3-3L9 15" />
                              </svg>
                            </div>
                            <div className="font-medium text-sm">wybierz plik</div>
                            <div className="mt-2">
                              <input type="file" onChange={(e) => handleFileChange(idx, e.target.files && e.target.files[0])} className="text-xs" />
                            </div>
                            <div className="mt-2 text-xs text-slate-500">{item.fileName}</div>
                          </div>
                        </div>
                      </div>
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
