import React, { useState, useRef, useEffect } from 'react';
import {
  Search,
  SlidersHorizontal,
  X,
  Settings,
  HelpCircle,
  LogOut,
  User as UserIcon,
  HardDrive
} from 'lucide-react';
import { useDriveStore } from '../../store/useDriveStore';
import { useAuthStore } from '../../store/useAuthStore';
import { formatBytes } from '../../utils/formatters';

export const Header: React.FC = () => {
  const {
    searchQuery,
    searchType,
    searchModified,
    setSearch,
    clearSearch,
    openModal
  } = useDriveStore();

  const { user, logout } = useAuthStore();

  const [inputVal, setInputVal] = useState(searchQuery);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const filterRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setInputVal(searchQuery);
  }, [searchQuery]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setIsFilterOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setIsProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(inputVal, searchType, searchModified);
  };

  const handleClear = () => {
    setInputVal('');
    clearSearch();
  };

  const typeOptions = [
    { value: 'all', label: 'All types' },
    { value: 'document', label: 'Documents' },
    { value: 'spreadsheet', label: 'Spreadsheets' },
    { value: 'presentation', label: 'Presentations' },
    { value: 'image', label: 'Photos & images' },
    { value: 'pdf', label: 'PDFs' },
    { value: 'video', label: 'Videos' },
    { value: 'audio', label: 'Audio' },
    { value: 'archive', label: 'Archives (ZIP)' },
    { value: 'code', label: 'Code & text' }
  ];

  const modifiedOptions = [
    { value: 'all', label: 'Anytime' },
    { value: 'today', label: 'Today' },
    { value: '7days', label: 'Last 7 days' },
    { value: '30days', label: 'Last 30 days' }
  ];

  return (
    <header className="h-16 bg-[#f8fafd] px-4 flex items-center justify-between border-b border-gray-200/80 select-none z-30 relative">
      {/* Brand logo & name */}
      <div className="flex items-center gap-3 w-60 shrink-0">
        <svg className="w-9 h-8" viewBox="0 0 87.3 78" fill="none">
          <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
          <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44c-.8 1.4-1.2 2.95-1.2 4.5h27.5z" fill="#00ac47"/>
          <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
          <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
          <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
          <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
        </svg>
        <span className="text-xl font-normal text-[#444746] tracking-tight">Drive</span>
      </div>

      {/* Omnibox Search Bar */}
      <div className="flex-1 max-w-2xl px-4 relative">
        <form onSubmit={handleSearchSubmit} className="relative">
          <div className="relative flex items-center bg-[#e9eef6] focus-within:bg-white focus-within:shadow-md rounded-full transition-all duration-200">
            <button
              type="submit"
              className="p-3 text-gray-500 hover:text-gray-800 transition-colors"
              title="Search"
            >
              <Search className="w-5 h-5 ml-1" />
            </button>

            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Search in Drive"
              className="w-full bg-transparent border-none outline-none py-2.5 text-sm text-[#1f1f1f] placeholder:text-[#444746]"
            />

            {inputVal && (
              <button
                type="button"
                onClick={handleClear}
                className="p-1.5 mr-1 hover:bg-gray-200 rounded-full text-gray-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`p-2 mr-2 rounded-full transition-colors ${
                isFilterOpen || searchType !== 'all' || searchModified !== 'all'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-200'
              }`}
              title="Search options"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </div>
        </form>

        {/* Filter Popover Dropdown */}
        {isFilterOpen && (
          <div
            ref={filterRef}
            className="absolute top-14 left-4 right-4 bg-white rounded-2xl shadow-2xl border border-gray-200 p-5 z-50 animate-fade-in text-sm space-y-4"
          >
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Type
              </label>
              <div className="flex flex-wrap gap-2">
                {typeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSearch(inputVal, opt.value, searchModified);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      searchType === opt.value
                        ? 'bg-[#c2e7ff] text-[#001d35] border-transparent font-semibold'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider block mb-2">
                Date modified
              </label>
              <div className="flex flex-wrap gap-2">
                {modifiedOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      setSearch(inputVal, searchType, opt.value);
                    }}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                      searchModified === opt.value
                        ? 'bg-[#c2e7ff] text-[#001d35] border-transparent font-semibold'
                        : 'bg-white hover:bg-gray-50 border-gray-200 text-gray-700'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  setSearch('', 'all', 'all');
                  setInputVal('');
                  setIsFilterOpen(false);
                }}
                className="text-xs text-gray-500 hover:text-gray-800"
              >
                Reset filters
              </button>
              <button
                type="button"
                onClick={() => {
                  setSearch(inputVal, searchType, searchModified);
                  setIsFilterOpen(false);
                }}
                className="px-4 py-1.5 bg-[#0b57d0] hover:bg-[#0842a0] text-white text-xs font-medium rounded-full shadow-sm"
              >
                Apply
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right User Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => openModal('storage')}
          className="p-2 rounded-full hover:bg-[#eaedf1] text-gray-600 transition-colors"
          title="Storage details"
        >
          <HardDrive className="w-5 h-5" />
        </button>

        {/* User Profile Avatar & Dropdown */}
        <div className="relative" ref={profileRef}>
          <button
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="w-9 h-9 rounded-full overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all ml-1 shadow-sm"
          >
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt={user.name} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full bg-[#1a73e8] text-white flex items-center justify-center font-medium text-sm">
                {user?.name ? user.name[0].toUpperCase() : 'U'}
              </div>
            )}
          </button>

          {isProfileOpen && (
            <div className="absolute right-0 top-12 w-80 bg-white rounded-3xl shadow-2xl border border-gray-200 p-5 z-50 animate-fade-in text-[#1f1f1f]">
              <div className="flex flex-col items-center text-center pb-4 border-b border-gray-100">
                <div className="w-16 h-16 rounded-full overflow-hidden mb-3 border border-gray-200">
                  <img src={user?.avatar_url} alt={user?.name} className="w-full h-full object-cover" />
                </div>
                <h4 className="font-medium text-base">{user?.name}</h4>
                <p className="text-xs text-[#5f6368]">{user?.email}</p>
              </div>

              {/* Storage snippet in profile */}
              <div className="py-4 border-b border-gray-100 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-[#5f6368]">Storage used</span>
                  <span className="font-medium">
                    {formatBytes(user?.storage_used || 0)} / {formatBytes(user?.storage_quota || 16106127360)}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="bg-[#1a73e8] h-full rounded-full"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.round(((user?.storage_used || 0) / (user?.storage_quota || 16106127360)) * 100)
                      )}%`
                    }}
                  />
                </div>
              </div>

              <div className="pt-3">
                <button
                  onClick={() => {
                    setIsProfileOpen(false);
                    logout();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2 hover:bg-gray-100 rounded-xl text-sm font-medium text-red-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
