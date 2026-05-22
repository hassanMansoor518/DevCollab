import React from "react";
import { FiSearch, FiX } from "react-icons/fi";

function SearchBar({ placeholder = "Search...", value, onChange, onClear }) {
    return (
        <div className="w-full px-4 py-1">
            <div className="flex items-center gap-2.5 bg-input-bg border border-border-subtle focus-within:border-primary/50 focus-within:ring-2 focus-within:ring-primary/10 transition-all duration-350 rounded-xl px-3.5 py-2 shadow-sm">
                {/* Search Icon */}
                <FiSearch className="text-text-muted text-lg shrink-0" />

                {/* Input */}
                <input
                    type="text"
                    value={value}
                    placeholder={placeholder}
                    onChange={onChange}
                    className="w-full bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted/70"
                />

                {/* Optional Clear Button */}
                {value && (
                    <button 
                        onClick={onClear} 
                        type="button"
                        className="text-text-muted hover:text-text-primary transition-colors p-0.5 rounded-full hover:bg-hover-bg"
                    >
                        <FiX size={14} />
                    </button>
                )}
            </div>
        </div>
    );
}

export default SearchBar;

