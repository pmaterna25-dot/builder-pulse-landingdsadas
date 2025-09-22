import React, { useState, useRef } from "react";

type Item = { label: string; description: string; link: string; fileName: string; color?: 'green' | 'blue' | 'amber'; selectedSlot?: 'left' | 'mid' | 'right' | null };

type Props = { mode?: 'home' | 'settings'; editable?: boolean; items?: Item[]; setItems?: React.Dispatch<React.SetStateAction<Item[]>> };

export default function AppWindow({ mode = 'home', editable = true, items: itemsProp, setItems: setItemsProp }: Props) {
  const [localItems, setLocalItems] = useState<Item[]>(() =>
    Array.from({ length: 40 }, () => ({ label: "Za co odpowiada ten box — krótki opis.", description: "", link: "", fileName: "", color: 'blue' }))
  );

  const items = itemsProp ?? localItems;
  const setItems = setItemsProp ?? setLocalItems;

  const [confirmIndex, setConfirmIndex] = useState<number | null>(null);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const [hoveredKey, setHoveredKey] = useState<string | null>(null);
  const [tooltipIndex, setTooltipIndex] = useState<number | null>(null);
  const hoverTimer = useRef<number | null>(null);

  const truncatePreview = (val?: string, length = 8) => {
    if (!val) return "";
    return val.length > length ? `${val.slice(0, length)}...` : val;
  };

  const handleChange = (idx: number, field: keyof Item, value: string) => {
    // enforce label max length 30
    if (field === 'label') {
      value = value.slice(0, 30);
    }

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

  const setColor = (idx: number, color: Item['color']) => {
    setItems((prev) => {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], color };
      return copy;
    });
  };

  const bgFor = (color?: Item['color']) => {
    switch (color) {
      case 'green':
        return 'bg-gradient-to-br from-green-50 to-green-200 animate-pulse';
      case 'amber':
        return 'bg-gradient-to-br from-amber-50 to-amber-200 animate-pulse';
      case 'blue':
      default:
        return 'bg-gradient-to-br from-blue-50 to-blue-200 animate-pulse';
    }
  };

  const onCircleEnter = (idx: number, slot: string) => {
    setHoveredKey(`${idx}-${slot}`);
    if (hoverTimer.current) window.clearTimeout(hoverTimer.current as number);
    hoverTimer.current = window.setTimeout(() => setTooltipIndex(idx), 700) as unknown as number;
  };

  const onCircleLeave = () => {
    setHoveredKey(null);
    if (hoverTimer.current) {
      window.clearTimeout(hoverTimer.current as number);
      hoverTimer.current = null;
    }
    setTooltipIndex(null);
  };

  const onCircleClick = (idx: number, slot: 'left' | 'mid' | 'right') => {
    // Only selectable on home (non-editable) per requirement
    if (editable) return;
    setItems((prev) => {
      const copy = prev.slice();
      const current = copy[idx].selectedSlot === slot ? null : slot;
      copy[idx] = { ...copy[idx], selectedSlot: current };
      return copy;
    });
  };

  const [search, setSearch] = useState<string>("");
  const entries = items.map((item, idx) => ({ item, idx }));
  const filtered = entries.filter(({ item, idx }) => {
    const q = (search || "").trim().toLowerCase();
    if (!q) return true;
    return (
      (item.label || "").toLowerCase().includes(q) ||
      (item.description || "").toLowerCase().includes(q) ||
      (item.link || "").toLowerCase().includes(q) ||
      (item.fileName || "").toLowerCase().includes(q) ||
      (`pozycja ${idx + 1}`).includes(q)
    );
  });

  return (
    <div className="w-[1100px] h-[700px] bg-white rounded shadow-xl">
      <div className="w-full h-full bg-white p-6">
        <div className="flex h-full gap-6">
          <div className="w-[480px] flex flex-col gap-4 min-h-0">
            <div aria-hidden className="h-14 border-2 border-slate-800 bg-white" />

            <div className="mb-2 px-2 w-full">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35" />
                </svg>
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Szukaj pozycji..." className="flex-1 border rounded px-2 py-1 text-sm" />
              </div>
            </div>

            <div className="flex-1 border-2 border-slate-800 bg-white p-2 min-h-0">
              {(mode === 'settings' || mode === 'home') ? (
                <div className="h-full overflow-y-auto pr-2 min-w-0">
                  {filtered.map(({item, idx}) => (
                    <div key={idx} className={`mb-3 border rounded p-3 min-h-[100px] relative ${bgFor(item.color)}`}>
                      <div className="flex flex-col items-center">
                        <div className="flex items-center gap-3">
                          <div className="text-sm font-medium text-slate-700">Pozycja {idx + 1}</div>
                          {editingIndex === idx ? (
                            <>
                              <input
                                value={item.label}
                                onChange={(e) => handleChange(idx, 'label', e.target.value)}
                                className="text-sm border rounded px-2 py-1 w-64 text-center"
                                placeholder="Nazwa pozycji"
                                maxLength={30}
                              />
                              <div className="flex items-center gap-2 ml-3">
                                <button aria-label="green" onClick={() => setColor(idx, 'green')} className="w-6 h-6 rounded-full bg-green-500 ring-2 ring-white shadow-sm" />
                                <button aria-label="blue" onClick={() => setColor(idx, 'blue')} className="w-6 h-6 rounded-full bg-blue-500 ring-2 ring-white shadow-sm" />
                                <button aria-label="amber" onClick={() => setColor(idx, 'amber')} className="w-6 h-6 rounded-full bg-amber-400 ring-2 ring-white shadow-sm" />
                              </div>
                            </>
                          ) : (
                            <div className="text-xs text-slate-500">{(item.label || 'Za co odpowiada ten box — krótki opis.').slice(0,30)}</div>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-3 mt-3 min-w-0">
                        {/* Left card */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/80 rounded-lg shadow-md p-3 h-full flex flex-col items-center justify-center text-center">
                            <div onMouseEnter={() => onCircleEnter(idx, 'left')} onMouseLeave={onCircleLeave} onClick={() => onCircleClick(idx, 'left')} className={`${items[idx].selectedSlot==='left' && mode==='home' ? 'rainbow-circle text-white' : 'bg-blue-500'} rounded-full p-2 mb-2 inline-flex ${hoveredKey===`${idx}-left`? 'scale-105 shadow-lg' : ''}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2h-3l-2-2H9L7 5H4a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            {editingIndex === idx ? (
                              <textarea
                                value={item.description}
                                onChange={(e) => handleChange(idx, 'description', e.target.value)}
                                className="w-full h-12 border rounded px-2 py-1 text-sm resize-none"
                                placeholder={`Opis umowy dla pozycji ${idx + 1}`}
                              />
                            ) : (
                              <>
                                <div className="font-medium text-sm">Pozycja {idx + 1}</div>
                                <div className="text-xs text-slate-500 mt-1">{truncatePreview(item.description, 8) || 'opis umowy'}</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Middle card */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/80 rounded-lg shadow-md p-3 h-full flex flex-col items-center justify-center text-center">
                            <div onMouseEnter={() => onCircleEnter(idx, 'mid')} onMouseLeave={onCircleLeave} onClick={() => onCircleClick(idx, 'mid')} className={`${items[idx].selectedSlot==='mid' && mode==='home' ? 'rainbow-circle text-white' : 'bg-green-500'} rounded-full p-2 mb-2 inline-flex ${hoveredKey===`${idx}-mid`? 'scale-105 shadow-lg' : ''}`}>
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 14.828a4 4 0 010-5.656L15 7.999m-6 8l1.172-1.172a4 4 0 005.656 0L19 13.657" />
                              </svg>
                            </div>
                            {editingIndex === idx ? (
                              <input
                                value={item.link}
                                onChange={(e) => handleChange(idx, 'link', e.target.value)}
                                className="w-full border rounded px-2 py-1 text-sm text-center"
                                placeholder={`https://`}
                              />
                            ) : (
                              <>
                                <div className="font-medium text-sm text-green-600">link do OWU</div>
                                <div className="text-xs text-slate-500 mt-1 break-all">{truncatePreview(item.link, 8) || 'https://...'}</div>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Right card */}
                        <div className="flex-1 min-w-0">
                          <div className="bg-white/80 rounded-lg shadow-md p-3 h-full flex flex-col items-center justify-center text-center">
                            <label onMouseEnter={() => onCircleEnter(idx)} onMouseLeave={onCircleLeave} className="relative inline-block">
                              <input
                                type="file"
                                onChange={(e) => handleFileChange(idx, e.target.files && e.target.files[0])}
                                disabled={!editable || editingIndex !== idx}
                                className={`absolute inset-0 w-full h-full opacity-0 ${(editable && editingIndex === idx) ? 'cursor-pointer' : 'pointer-events-none'}`}
                              />
                              <div onClick={() => onCircleClick(idx, 'right')} className={`${items[idx].selectedSlot==='right' && mode==='home' ? 'rainbow-circle text-white' : 'bg-amber-400'} rounded-full p-2 mb-2 inline-flex ${hoveredKey===`${idx}-right`? 'scale-105 shadow-lg' : ''}`}>
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1M12 12v9m0-9l3 3m-3-3L9 15" />
                                </svg>
                              </div>
                            </label>
                            <div className="mt-2">
                              <div className="font-medium text-sm">wybierz plik</div>
                              <div className="mt-2 text-xs text-slate-500">{item.fileName}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Edit button bottom-right */}
                      <div className="absolute bottom-3 right-3 flex items-center gap-2">
                        {editingIndex === idx ? (
                          <>
                            <button onClick={() => setEditingIndex(null)} className="px-3 py-1 bg-slate-200 rounded text-sm">Zakończ</button>
                            <button onClick={() => { setEditingIndex(null); setConfirmIndex(null); }} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Zapisz</button>
                          </>
                        ) : (
                          <>
                            {editable ? <button onClick={() => setConfirmIndex(idx)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Edycja</button> : null}
                          </>
                        )}
                      </div>

                      {/* Confirmation popover */}
                      {confirmIndex === idx && editable && (
                        <div className="absolute bottom-12 right-3 bg-white border rounded shadow p-3 w-40 text-center">
                          <div className="text-sm mb-2">Czy chcesz edytować?</div>
                          <div className="flex justify-between gap-2">
                            <button onClick={() => { setEditingIndex(idx); setConfirmIndex(null); }} className="flex-1 px-2 py-1 bg-green-600 text-white rounded">Tak</button>
                            <button onClick={() => setConfirmIndex(null)} className="flex-1 px-2 py-1 bg-slate-200 rounded">Nie</button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div aria-hidden className="h-full bg-white" />
              )}
            </div>

            <div aria-hidden className="h-14 border-2 border-slate-800 bg-white" />
          </div>

          {filtered.length > 0 ? <div aria-hidden className="flex-1 border-2 border-slate-800 bg-white min-w-0" /> : null}
        </div>
      </div>
    </div>
  );
}
