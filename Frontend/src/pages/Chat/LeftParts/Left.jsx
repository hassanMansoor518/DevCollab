import React, { useState } from "react";
import SearchBar from "./Search";
import Users from "./Users";

import Workspaces from "./Workspaces";
import { FiPlus } from "react-icons/fi";

export default function Left() {
    // Track which workspace is currently active
    const [activeWorkspace, setActiveWorkspace] = useState(null);

    return (
        <aside className="hidden h-screen w-[280px] shrink-0 flex-col justify-between border-r border-border-subtle bg-surface text-text-primary lg:flex">
            {/* TOP SECTION */}
            <div>
                {/* Workspace Header */}
                <div className="flex items-center justify-between border-b border-border-subtle px-5 py-4">
                    <h1 className="text-sm font-semibold tracking-wide text-text-primary">
                        Dev Workspace
                    </h1>

                    <button className="icon-button h-8 w-8" aria-label="Create workspace">
                        <FiPlus size={14} />
                    </button>
                </div>

                {/* Search */}
                <div className="mt-3">
                    <SearchBar placeholder="Search..." />
                </div>

                {/* Workspaces */}
                <Workspaces
                    onSelectWorkspace={setActiveWorkspace}
                    activeWorkspace={activeWorkspace}
                />

                {/* Users / Channels */}
                <Users workspace={activeWorkspace} />
            </div>


        </aside>
    );
}
