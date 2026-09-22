import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { liveStatusApi } from '../../api/extraApis';
import { Activity, Train, Calendar, Clock, MapPin, AlertCircle, ArrowUpRight, CheckCircle2 } from 'lucide-react';

export function LiveStatusPage() {
  const [trainInput, setTrainInput] = useState('');
  const [activeTrain, setActiveTrain] = useState('');
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: statusData, isLoading, isError, error } = useQuery({
    queryKey: ['liveStatus', activeTrain, journeyDate],
    queryFn: () => liveStatusApi.getLiveStatus(activeTrain, journeyDate),
    enabled: !!activeTrain,
    retry: false
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (trainInput.trim()) {
      setActiveTrain(trainInput.trim().toUpperCase());
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-emerald-50 text-emerald-600 rounded-2xl mb-3">
            <Activity className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Live Train Running Status</h1>
          <p className="text-slate-500 mt-1">Real-time GPS tracking, arrival/departure delays & platform updates</p>
        </div>

        {/* Search Bar */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Train Number or Name
              </label>
              <input
                type="text"
                placeholder="e.g. 12951, 12009, 22221"
                value={trainInput}
                onChange={(e) => setTrainInput(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Journey Date
              </label>
              <input
                type="date"
                value={journeyDate}
                onChange={(e) => setJourneyDate(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-emerald-600 focus:bg-white transition-all"
              />
            </div>
            <div className="sm:col-span-3">
              <button
                type="submit"
                disabled={!trainInput.trim() || isLoading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Fetching Live Position...
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4" />
                    Track Train
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Error message */}
        {isError && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-semibold text-red-900">Tracking Info Unavailable</h4>
              <p className="text-sm text-red-700 mt-0.5">
                {(error as any)?.response?.data?.error?.message ||
                  'Could not find live running status for this train. Please verify the train number.'}
              </p>
            </div>
          </div>
        )}

        {/* Results */}
        {statusData && (
          <div className="space-y-6">
            {/* Overview Card */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <Train className="w-6 h-6 text-emerald-600" />
                    <span>{statusData.train_name}</span>
                    <span className="text-sm font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      #{statusData.train_number}
                    </span>
                  </div>
                  <div className="text-sm text-slate-500 mt-1 flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    <span>Journey Date: {statusData.journey_date}</span>
                  </div>
                </div>

                <div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-bold ${
                      statusData.overall_delay_minutes > 0
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    <Clock className="w-4 h-4" />
                    {statusData.overall_delay_minutes > 0
                      ? `Running Late by ${statusData.overall_delay_minutes} min`
                      : 'Running On Time'}
                  </span>
                </div>
              </div>

              {/* Station Indicators */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs uppercase font-semibold text-slate-400">Last Departed Station</div>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    {statusData.previous_station || 'Origin Station'}
                  </div>
                </div>
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                  <div className="text-xs uppercase font-bold text-emerald-700">Current Position</div>
                  <div className="text-base font-bold text-emerald-900 mt-1 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-emerald-600 animate-bounce" />
                    {statusData.current_station || 'In Transit'}
                  </div>
                </div>
                <div className="p-4 bg-slate-50 rounded-xl">
                  <div className="text-xs uppercase font-semibold text-slate-400">Next Upcoming Station</div>
                  <div className="text-base font-bold text-slate-800 mt-1">
                    {statusData.next_station || 'Destination Station'}
                  </div>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                <Clock className="w-5 h-5 text-emerald-600" />
                Route Schedule & Live Timeline
              </h3>

              <div className="relative pl-6 sm:pl-8 space-y-6 before:absolute before:left-2.5 sm:before:left-3.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200">
                {statusData.timeline && statusData.timeline.map((stop, idx) => {
                  const isDeparted = stop.status === 'DEPARTED';
                  const isCurrent = stop.status === 'CURRENT';

                  return (
                    <div key={idx} className="relative group">
                      {/* Status Node */}
                      <div
                        className={`absolute -left-6 sm:-left-8 top-1 w-5 h-5 rounded-full border-2 bg-white flex items-center justify-center transition-all ${
                          isCurrent
                            ? 'border-emerald-600 ring-4 ring-emerald-100 bg-emerald-600'
                            : isDeparted
                            ? 'border-emerald-600 bg-emerald-500 text-white'
                            : 'border-slate-300'
                        }`}
                      >
                        {isDeparted && <CheckCircle2 className="w-3 h-3 text-white" />}
                        {isCurrent && <div className="w-2 h-2 rounded-full bg-white animate-ping" />}
                      </div>

                      <div
                        className={`p-4 rounded-xl border transition-all ${
                          isCurrent
                            ? 'bg-emerald-50/70 border-emerald-300 shadow-sm'
                            : 'bg-white border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-slate-900">{stop.station_name}</span>
                              <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                                {stop.station_code}
                              </span>
                              <span className="text-xs text-slate-500">PF {stop.platform || '1'}</span>
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {stop.city} • {stop.distance_km} km from origin
                            </div>
                          </div>

                          <div className="flex items-center gap-6 text-sm">
                            <div>
                              <div className="text-xs text-slate-400">Scheduled</div>
                              <div className="font-semibold text-slate-700">
                                {stop.scheduled_arrival || stop.scheduled_departure || '--:--'}
                              </div>
                            </div>

                            <div>
                              <div className="text-xs text-slate-400">Actual/Expected</div>
                              <div
                                className={`font-bold ${
                                  stop.delay_minutes > 0 ? 'text-amber-600' : 'text-emerald-600'
                                }`}
                              >
                                {stop.actual_arrival || stop.actual_departure || '--:--'}
                              </div>
                            </div>

                            <span
                              className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                                isDeparted
                                  ? 'bg-slate-100 text-slate-600'
                                  : isCurrent
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-blue-50 text-blue-700'
                              }`}
                            >
                              {stop.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
