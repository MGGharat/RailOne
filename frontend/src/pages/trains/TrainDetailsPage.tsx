import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trainApi } from '../../api/trainApi';
import { Train, Clock, MapPin, Calendar, Utensils, ArrowLeft, ArrowRight, ShieldCheck, Ticket } from 'lucide-react';

export function TrainDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const [journeyDate, setJourneyDate] = useState(new Date().toISOString().split('T')[0]);

  const { data: train, isLoading, error } = useQuery({
    queryKey: ['trainDetail', id, journeyDate],
    queryFn: () => trainApi.getTrainDetail(id!, journeyDate),
    enabled: !!id
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error || !train) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 text-center">
        <Train className="w-16 h-16 text-slate-300 mx-auto mb-3" />
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Train Not Found</h2>
        <p className="text-slate-500 mb-6">Could not load details for train ID/number "{id}".</p>
        <Link to="/trains" className="text-blue-600 font-semibold hover:underline">
          &larr; Back to Trains Catalog
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-5xl mx-auto">
        <Link
          to="/trains"
          className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-900 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Trains
        </Link>

        {/* Hero Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 sm:p-8 shadow-sm mb-8">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-5 mb-5">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-mono font-bold text-blue-400 bg-blue-500/20 px-2.5 py-1 rounded">
                  #{train.train_number}
                </span>
                <span className="text-xs font-semibold px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full">
                  {train.train_type}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold">{train.name}</h1>
            </div>

            <Link
              to={`/search?from_code=${train.source_station.code}&to_code=${train.destination_station.code}&journey_date=${journeyDate}`}
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-colors flex items-center gap-2 shadow-lg shadow-blue-900/30"
            >
              <Ticket className="w-4 h-4" />
              Book Tickets
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div className="bg-slate-800/60 rounded-xl p-4">
              <div className="text-xs text-slate-400 font-semibold uppercase">Origin Station</div>
              <div className="text-lg font-bold mt-0.5">{train.source_station.name}</div>
              <div className="text-xs text-blue-400 font-mono">{train.source_station.code}</div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 flex flex-col justify-center items-center text-center">
              <div className="text-xs text-slate-400 font-semibold uppercase mb-1">Total Distance</div>
              <div className="text-xl font-bold">{train.total_distance_km} km</div>
              <div className="text-xs text-slate-400 mt-0.5">Runs on: {train.runs_on_days}</div>
            </div>

            <div className="bg-slate-800/60 rounded-xl p-4 sm:text-right">
              <div className="text-xs text-slate-400 font-semibold uppercase">Destination Station</div>
              <div className="text-lg font-bold mt-0.5">{train.destination_station.name}</div>
              <div className="text-xs text-blue-400 font-mono">{train.destination_station.code}</div>
            </div>
          </div>
        </div>

        {/* Classes & Availability */}
        {train.availability && train.availability.length > 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm mb-8">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Ticket className="w-5 h-5 text-blue-600" />
                Classes & Fare Structure
              </h2>
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-500 font-semibold">Journey Date:</label>
                <input
                  type="date"
                  value={journeyDate}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {train.availability.map((avail) => (
                <div key={avail.coach_class} className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="text-xs font-bold text-slate-500 uppercase">Class {avail.coach_class}</div>
                  <div className="text-xl font-extrabold text-slate-900 mt-1">₹{avail.fare}</div>
                  <div className="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block">
                    {avail.status}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Route Schedule Table */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-600" />
            Complete Route & Intermediate Stops
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 text-xs uppercase font-semibold">
                  <th className="pb-3">#</th>
                  <th className="pb-3">Station</th>
                  <th className="pb-3">Code</th>
                  <th className="pb-3">Arrival</th>
                  <th className="pb-3">Departure</th>
                  <th className="pb-3">Halt</th>
                  <th className="pb-3">Distance</th>
                  <th className="pb-3">Platform</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {train.schedule && train.schedule.map((stop) => (
                  <tr key={stop.stop_number} className="hover:bg-slate-50 transition-colors">
                    <td className="py-3 text-slate-400 font-medium">{stop.stop_number}</td>
                    <td className="py-3 font-semibold text-slate-800">
                      {stop.station_name}
                      <span className="text-xs text-slate-400 font-normal ml-1">({stop.city})</span>
                    </td>
                    <td className="py-3 font-mono font-bold text-blue-600 text-xs">{stop.station_code}</td>
                    <td className="py-3 text-slate-700 font-medium">{stop.arrival_time || 'Origin'}</td>
                    <td className="py-3 text-slate-700 font-medium">{stop.departure_time || 'Destination'}</td>
                    <td className="py-3 text-slate-500 text-xs">
                      {stop.halt_duration_mins ? `${stop.halt_duration_mins} min` : '-'}
                    </td>
                    <td className="py-3 text-slate-500 text-xs">{stop.distance_from_source_km} km</td>
                    <td className="py-3">
                      <span className="font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded text-xs">
                        PF {stop.platform_number || '1'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
