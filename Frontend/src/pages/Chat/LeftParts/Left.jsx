import React, { useState } from "react";
import SearchBar from "./Search";
import Users from "./Users";
import Workspaces from "./Workspaces";
import { FiPlus } from "react-icons/fi";
import { Layers } from "lucide-react";

export default function Left() {
    const [activeWorkspace, setActiveWorkspace] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");

    return (
        <aside className="hidden h-screen w-[300px] shrink-0 flex-col justify-between border-r border-border-subtle bg-sidebar text-text-primary lg:flex">
            {/* TOP SECTION */}
            <div className="flex flex-col h-full overflow-hidden">
                {/* Workspace Header */}
                <div className="flex items-center justify-between border-b border-border-subtle px-6 py-4">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-primary to-info flex items-center justify-center text-white shadow-md shadow-primary/15">
                            <Layers size={15} />
                        </div>
                        <div>
                            <h1 className="text-sm font-bold text-text-primary tracking-wide leading-none">
                                Dev Workspace
                            </h1>
                            <span className="text-[10px] text-text-muted font-medium">Collaborative Hub</span>
                        </div>
                    </div>

                    <button className="icon-button h-8 w-8 rounded-xl border-border-subtle hover:bg-hover-bg hover:text-primary transition-all duration-300" aria-label="Create workspace">
                        <FiPlus size={14} />
                    </button>
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
