import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { pnrApi } from '../../api/extraApis';
import { Search, Train, Calendar, CheckCircle2, Clock, Users, ArrowRight, AlertCircle } from 'lucide-react';

export function PNRStatusPage() {
  const [pnrInput, setPnrInput] = useState('');
  const [activePnr, setActivePnr] = useState('');

  const { data: pnrStatus, isLoading, isError, error } = useQuery({
    queryKey: ['pnrStatus', activePnr],
    queryFn: () => pnrApi.checkStatus(activePnr),
    enabled: !!activePnr && activePnr.length >= 6,
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (pnrInput.trim()) {
      setActivePnr(pnrInput.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <Search className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Check PNR Status</h1>
          <p className="text-slate-500 mt-1">Get real-time booking, confirmation, and coach status</p>
        </div>

        {/* Search Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Enter 10-digit or 8-character PNR number"
                value={pnrInput}
                onChange={(e) => setPnrInput(e.target.value)}
                className="w-full pl-4 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-mono text-base uppercase focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all"
              />
            </div>
            <button
              type="submit"
              disabled={!pnrInput.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white font-semibold px-6 py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Status
                </>
              )}
            </button>
          </form>
        </div>

        {/* Error message */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">PNR Not Found</h4>
              <p className="text-sm text-red-700 mt-0.5">
                {(error as any)?.response?.data?.error?.message ||
                  'Unable to retrieve status for this PNR. Please check the number and try again.'}
              </p>
            </div>
          </div>
        )}

        {/* Result Card */}
        {pnrStatus && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Header info */}
            <div className="bg-slate-900 text-white p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4 mb-4">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">PNR Number</span>
                  <div className="text-2xl font-mono font-bold text-white mt-0.5">{pnrStatus.pnr}</div>
                </div>
                <div className="flex gap-2">
                  <span className="px-3 py-1 bg-blue-500/20 text-blue-300 border border-blue-400/30 rounded-full text-xs font-semibold">
                    Chart: {pnrStatus.chart_status || 'PREPARED'}
                  </span>
                  <span className="px-3 py-1 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 rounded-full text-xs font-semibold">
                    {pnrStatus.booking_status || 'CONFIRMED'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 text-lg font-bold">
                    <Train className="w-5 h-5 text-blue-400" />
                    <span>{pnrStatus.train_name}</span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2 py-0.5 rounded font-mono">
                      #{pnrStatus.train_number}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                    <Calendar className="w-4 h-4" />
                    <span>Date of Journey: {pnrStatus.journey_date}</span>
                    <span>•</span>
                    <span>Class: {pnrStatus.coach_class}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Journey Route */}
            <div className="p-6 border-b border-slate-100 bg-slate-50/50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs uppercase text-slate-400 font-semibold">From</div>
                  <div className="text-lg font-bold text-slate-800">{pnrStatus.from_station.name}</div>
                  <div className="text-xs font-mono font-semibold text-blue-600">{pnrStatus.from_station.code}</div>
                </div>

                <div className="flex flex-col items-center px-4">
                  <div className="flex items-center gap-1 text-slate-300">
                    <div className="w-12 sm:w-24 h-0.5 bg-slate-300"></div>
                    <ArrowRight className="w-4 h-4 text-slate-400" />
                  </div>
                </div>

                <div className="text-right">
                  <div className="text-xs uppercase text-slate-400 font-semibold">To</div>
                  <div className="text-lg font-bold text-slate-800">{pnrStatus.to_station.name}</div>
                  <div className="text-xs font-mono font-semibold text-blue-600">{pnrStatus.to_station.code}</div>
                </div>
              </div>
            </div>

            {/* Passengers Table */}
            <div className="p-6">
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-blue-600" />
                Passenger Details
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                      <th className="pb-3">#</th>
                      <th className="pb-3">Passenger</th>
                      <th className="pb-3">Booking Status</th>
                      <th className="pb-3">Current Status</th>
                      <th className="pb-3">Coach / Seat</th>
                      <th className="pb-3">Berth</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {pnrStatus.passengers && pnrStatus.passengers.length > 0 ? (
                      pnrStatus.passengers.map((pax, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-3.5 text-slate-400 font-medium">{idx + 1}</td>
                          <td className="py-3.5 font-semibold text-slate-800">{pax.passenger_name}</td>
                          <td className="py-3.5 text-slate-600">{pax.booking_status}</td>
                          <td className="py-3.5">
                            <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              {pax.current_status}
                            </span>
                          </td>
                          <td className="py-3.5 font-mono font-semibold text-slate-700">
                            {pax.coach_code ? `${pax.coach_code} / ${pax.seat_number}` : 'Unassigned'}
                          </td>
                          <td className="py-3.5 text-slate-600 capitalize">
                            {pax.berth_type ? pax.berth_type.toLowerCase().replace('_', ' ') : '-'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-4 text-center text-slate-400">
                          No passenger details recorded
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
