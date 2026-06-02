import React from "react";
import { ChannelType } from "../types";
import { CHANNELS } from "../data";
import { Check, BookOpen, Layers, Twitter, Linkedin, MessageSquare, Flame } from "lucide-react";

interface ChannelSelectorProps {
  selectedChannels: ChannelType[];
  onChange: (channels: ChannelType[]) => void;
}

const getIcon = (id: ChannelType) => {
  switch (id) {
    case "blog":
      return <BookOpen className="w-4 h-4" />;
    case "app_store":
      return <Layers className="w-4 h-4" />;
    case "twitter":
      return <Twitter className="w-4 h-4" />;
    case "linkedin":
      return <Linkedin className="w-4 h-4" />;
    case "discord":
      return <MessageSquare className="w-4 h-4" />;
    case "hacker_news":
      return <Flame className="w-4 h-4" />;
    default:
      return null;
  }
};

export default function ChannelSelector({ selectedChannels, onChange }: ChannelSelectorProps) {
  const toggleChannel = (id: ChannelType) => {
    if (selectedChannels.includes(id)) {
      if (selectedChannels.length > 1) {
        onChange(selectedChannels.filter((c) => c !== id));
      }
    } else {
      onChange([...selectedChannels, id]);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-1">
        <label className="text-[10px] font-semibold tracking-widest uppercase text-zinc-400">
          Target Media & Audiences
        </label>
        <span className="text-sm text-zinc-500">
          Select each channel you seek to target. The system will synthesize custom variations simultaneously.
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3">
        {CHANNELS.map((channel) => {
          const isSelected = selectedChannels.includes(channel.id);
          return (
            <div
              key={channel.id}
              onClick={() => toggleChannel(channel.id)}
              className={`flex flex-col justify-between p-4.5 rounded-xl border transition-all duration-300 cursor-pointer select-none group focus:outline-none ${
                isSelected
                  ? "bg-white border-zinc-950/20 shadow-[0_4px_20px_rgb(0,0,0,0.02)]"
                  : "bg-zinc-50/50 border-zinc-100 hover:bg-zinc-100/40"
              }`}
            >
              <div className="flex items-start justify-between w-full mb-3">
                <span
                  className={`flex items-center justify-center w-8 h-8 rounded-lg transition-transform group-hover:scale-105 duration-300 ${
                    isSelected ? "bg-zinc-900 text-white" : "bg-zinc-200/50 text-zinc-600"
                  }`}
                >
                  {getIcon(channel.id)}
                </span>
                
                {/* Simulated tactile toggle button */}
                <span
                  className={`flex items-center justify-center w-5.5 h-5.5 rounded-full border transition-all duration-300 ${
                    isSelected
                      ? "bg-zinc-900 border-zinc-900 text-white"
                      : "bg-transparent border-zinc-200 group-hover:border-zinc-300"
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                </span>
              </div>

              <div>
                <h4 className="font-semibold text-xs text-zinc-900 mb-1 leading-snug">
                  {channel.name}
                </h4>
                <p className="text-[11px] text-zinc-400 font-normal leading-relaxed">
                  {channel.description}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
