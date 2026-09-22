import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { stationApi } from '../../api/trainApi';
import { Station } from '../../types';
import { MapPin, Search, Wifi, Utensils, Armchair, Navigation, Building2, Check } from 'lucide-react';

export function StationsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const { data: stations = [], isLoading } = useQuery({
    queryKey: ['stationsList', searchTerm],
    queryFn: () => stationApi.getStations(searchTerm || undefined)
  });

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <Building2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">National Railway Stations Directory</h1>
          <p className="text-slate-500 mt-1">Discover stations, official IR codes, zones & passenger amenities</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by station code (e.g. CSMT, NDLS), station name or city..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* Stations Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stations.map((st: Station) => (
              <div
                key={st.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-900 text-lg">{st.name}</h3>
                      <p className="text-slate-500 text-xs mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {st.city}, {st.state}
                      </p>
                    </div>
                    <button
                      onClick={() => handleCopy(st.code)}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 font-mono font-bold text-xs rounded-lg transition-colors"
                      title="Click to copy code"
                    >
                      {copiedCode === st.code ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : null}
                      {st.code}
                    </button>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Railway Zone:</span>
                    <span className="font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                      {st.zone || 'IR'}
                    </span>
                  </div>

                  {/* Amenities */}
                  <div className="mt-4 flex flex-wrap gap-2">
                    {st.has_wifi && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        <Wifi className="w-3 h-3" /> Wi-Fi
                      </span>
                    )}
                    {st.has_food_court && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        <Utensils className="w-3 h-3" /> Food Court
                      </span>
                    )}
                    {st.has_waiting_room && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full">
                        <Armchair className="w-3 h-3" /> Waiting Room
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
