import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { Link } from 'react-router-dom';
import { Train, Search, ArrowRight, Utensils, Calendar, ChevronRight } from 'lucide-react';

export function TrainsListPage() {
  const [query, setQuery] = useState('');

  const { data: trains = [], isLoading } = useQuery({
    queryKey: ['trainsCatalog', query],
    queryFn: async () => {
      const res = await api.get('/trains', { params: { q: query || undefined } });
      return res.data.data;
    }
  });

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <Train className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Trains Catalog & Timetables</h1>
          <p className="text-slate-500 mt-1">Explore long-distance express, superfast, and premium train services</p>
        </div>

        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-4 mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search train by name or number (e.g. 12951, Rajdhani, Vande Bharat)..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
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

        {/* Train Cards */}
        {!isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {trains.map((train: any) => (
              <div
                key={train.id}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <Train className="w-5 h-5 text-blue-600" />
                        <h3 className="font-bold text-slate-900 text-lg">{train.name}</h3>
                      </div>
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded mt-1 inline-block">
                        #{train.train_number}
                      </span>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full">
                      {train.train_type}
                    </span>
                  </div>

                  {/* Route */}
                  <div className="bg-slate-50 rounded-xl p-4 my-3">
                    <div className="flex items-center justify-between text-sm">
                      <div>
                        <div className="text-xs text-slate-400 font-semibold uppercase">Origin</div>
                        <div className="font-bold text-slate-800">{train.source_station?.name || 'Origin'}</div>
                        <div className="text-xs font-mono text-slate-500">{train.source_station?.code}</div>
                      </div>
                      <div className="flex flex-col items-center px-4">
                        <span className="text-[11px] text-slate-400 font-medium mb-1">{train.total_distance_km} km</span>
                        <div className="flex items-center gap-1">
                          <div className="w-8 h-0.5 bg-slate-300"></div>
                          <ArrowRight className="w-4 h-4 text-slate-400" />
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-semibold uppercase">Destination</div>
                        <div className="font-bold text-slate-800">{train.destination_station?.name || 'Destination'}</div>
                        <div className="text-xs font-mono text-slate-500">{train.destination_station?.code}</div>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      <span>Runs on: <strong className="text-slate-700">{train.runs_on_days}</strong></span>
                    </div>
                    {train.catering_available && (
                      <span className="flex items-center gap-1 text-emerald-600 font-medium">
                        <Utensils className="w-3.5 h-3.5" /> Pantry Car
                      </span>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/trains/${train.train_number}`}
                    className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Schedule & Route <ChevronRight className="w-4 h-4" />
                  </Link>

                  <Link
                    to={`/search?from_code=${train.source_station?.code}&to_code=${train.destination_station?.code}&journey_date=${new Date().toISOString().split('T')[0]}`}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors"
                  >
                    Book This Train
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
