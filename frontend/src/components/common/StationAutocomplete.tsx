import React, { useState, useEffect, useRef } from 'react';
import { Station } from '../../types';
import { stationApi } from '../../api/trainApi';
import { MapPin, Search } from 'lucide-react';

interface Props {
  label: string;
  value: Station | null;
  onChange: (station: Station) => void;
  placeholder?: string;
  className?: string;
}

export const StationAutocomplete: React.FC<Props> = ({
  label,
  value,
  onChange,
  placeholder = 'Search station or city...',
  className = '',
}) => {
  const [query, setQuery] = useState(value ? `${value.name} (${value.code})` : '');
  const [stations, setStations] = useState<Station[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (value) {
      setQuery(`${value.name} (${value.code})`);
    } else {
      setQuery('');
    }
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (text: string) => {
    setQuery(text);
    setIsOpen(true);
    setHighlightedIndex(0);
    if (!text.trim()) {
      setStations([]);
      return;
    }
    setLoading(true);
    try {
      const data = await stationApi.getStations(text);
      setStations(data);
      // Auto-select if exact match on code
      const exact = data.find(
        (st) => st.code.toUpperCase() === text.trim().toUpperCase()
      );
      if (exact) {
        onChange(exact);
      }
    } catch (err) {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (st: Station) => {
    onChange(st);
    setQuery(`${st.name} (${st.code})`);
    setIsOpen(false);
    setHighlightedIndex(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!isOpen || stations.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev + 1) % stations.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev <= 0 ? stations.length - 1 : prev - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
      if (stations[idx]) {
        handleSelect(stations[idx]);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleBlur = () => {
    // If user typed something and has not selected anything yet, auto-select first matching station
    setTimeout(() => {
      setIsOpen(false);
      if (stations.length > 0 && query.trim()) {
        const isAlreadySelected = value && `${value.name} (${value.code})` === query;
        if (!isAlreadySelected) {
          const idx = highlightedIndex >= 0 ? highlightedIndex : 0;
          if (stations[idx]) {
            handleSelect(stations[idx]);
          }
        }
      }
    }, 150);
  };

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
        {label}
      </label>
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <MapPin className="h-4 w-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          onFocus={() => {
            if (!stations.length) handleSearch(query);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-navy-800 focus:border-transparent font-medium"
        />
      </div>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-white border border-slate-200 rounded-lg shadow-xl divide-y divide-slate-100">
          {loading ? (
            <div className="p-3 text-xs text-slate-400 text-center">Searching stations...</div>
          ) : stations.length > 0 ? (
            stations.map((st, idx) => (
              <div
                key={st.id}
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSelect(st);
                }}
                className={`px-4 py-2.5 cursor-pointer flex items-center justify-between text-left transition-colors ${
                  idx === highlightedIndex ? 'bg-blue-50 text-blue-900' : 'hover:bg-slate-50 text-slate-800'
                }`}
              >
                <div>
                  <div className="text-sm font-semibold">
                    {st.name} <span className="text-rail-red font-mono font-bold">({st.code})</span>
                  </div>
                  <div className="text-xs text-slate-500">{st.city}, {st.state}</div>
                </div>
                <span className="text-xs px-2 py-0.5 bg-slate-100 text-slate-600 rounded font-mono font-medium">
                  {st.zone || 'IR'}
                </span>
              </div>
            ))
          ) : query ? (
            <div className="p-3 text-xs text-slate-400 text-center">No stations matching "{query}"</div>
          ) : (
            <div className="p-3 text-xs text-slate-400 text-center">Type station name or code</div>
          )}
        </div>
      )}
    </div>
  );
};
