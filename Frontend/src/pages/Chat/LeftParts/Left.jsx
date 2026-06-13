import React, { useState } from "react";
import SearchBar from "./Search";
import Users from "./Users";
import Workspaces from "./Workspaces";
import { FiPlus } from "react-icons/fi";
import { Layers, Menu } from "lucide-react";

export default function Left() {
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <aside className="flex h-screen w-full lg:w-[300px] shrink-0 flex-col border-r border-border-subtle bg-sidebar text-text-primary">
            {/* TOP SECTION */}
            <div className="flex flex-col h-full overflow-hidden">
                {/* Workspace Header */}
                <div className="flex items-center justify-between border-b border-border-subtle px-4 sm:px-6 py-4 min-w-0">
                    <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
                        {/* MOBILE MENU */}
                        <button
                            className="lg:hidden shrink-0 p-2 -ml-2 text-text-muted hover:text-text-primary hover:bg-hover-bg rounded-lg transition"
                            onClick={() => window.dispatchEvent(new CustomEvent('toggle-sidebar'))}
                            aria-label="Open sidebar"
                        >
                            <Menu size={20} />
                        </button>

                        <div className="shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-white shadow-md shadow-primary/15">
                            <Layers size={15} />
                        </div>
                        <div className="min-w-0">
                            <h1 className="text-sm font-bold text-text-primary tracking-wide leading-none truncate max-w-[140px] sm:max-w-none">
                                Dev Workspace
                            </h1>
                            <span className="text-[10px] text-text-muted font-medium truncate block">Collaborative Hub</span>
                        </div>
                    </div>


                </div>

                {/* Search */}
                <div className="mt-4">
                    <SearchBar
                        placeholder="Search conversations..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onClear={() => setSearchQuery("")}
                    />
                </div>

                {/* Main Scrollable Area */}
                <div className="flex-1 overflow-y-auto pb-6 scrollbar-thin">
                    {/* Workspaces */}
                    <Workspaces
                        onSelectWorkspace={setActiveWorkspace}
                        activeWorkspace={activeWorkspace}
                        searchQuery={searchQuery}
                    />

                    {/* Users / Channels */}
                    <Users
                        workspace={activeWorkspace}
                        searchQuery={searchQuery}
                    />
                </div>
            </div>
        </aside>
    );
}
