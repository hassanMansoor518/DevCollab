import React from "react";

function Loading() {
    return (
        <div className="flex h-full min-h-64 w-full items-center justify-center bg-background">
            <div className="panel w-64 p-5">
                <div className="skeleton-card h-28 rounded-xl" />
                <div className="mt-4 space-y-3">
                    <div className="skeleton-line h-3 w-28 rounded" />
                    <div className="skeleton-line h-3 w-full rounded" />
                    <div className="skeleton-line h-3 w-4/5 rounded" />
                </div>
            </div>
        </div>
    );
}

export default Loading;
