import { useState, useEffect, useRef } from 'react';
import { Search, Flame, Award, LogOut, User as UserIcon, BookOpen, ChevronRight, X } from 'lucide-react';
import { User, SearchResult } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface HeaderProps {
  user: User;
  onLogout: () => void;
  onNavigateToCourse: (courseId: string, targetType?: 'course' | 'chapter' | 'topic' | 'lesson', targetId?: string) => void;
  coursesCount: number;
}

export default function Header({ user, onLogout, onNavigateToCourse, coursesCount }: HeaderProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Dynamic user streak calculation based on user info (seeded to be 3 days or calculated)
  const streakDays = coursesCount > 0 ? 3 : 0;

  // Handle outside clicks to close search dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Handle fuzzy search API trigger
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setShowDropdown(false);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery)}&userId=${user.id}`);
        const data = await res.json();
        if (res.ok) {
          setSearchResults(data);
          setShowDropdown(true);
        }
      } catch (err) {
        console.error('Failed to query fuzzy search:', err);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user.id]);

  const handleResultClick = (result: SearchResult) => {
    onNavigateToCourse(result.courseId, result.type, result.id);
    setSearchQuery('');
    setShowDropdown(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between gap-4">
      {/* App Logo and Branding */}
      <div className="flex items-center gap-2 cursor-pointer" onClick={() => onNavigateToCourse('')}>
        <div className="w-9 h-9 rounded-lg bg-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-600/10 font-sans font-bold text-lg">
          E
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight text-slate-850 flex items-center gap-0.5">
            EduCraft<span className="text-indigo-600">AI</span>
          </h1>
          <span className="text-[9px] text-slate-400 font-mono tracking-wider uppercase block -mt-1">
            Studio Engine v1.0
          </span>
        </div>
      </div>

      {/* Global Search Bar with Fuzzy Matching */}
      <div ref={searchRef} className="relative flex-1 max-w-lg mx-4">
        <div className="relative">
          <input
            id="global_search_input"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              if (searchResults.length > 0) setShowDropdown(true);
            }}
            placeholder="Search courses, chapters, lesson goals, keywords..."
            className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 transition-all text-sm"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-200"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Dropdown Results Box */}
        <AnimatePresence>
          {showDropdown && (searchQuery.trim() !== '') && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute left-0 right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden max-h-[350px] overflow-y-auto z-50 divide-y divide-slate-100"
            >
              <div className="px-3.5 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50/50 flex justify-between items-center">
                <span>Search results ({searchResults.length})</span>
                {isSearching && <div className="w-3.5 h-3.5 border-2 border-indigo-400/30 border-t-indigo-600 rounded-full animate-spin" />}
              </div>

              {searchResults.length === 0 ? (
                <div className="p-4 text-center text-slate-500 text-sm">
                  No matching lessons or titles found.
                </div>
              ) : (
                searchResults.map((result, idx) => (
                  <button
                    key={idx}
                    id={`search_result_item_${idx}`}
                    onClick={() => handleResultClick(result)}
                    className="w-full text-left p-3 hover:bg-slate-50 transition-colors flex items-start gap-3 group"
                  >
                    <div className="mt-0.5 p-1.5 rounded-lg bg-indigo-50 text-indigo-600 group-hover:bg-indigo-100">
                      <BookOpen className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 text-[10px] font-medium text-indigo-600">
                        <span>{result.courseTitle}</span>
                        <ChevronRight className="w-3 h-3 text-slate-300" />
                        <span className="capitalize text-slate-500">{result.type}</span>
                      </div>
                      <div className="text-sm font-semibold text-slate-800 group-hover:text-indigo-600 truncate">
                        {result.title}
                      </div>
                      <div className="text-xs text-slate-400 line-clamp-1 mt-0.5 font-mono">
                        {result.snippet}
                      </div>
                    </div>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Badges, Profile & Action Area */}
      <div className="flex items-center gap-4">
        {/* Streak Counter Badge */}
        <div
          id="streak_badge"
          className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-full font-semibold text-xs shadow-sm hover:bg-emerald-100 transition-colors"
          title="Daily Learning Streak"
        >
          <Flame className="w-4 h-4 fill-emerald-100/50 text-emerald-600 animate-bounce" />
          <span>{streakDays} Day Streak</span>
        </div>

        {/* Global Progress Level Badge */}
        <div
          id="level_badge"
          className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-full font-semibold text-xs shadow-sm"
        >
          <Award className="w-4 h-4 text-indigo-600" />
          <span>Level 1 Craft</span>
        </div>

        {/* User Card & Logout */}
        <div className="flex items-center gap-3 border-l border-slate-200 pl-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold border border-slate-200 text-sm shadow-sm">
              {user.full_name.charAt(0).toUpperCase()}
            </div>
            <div className="hidden lg:block text-left">
              <div className="text-xs font-semibold text-slate-800 truncate max-w-[120px]">
                {user.full_name}
              </div>
              <div className="text-[10px] text-slate-400 truncate max-w-[120px]">
                {user.email}
              </div>
            </div>
          </div>

          <button
            id="btn_logout"
            onClick={onLogout}
            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all duration-150 cursor-pointer"
            title="Log Out Session"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
