import React from "react";

export default function AppWindow() {
  return (
    <div className="w-[1100px] h-[700px] bg-white rounded shadow-xl">
      <div className="w-full h-full bg-white p-6">
        <div className="flex h-full gap-6">
          <div className="w-1/3 flex flex-col gap-4">
            <div aria-hidden className="h-20 border-2 border-slate-800 bg-white" />
            <div aria-hidden className="flex-1 border-2 border-slate-800 bg-white" />
            <div aria-hidden className="h-20 border-2 border-slate-800 bg-white" />
          </div>
          <div aria-hidden className="flex-1 border-2 border-slate-800 bg-white" />
        </div>
      </div>
    </div>
  );
}
