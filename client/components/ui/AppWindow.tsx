import React from "react";

export default function AppWindow() {
  return (
    <div className="w-[900px] h-[540px] bg-white p-4 border-4 border-slate-800 rounded shadow-lg">
      <div className="w-full h-full bg-white border-2 border-slate-800 p-3">
        <div className="flex h-full gap-4">
          <div className="w-1/3 flex flex-col gap-4">
            <div
              aria-hidden
              className="h-16 border-2 border-slate-800 bg-white"
            />
            <div aria-hidden className="flex-1 border-2 border-slate-800 bg-white" />
            <div
              aria-hidden
              className="h-16 border-2 border-slate-800 bg-white"
            />
          </div>
          <div aria-hidden className="flex-1 border-2 border-slate-800 bg-white" />
        </div>
      </div>
    </div>
  );
}
