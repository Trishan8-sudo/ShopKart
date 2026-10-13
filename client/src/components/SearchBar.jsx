function SearchBar({
  search,
  category,
  onSearchChange,
  onCategoryChange,
  categories = ['All Categories', 'Electronics', 'Fashion', 'Books', 'Home'],
}) {
  return (
    <div className="w-full flex flex-col sm:flex-row items-center gap-3">
      {/* Search Input */}
      <div className="relative flex-1 w-full">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search products by name..."
          className="w-full pl-10 pr-10 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all shadow-inner"
        />
        {search && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            title="Clear search"
          >
            ✕
          </button>
        )}
      </div>

      {/* Category Dropdown */}
      <div className="w-full sm:w-56 shrink-0">
        <select
          value={category}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full py-2.5 px-3.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all cursor-pointer shadow-inner"
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} className="bg-slate-900 text-slate-100">
              {cat}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

export default SearchBar
