import { FiSearch, FiX } from "react-icons/fi";

function SearchBar({ placeholder = "Search...", onChange }) {
    return (
        <div className="w-full px-4 py-2">
            <div className="flex items-center gap-3 bg-slate-800/60 backdrop-blur-lg 
                      border border-slate-700/50
                      focus-within:border-blue-500/50 
                      transition-all duration-200
                      rounded-2xl px-4 py-2 shadow-inner">

                {/* Search Icon */}
                <FiSearch className="text-gray-300 text-xl" />

                {/* Input */}
                <input
                    type="text"
                    placeholder={placeholder}
                    onChange={onChange}
                    className="w-full bg-transparent outline-none text-gray-200 placeholder-gray-400"
                />

                {/* Optional Clear Button */}
                <FiX className="text-gray-400 text-xl cursor-pointer hover:text-white" />
            </div>
        </div>
    );
}

export default SearchBar;
