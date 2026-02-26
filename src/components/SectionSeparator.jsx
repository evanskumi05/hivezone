"use client";

import React from "react";

const SectionSeparator = () => {
  return (
    <div className="w-full py-8">
      <div className="max-w-7xl mx-auto px-8 flex items-center gap-4">
        <div className="flex-1 h-[1px] bg-zinc-200" />
        <div className="w-2 h-2 rotate-45 border border-zinc-300 bg-white" />
        <div className="flex-1 h-[1px] bg-zinc-200" />
      </div>
    </div>
  );
};

export default SectionSeparator;