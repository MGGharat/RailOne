import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../api/client';
import { trainApi } from '../../api/trainApi';
import { CheckCircle2, Search, Train, Calendar, Ticket, AlertCircle } from 'lucide-react';

export function AvailabilityPage() {
  const [trainNumber, setTrainNumber] = useState('12951');
  const [coachClass, setCoachClass] = useState('3A');
  const [journeyDate, setJourneyDate] = useState(
    new Date(Date.now() + 86400000).toISOString().split('T')[0]
  );
  const [quota, setQuota] = useState('GENERAL');
  const [searched, setSearched] = useState(true);

  // Fetch trains list for dropdown
  const { data: trains = [] } = useQuery({
    queryKey: ['trainsListSimple'],
    queryFn: async () => {
      const res = await api.get('/trains');
      return res.data.data;
    }
  });

  // Fetch availability
  const { data: availData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['seatAvailCheck', trainNumber, coachClass, journeyDate, quota],
    queryFn: async () => {
      const res = await api.get(`/trains/${trainNumber}/availability`, {
        params: { coach_class: coachClass, journey_date: journeyDate, quota }
      });
      return res.data.data;
    },
    enabled: searched && !!trainNumber
  });

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    setSearched(true);
    refetch();
  };

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center p-3 bg-blue-50 text-blue-600 rounded-2xl mb-3">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Seat Availability Inquiry</h1>
          <p className="text-slate-500 mt-1">Check real-time confirmed, RAC & waitlist berths before booking</p>
        </div>

        {/* Inquiry Card */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <form onSubmit={handleCheck} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Select Train
                </label>
                <select
                  value={trainNumber}
                  onChange={(e) => setTrainNumber(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  {trains.map((t: any) => (
                    <option key={t.id} value={t.train_number}>
                      {t.train_number} - {t.name}
                    </option>
                  ))}
                  {trains.length === 0 && <option value="12951">12951 - Mumbai Rajdhani</option>}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Class
                </label>
                <select
                  value={coachClass}
                  onChange={(e) => setCoachClass(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="1A">1A - AC First Class</option>
                  <option value="2A">2A - AC 2-Tier</option>
                  <option value="3A">3A - AC 3-Tier</option>
                  <option value="SL">SL - Sleeper Class</option>
                  <option value="CC">CC - AC Chair Car</option>
                  <option value="2S">2S - Second Sitting</option>
                  <option value="EC">EC - Exec Chair Car</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Journey Date
                </label>
                <input
                  type="date"
                  value={journeyDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setJourneyDate(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Quota
                </label>
                <select
                  value={quota}
                  onChange={(e) => setQuota(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
                >
                  <option value="GENERAL">General Quota (GN)</option>
                  <option value="TATKAL">Tatkal Quota (TQ)</option>
                  <option value="LADIES">Ladies Quota (LD)</option>
                  <option value="SENIOR_CITIZEN">Lower Berth / Senior Citizen</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Checking Berths...
                </>
              ) : (
                <>
                  <Search className="w-4 h-4" />
                  Check Availability
                </>
              )}
            </button>
          </form>
        </div>

        {/* Results */}
        {availData && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase">Availability Status</span>
                <div className="text-2xl font-extrabold text-slate-900 mt-0.5">
                  {availData.status}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold text-slate-400 uppercase">Base Fare</span>
                <div className="text-2xl font-extrabold text-blue-600 mt-0.5">
                  ₹{availData.fare}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 pt-5 text-center">
              <div className="p-3 bg-emerald-50 rounded-xl">
                <div className="text-xs font-semibold text-emerald-800 uppercase">Available Berths</div>
                <div className="text-2xl font-bold text-emerald-700 mt-1">{availData.available ?? 0}</div>
              </div>

              <div className="p-3 bg-amber-50 rounded-xl">
                <div className="text-xs font-semibold text-amber-800 uppercase">RAC Seats</div>
                <div className="text-2xl font-bold text-amber-700 mt-1">{availData.rac ?? 0}</div>
              </div>

              <div className="p-3 bg-slate-100 rounded-xl">
                <div className="text-xs font-semibold text-slate-700 uppercase">Waitlist</div>
                <div className="text-2xl font-bold text-slate-700 mt-1">{availData.waiting ?? 0}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
