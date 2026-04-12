import React from "react";
import { ChevronRight } from "lucide-react";

export default function CommitCard({ name, time, title, url }) {
  return (
    <div className="bg-[#111827]/80 border border-white/10 rounded-xl p-5 hover:shadow-lg transition-shadow">
      <div className="flex justify-between">
        <div>
          {/* Author Info */}
          <div className="flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-full bg-blue-500/30 flex items-center justify-center text-blue-400 text-xs font-semibold">
              {name ? name.charAt(0).toUpperCase() : "?"}
            </div>
            <span className="font-medium">{name || "Unknown"}</span>
            <span className="text-gray-500 text-xs">{time}</span>
          </div>

          {/* Commit Message */}
          <h3 className="mt-3 font-semibold text-white break-words">{title}</h3>
        </div>

        {/* GitHub Link */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:text-blue-300 text-sm flex items-center gap-1"
          >
            View on GitHub
            <ChevronRight size={14} />
          </a>
        )}
      </div>
    </div>
  );
}
