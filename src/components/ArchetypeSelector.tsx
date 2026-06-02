import React from "react";
import { Archetype, ArchetypeId } from "../types";
import { ARCHETYPES } from "../data";
import { motion } from "motion/react";

interface ArchetypeSelectorProps {
  selectedId: ArchetypeId;
  onChange: (id: ArchetypeId) => void;
  customAgents?: Archetype[];
}

export default function ArchetypeSelector({ selectedId, onChange, customAgents = [] }: ArchetypeSelectorProps) {
  const allArchetypes = [...ARCHETYPES, ...customAgents];
  const activeArchetype = allArchetypes.find((a) => a.id === selectedId);

  return (
    <div className="space-y-6">
      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
          Selected Voice & Mentality
        </label>
        <span className="text-sm text-zinc-500">
          Choose the authoritative lens (built-in or custom agent) through which raw changes are distilled.
        </span>
      </div>

      {/* Exquisite tactile layout grid for selecting persona */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {allArchetypes.map((archetype) => {
          const isSelected = archetype.id === selectedId;
          return (
            <button
              key={archetype.id}
              onClick={() => onChange(archetype.id)}
              className={`relative flex flex-col text-left p-4 rounded-xl transition-all duration-300 select-none group cursor-pointer focus:outline-none ${
                isSelected
                  ? "bg-white border border-zinc-900/10 shadow-[0_8px_30px_rgb(0,0,0,0.03)]"
                  : "bg-zinc-50 border border-transparent hover:bg-zinc-100/50"
              }`}
            >
              {/* Fine indicator line representing precise physical finish */}
              {isSelected && (
                <motion.div
                  layoutId="activeIndicator"
                  className="absolute bottom-0 left-4 right-4 h-[2px] bg-zinc-900 rounded-full"
                  transition={{ type: "spring", stiffness: 350, damping: 30 }}
                />
              )}

              <div className="flex items-center space-x-2.5 mb-2">
                <span
                  className={`flex items-center justify-center w-7 h-7 rounded-lg text-xs font-medium ${
                    isSelected ? "bg-zinc-900 text-white" : "bg-zinc-200/60 text-zinc-600"
                  }`}
                >
                  {archetype.avatarText}
                </span>
                <span className="font-semibold text-xs text-zinc-900 leading-none truncate max-w-[80px]">
                  {archetype.name}
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-normal leading-relaxed line-clamp-2">
                {archetype.role}
              </p>
            </button>
          );
        })}
      </div>

      {/* Featured Quote / Philosophy Detail Display */}
      {activeArchetype && (
        <motion.div
          key={activeArchetype.id}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          className="bg-zinc-50/70 py-4.5 px-6 rounded-xl border border-zinc-100 flex flex-col space-y-2.5"
        >
          <span className="text-[9px] uppercase tracking-widest font-semibold text-zinc-400">
            Philosophy
          </span>
          <p className="font-serif italic text-sm text-zinc-600 leading-relaxed">
            "{activeArchetype.quote}"
          </p>
          <span className="text-[11px] text-zinc-500 font-medium">
            &mdash; {activeArchetype.name}, {activeArchetype.role}
          </span>
        </motion.div>
      )}
    </div>
  );
}
