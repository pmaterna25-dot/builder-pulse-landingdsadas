import React, { useState, useRef, useEffect } from "react";

type Item = { label: string; description: string; link: string; fileName: string; fileId?: string; color?: 'green' | 'blue' | 'amber'; selectedSlots?: ('left'|'mid'|'right')[]; umowaWystepujacaPrzy?: boolean; tags?: string[]; umowaWystepujacaPrzyRef?: number | null };

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

  // Generated editor text (right-side panel)
  const [generatedText, setGeneratedText] = useState<string>("");
  const generatedRef = useRef<HTMLTextAreaElement | null>(null);

  const generateFromSelections = () => {
    const selected = items.map((it, idx) => ({ ...it, idx })).filter((it) => it.selectedSlots && it.selectedSlots.length > 0);
    if (selected.length === 0) {
      setGeneratedText("Brak zaznaczonych elementów.");
      generatedRef.current?.focus();
      return;
    }

    const parts = selected.map(({ label, selectedSlots, description, link, fileName }) => {
      const title = (label || 'Bez nazwy').trim();
      const lines: string[] = [];
      lines.push(title);
      // Always put description first if selected
      const hasDesc = selectedSlots?.includes('left');
      const hasOwu = selectedSlots?.includes('mid');
      if (hasDesc) {
        lines.push(description || '(brak)');
      }
      // Add blank line before OWU for visual separation when description exists
      if (hasOwu) {
        if (hasDesc) lines.push('');
        // prefix two spaces for indentation
        lines.push(`  OWU: ${link || '(brak)'}`);
      }
      // File info last
      if (selectedSlots?.includes('right')) {
        lines.push(`Plik: ${fileName || '(brak)'}`);
      }
      return lines.join('\n');
    });

    setGeneratedText(parts.join('\n\n'));
    setTimeout(() => generatedRef.current?.focus(), 50);
  };

  // Stored files (persisted in localStorage as base64 data URLs)
  type SavedFile = { id: string; name: string; dataUrl: string; mime: string; createdAt: number };
  const [savedFiles, setSavedFiles] = useState<SavedFile[]>(() => {
    try {
      const raw = localStorage.getItem('app_files_v1');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });
  const [folderOpen, setFolderOpen] = useState<boolean>(false);

  useEffect(() => {
    try {
      localStorage.setItem('app_files_v1', JSON.stringify(savedFiles));
    } catch (e) {}
  }, [savedFiles]);

  // Packages (bundles) saved in the app
  type SavedPackage = { id: string; name: string; createdAt: number; selectedIndices: number[]; generatedText: string; fileIds: string[] };
  const [packageName, setPackageName] = useState<string>("");
  const [savedPackages, setSavedPackages] = useState<SavedPackage[]>(() => {
    try {
      const raw = localStorage.getItem('app_packages_v1');
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('app_packages_v1', JSON.stringify(savedPackages));
    } catch (e) {}
  }, [savedPackages]);

  const savePackage = (name?: string) => {
    const sel = items.map((it, idx) => ({ it, idx })).filter(({ it }) => it.selectedSlots && it.selectedSlots.length > 0).map(({ idx }) => idx);
    const pkgName = (name || packageName || `package_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}` ).trim();
    const fileIds = items.filter((it) => it.selectedSlots && it.selectedSlots.includes('right') && it.fileId).map((it) => it.fileId as string).filter(Boolean) as string[];

    // Validate: umowaDodatkowaLuxmed requires umowaWystepujacaPrzy on the same item
    const invalid = sel.filter((i) => {
      const it = items[i];
      const hasLuxmed = (it.tags || []).some((t) => (t || '').toLowerCase() === 'luxmed');
      if (!hasLuxmed) return false;
      // valid if same item has base contract
      if (it.umowaWystepujacaPrzy) return false;
      // or valid if reference points to an item with base contract
      const ref = typeof it.umowaWystepujacaPrzyRef === 'number' ? it.umowaWystepujacaPrzyRef : null;
      if (ref !== null) {
        const target = items[ref];
        return !(target && target.umowaWystepujacaPrzy);
      }
      // no ref provided -> invalid
      return true;
    });
    if (invalid.length > 0) {
      alert(`Nie można zapisać pakietu — pozycje (${invalid.map((i) => i+1).join(', ')}) mają zaznaczoną umowę dodatkową LUXMED bez poprawnie ustawionej umowy podstawowej.`);
      return;
    }

    const newPkg: SavedPackage = { id: String(Date.now()), name: pkgName, createdAt: Date.now(), selectedIndices: sel, generatedText: generatedText || '', fileIds };
    setSavedPackages((prev) => [newPkg, ...prev]);
    setPackageName('');
  };

  const loadScript = (src: string) => new Promise<void>((res, rej) => {
    if ((window as any).JSZip) return res();
    const s = document.createElement('script');
    s.src = src;
    s.onload = () => res();
    s.onerror = () => rej(new Error('Failed to load script'));
    document.head.appendChild(s);
  });

  const dataUrlToUint8Array = (dataUrl: string) => {
    const comma = dataUrl.indexOf(',');
    const base64 = dataUrl.slice(comma + 1);
    const binary = atob(base64);
    const len = binary.length;
    const arr = new Uint8Array(len);
    for (let i = 0; i < len; i++) arr[i] = binary.charCodeAt(i);
    return arr;
  };

  const downloadPackageAsZip = async (pkg: SavedPackage) => {
    // Validate that package doesn't include items where additional Luxmed is set without base contract
    const invalid = (pkg.selectedIndices || []).filter((i) => {
      const it = items[i];
      const hasLuxmed = it && (it.tags || []).some((t) => (t || '').toLowerCase() === 'luxmed');
      if (!it || !hasLuxmed) return false;
      if (it.umowaWystepujacaPrzy) return false;
      const ref = typeof it.umowaWystepujacaPrzyRef === 'number' ? it.umowaWystepujacaPrzyRef : null;
      if (ref !== null) {
        const tgt = items[ref];
        return !(tgt && tgt.umowaWystepujacaPrzy);
      }
      return true;
    });
    if (invalid.length > 0) {
      alert(`Nie można pobrać pakietu — pozycje (${invalid.map((i) => i+1).join(', ')}) mają umowę dodatkową LUXMED bez włączonej umowy podstawowej.`);
      return;
    }

    try {
      await loadScript('https://cdn.jsdelivr.net/npm/jszip@3.10.0/dist/jszip.min.js');
      const JSZip = (window as any).JSZip;
      if (!JSZip) throw new Error('JSZip not available');
      const zip = new JSZip();
      zip.file('manifest.json', JSON.stringify({ name: pkg.name, createdAt: pkg.createdAt, selectedIndices: pkg.selectedIndices }, null, 2));
      zip.file(`${pkg.name || 'generated'}.txt`, pkg.generatedText || '');

      for (const id of pkg.fileIds) {
        const f = savedFiles.find((x) => x.id === id);
        if (!f) continue;
        const data = dataUrlToUint8Array(f.dataUrl);
        zip.file(f.name, data);
      }

      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${pkg.name || 'package'}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (e) {
      // fallback: download a JSON bundle
      const bundle = { meta: { name: pkg.name, createdAt: pkg.createdAt }, generatedText: pkg.generatedText, files: pkg.fileIds.map((id) => savedFiles.find((f) => f.id === id)) };
      const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${pkg.name || 'package'}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    }
  };

  const clearSelections = () => {
    setItems((prev) => prev.map((it) => ({ ...it, selectedSlots: [] })));
  };

  const exportToCSVAndSave = (filename?: string) => {
    const header = ['Index', 'Label', 'Description', 'Link', 'FileName', 'SelectedSlots'];
    const rows = items.map((it, idx) => [String(idx + 1), it.label || '', it.description || '', it.link || '', it.fileName || '', (it.selectedSlots ? it.selectedSlots.join(';') : '')]);
    const csv = [header, ...rows].map((r) => r.map((cell) => `"${(cell || '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');

    const name = filename || `export_${new Date().toISOString().slice(0,19).replace(/[:T]/g,'-')}.csv`;
    const dataUrl = `data:text/csv;charset=utf-8;base64,${btoa(unescape(encodeURIComponent(csv)))}`;

    const file: SavedFile = { id: String(Date.now()), name, dataUrl, mime: 'text/csv', createdAt: Date.now() };
    setSavedFiles((prev) => [file, ...prev]);

    // Also offer immediate download
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadSavedFile = (file: SavedFile) => {
    const a = document.createElement('a');
    a.href = file.dataUrl;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const removeSavedFile = (id: string) => {
    setSavedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const truncatePreview = (val?: string, length = 8) => {
    if (!val) return "";
    return val.length > length ? `${val.slice(0, length)}...` : val;
  };

  const handleChange = (idx: number, field: keyof Item, value: any) => {
    // enforce label max length 30
    if (field === 'label' && typeof value === 'string') {
      value = value.slice(0, 30);
    }

    setItems((prev) => {
      const copy = prev.slice();
      copy[idx] = { ...copy[idx], [field]: value };
      return copy;
    });
  };

  const handleFileChange = (idx: number, file?: File | null) => {
    if (!file) {
      setItems((prev) => {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], fileName: "", fileId: undefined };
        return copy;
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || '');
      const fileObj: SavedFile = { id: String(Date.now()) + '_' + file.name, name: file.name, dataUrl, mime: file.type || 'application/octet-stream', createdAt: Date.now() };
      setSavedFiles((prev) => [fileObj, ...prev]);

      setItems((prev) => {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], fileName: file.name, fileId: fileObj.id };
        return copy;
      });
    };
    reader.onerror = () => {
      // on error, still set name
      setItems((prev) => {
        const copy = prev.slice();
        copy[idx] = { ...copy[idx], fileName: file.name };
        return copy;
      });
    };
    reader.readAsDataURL(file);
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

    // If right slot and file exists, download it immediately (then toggle selection)
    if (slot === 'right') {
      const fileId = items[idx].fileId;
      if (fileId) {
        const f = savedFiles.find((s) => s.id === fileId);
        if (f) {
          try {
            downloadSavedFile(f);
          } catch (e) {
            console.error('Failed to download file', e);
          }
        }
      }
    }

    setItems((prev) => {
      const copy = prev.slice();
            const arr = new Set(copy[idx].selectedSlots || []);
      if (arr.has(slot)) arr.delete(slot); else arr.add(slot);
      copy[idx] = { ...copy[idx], selectedSlots: Array.from(arr) };
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
      (`pozycja ${idx + 1}`).includes(q) ||
      ((item.tags || []).some(tag => tag.toLowerCase().includes(q)))
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
                              <div className="ml-3 flex flex-col text-xs text-slate-700">
                                <label className="flex items-center gap-2"><input type="checkbox" checked={!!item.umowaWystepujacaPrzy} onChange={(e) => handleChange(idx, 'umowaWystepujacaPrzy', e.target.checked)} /> <span>umowa występująca przy</span></label>
                                {editingIndex === idx && item.umowaWystepujacaPrzy ? (
                                  <select value={item.umowaWystepujacaPrzyRef ?? ''} onChange={(e) => {
                                    const v = e.target.value === '' ? null : parseInt(e.target.value, 10);
                                    handleChange(idx, 'umowaWystepujacaPrzyRef', v);
                                  }} className="mt-1 text-sm border rounded px-2 py-1">
                                    <option value="">Wybierz pozycję</option>
                                    {items.map((opt, oi) => {
                                      if (oi === idx) return null;
                                      return <option key={oi} value={oi}>{(opt.label || `Nazwa umowy`) + ' - Pozycja ' + (oi+1)}</option>;
                                    })}
                                  </select>
                                ) : null}
                                {editingIndex === idx ? (
                                  <div className="mt-2">
                                    <div className="text-xs text-slate-600 mb-1">Dodatkowe informacje (oddzielaj przecinkami)</div>
                                    <input value={(item.tags || []).join(', ')} onChange={(e) => handleChange(idx, 'tags', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} placeholder="np. luxmed, assistance, śmierć" className="w-full border rounded px-2 py-1 text-sm" />
                                  </div>
                                ) : (
                                  <div className="mt-2 flex flex-wrap gap-1">
                                    {(item.tags || []).map((t, ti) => (
                                      <span key={ti} className="text-xs bg-slate-100 px-2 py-1 rounded text-slate-700">{t}</span>
                                    ))}
                                  </div>
                                )}
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
                            <div onMouseEnter={() => onCircleEnter(idx, 'left')} onMouseLeave={onCircleLeave} onClick={() => onCircleClick(idx, 'left')} className={`${items[idx].selectedSlots && items[idx].selectedSlots.includes('left') && mode==='home' ? 'rainbow-circle text-white' : 'bg-blue-500'} rounded-full p-2 mb-2 inline-flex ${hoveredKey===`${idx}-left`? 'scale-105 shadow-lg' : ''}`}>
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
                            <div onMouseEnter={() => onCircleEnter(idx, 'mid')} onMouseLeave={onCircleLeave} onClick={() => onCircleClick(idx, 'mid')} className={`${items[idx].selectedSlots && items[idx].selectedSlots.includes('mid') && mode==='home' ? 'rainbow-circle text-white' : 'bg-green-500'} rounded-full p-2 mb-2 inline-flex ${hoveredKey===`${idx}-mid`? 'scale-105 shadow-lg' : ''}`}>
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
                              <div onClick={() => onCircleClick(idx, 'right')} className={`${items[idx].selectedSlots && items[idx].selectedSlots.includes('right') && mode==='home' ? 'rainbow-circle text-white' : 'bg-amber-400'} rounded-full p-2 mb-2 inline-flex ${hoveredKey===`${idx}-right`? 'scale-105 shadow-lg' : ''}`}>
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

          {filtered.length > 0 ? (
            <div className="flex-1 border-2 border-slate-800 bg-white min-w-0 p-4 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <div className="text-lg font-medium">Edytor</div>
                <div className="flex items-center gap-2">
                  <button onClick={generateFromSelections} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Generuj</button>
                  <button onClick={clearSelections} className="px-3 py-1 bg-slate-200 rounded text-sm">Odznacz</button>
                  <button onClick={() => { navigator.clipboard?.writeText(generatedText || ""); }} className="px-3 py-1 bg-slate-200 rounded text-sm">Kopiuj</button>
                  <button onClick={() => setFolderOpen((s) => !s)} className="px-3 py-1 bg-slate-100 border rounded text-sm">Folder ({savedFiles.length})</button>
                </div>
              </div>

              {/* Preview: bolded contract names with larger font */}
              <div className="mb-3 overflow-auto max-h-40">
                {generatedText ? (
                  generatedText.split('\n\n').map((block, i) => {
                    // Support two formats: "Title\nContent" or "Title: Content"
                    let title = '';
                    let content = '';
                    const nl = block.indexOf('\n');
                    if (nl >= 0) {
                      title = block.slice(0, nl).trim();
                      content = block.slice(nl + 1).trim();
                    } else {
                      const idx = block.indexOf(':');
                      if (idx >= 0) {
                        title = block.slice(0, idx).trim();
                        content = block.slice(idx + 1).trim();
                      } else {
                        content = block;
                      }
                    }

                    const contentLines = content.split('\n').filter(Boolean);

                    return (
                      <div key={i} className="mb-2">
                        {title ? <div className="font-semibold text-[15px] text-slate-800">{title}</div> : null}
                        <div className="text-sm text-slate-700">
                          {contentLines.map((ln, j) => {
                            const raw = ln;
                            const t = ln.trim();
                            // handle lines that are indented (start with spaces) and contain OWU
                            if (t.startsWith('OWU:')) {
                              // detect indentation
                              const indent = raw.startsWith('  ') ? 'ml-4' : '';
                              return (
                                <div key={j} className={indent}><span className="font-semibold">OWU:</span> {t.slice(4).trim()}</div>
                              );
                            }
                            return <div key={j}>{raw}</div>;
                          })}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-xs text-slate-500">Brak podglądu — wygeneruj zawartość.</div>
                )}
              </div>

              <textarea
                ref={generatedRef}
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                className="flex-1 w-full border rounded p-3 text-[15px] resize-none"
                placeholder="Wygenerowany tekst pojawi się tutaj..."
              />

              {folderOpen ? (
                <div className="mt-3 border-t pt-3">
                  <div className="text-sm font-medium mb-2">Folder plików</div>

                  <div className="mb-2">
                    <input value={packageName} onChange={(e) => setPackageName(e.target.value)} placeholder="Nazwa pakietu (np. Pawelmaterna)" className="w-full border rounded px-2 py-1 text-sm" />
                    <div className="flex items-center gap-2 mt-2">
                      <button onClick={() => savePackage()} className="px-3 py-1 bg-indigo-600 text-white rounded text-sm">Zapisz pakiet</button>
                      <button onClick={() => { setPackageName(''); }} className="px-3 py-1 bg-slate-200 rounded text-sm">Wyczyść nazwę</button>
                    </div>
                  </div>

                  {savedFiles.length === 0 ? (
                    <div className="text-xs text-slate-500 mb-3">Brak zapisanych plików.</div>
                  ) : (
                    <div className="flex flex-col gap-2 mb-3">
                      {savedFiles.map((f) => (
                        <div key={f.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                          <div className="text-sm">
                            <div className="font-medium">{f.name}</div>
                            <div className="text-xs text-slate-500">{new Date(f.createdAt).toLocaleString()}</div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button onClick={() => downloadSavedFile(f)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Pobierz</button>
                            <button onClick={() => { setGeneratedText(atob(f.dataUrl.split(',')[1])); setFolderOpen(false); }} className="px-2 py-1 bg-slate-200 rounded text-sm">Otwórz</button>
                            <button onClick={() => removeSavedFile(f.id)} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Usuń</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="border-t pt-3">
                    <div className="text-sm font-medium mb-2">Zapisane pakiety</div>
                    {savedPackages.length === 0 ? (
                      <div className="text-xs text-slate-500">Brak pakietów.</div>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {savedPackages.map((p) => (
                          <div key={p.id} className="flex items-center justify-between bg-slate-50 p-2 rounded">
                            <div className="text-sm">
                              <div className="font-medium">{p.name}</div>
                              <div className="text-xs text-slate-500">{new Date(p.createdAt).toLocaleString()}</div>
                              <div className="text-xs text-slate-500">Pozycje: {p.selectedIndices.map((i) => i+1).join(', ') || 'brak'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <button onClick={() => downloadPackageAsZip(p)} className="px-2 py-1 bg-green-600 text-white rounded text-sm">Pobierz ZIP</button>
                              <button onClick={() => { setGeneratedText(p.generatedText); setFolderOpen(false); }} className="px-2 py-1 bg-slate-200 rounded text-sm">Otwórz</button>
                              <button onClick={() => setSavedPackages((prev) => prev.filter((x) => x.id !== p.id))} className="px-2 py-1 bg-red-500 text-white rounded text-sm">Usuń</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
