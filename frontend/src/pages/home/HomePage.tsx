import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeftRight,
  Search,
  Train,
  Calendar,
  ChevronDown,
  Clock,
  MapPin,
  Star,
  QrCode,
  Radio,
  Ticket,
  Heart,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Hourglass,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

import { StationAutocomplete } from '../../components/common/StationAutocomplete';
import { Station, Booking } from '../../types';
import { bookingApi } from '../../api/bookingApi';
import { favouriteApi } from '../../api/extraApis';
import { useAuth } from '../../context/AuthContext';

/* ─── helpers ─────────────────────────────────────────────────── */

/** Returns YYYY-MM-DD for today + offset days */
function dateOffset(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().split('T')[0];
}

const CLASS_OPTIONS: { value: string; label: string }[] = [
  { value: '', label: 'All Classes' },
  { value: 'SL', label: 'SL – Sleeper' },
  { value: '3A', label: '3A – AC 3 Tier' },
  { value: '2A', label: '2A – AC 2 Tier' },
  { value: '1A', label: '1A – AC First Class' },
  { value: 'CC', label: 'CC – Chair Car' },
];

const QUOTA_OPTIONS: { value: string; label: string }[] = [
  { value: 'GN', label: 'General' },
  { value: 'TQ', label: 'Tatkal' },
];

/* ─── status badge ─────────────────────────────────────────────── */

const STATUS_CONFIG: Record<
  Booking['status'],
  { label: string; icon: React.ReactNode; className: string }
> = {
  CONFIRMED: {
    label: 'Confirmed',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-emerald-50 text-emerald-700 border border-emerald-200',
  },
  WAITLISTED: {
    label: 'Waitlisted',
    icon: <Hourglass className="h-3.5 w-3.5" />,
    className: 'bg-amber-50 text-amber-700 border border-amber-200',
  },
  CANCELLED: {
    label: 'Cancelled',
    icon: <XCircle className="h-3.5 w-3.5" />,
    className: 'bg-red-50 text-red-700 border border-red-200',
  },
  COMPLETED: {
    label: 'Completed',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    className: 'bg-slate-100 text-slate-600 border border-slate-200',
  },
};

function StatusBadge({ status }: { status: Booking['status'] }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.CONFIRMED;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.className}`}
    >
      {cfg.icon}
      {cfg.label}
    </span>
  );
}

/* ─── booking card ─────────────────────────────────────────────── */

function RecentBookingCard({ booking }: { booking: Booking }) {
  const navigate = useNavigate();
  const dep = booking.departure_time
    ? new Date(`1970-01-01T${booking.departure_time}`).toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

  const formattedDate = booking.journey_date
    ? new Date(booking.journey_date).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    : '—';

  return (
    <button
      onClick={() => navigate(`/bookings/${booking.pnr}`)}
      className="group w-full text-left bg-white border border-slate-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      <div className="flex items-start justify-between gap-3">
        {/* Train info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <Train className="h-4 w-4 text-blue-600 flex-shrink-0" />
            <span className="font-semibold text-slate-800 text-sm truncate">
              {booking.train_name}
            </span>
            <span className="text-xs text-slate-400 font-mono flex-shrink-0">
              #{booking.train_number}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-2">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="font-medium text-slate-700">
              {booking.from_station.code}
            </span>
            <ArrowRight className="h-3 w-3" />
            <span className="font-medium text-slate-700">
              {booking.to_station.code}
            </span>
            <span className="text-slate-300 mx-0.5">·</span>
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{dep}</span>
            <span className="text-slate-300 mx-0.5">·</span>
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>{formattedDate}</span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <StatusBadge status={booking.status} />
            <span className="text-xs text-slate-400 font-mono">
              PNR: <span className="font-semibold text-slate-700">{booking.pnr}</span>
            </span>
            <span className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-semibold">
              {booking.coach_class}
            </span>
          </div>
        </div>

        {/* Amount */}
        <div className="text-right flex-shrink-0">
          <div className="text-base font-bold text-slate-800">
            ₹{booking.total_amount.toLocaleString('en-IN')}
          </div>
          <div className="text-xs text-slate-400">
            {booking.total_passengers} pax
          </div>
          <ArrowRight className="h-4 w-4 text-slate-300 group-hover:text-blue-500 ml-auto mt-1 transition-colors" />
        </div>
      </div>
    </button>
  );
}

/* ─── main component ───────────────────────────────────────────── */

export const HomePage: React.FC = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();

  /* form state */
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [journeyDate, setJourneyDate] = useState<string>(dateOffset(1));
  const [coachClass, setCoachClass] = useState<string>('');
  const [quota, setQuota] = useState<string>('GN');
  const [formError, setFormError] = useState<string>('');

  /* recent bookings */
  const { data: bookings, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => bookingApi.getMyBookings(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  /* favourite routes */
  const { data: favourites } = useQuery({
    queryKey: ['favouriteRoutes'],
    queryFn: () => favouriteApi.getFavourites(),
    enabled: isAuthenticated,
    staleTime: 60_000,
  });

  const recentBookings = bookings?.slice(0, 3) ?? [];
  const hasFavourites = (favourites?.length ?? 0) > 0;

  /* swap stations */
  const handleSwap = () => {
    setFromStation(toStation);
    setToStation(fromStation);
    setFormError('');
  };

  /* search submit */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fromStation) {
      setFormError('Please select a departure station.');
      return;
    }
    if (!toStation) {
      setFormError('Please select a destination station.');
      return;
    }
    if (fromStation.id === toStation.id) {
      setFormError('Departure and destination stations cannot be the same.');
      return;
    }
    if (!journeyDate) {
      setFormError('Please select a journey date.');
      return;
    }

    const normalizedQuota = quota === 'TQ' || quota === 'TATKAL' ? 'TATKAL' : 'GENERAL';
    const params = new URLSearchParams({
      from_station_id: String(fromStation.id),
      to_station_id: String(toStation.id),
      from_code: fromStation.code,
      to_code: toStation.code,
      from_name: fromStation.name,
      to_name: toStation.name,
      journey_date: journeyDate,
      quota: normalizedQuota,
      ...(coachClass ? { coach_class: coachClass } : {}),
    });

    navigate(`/search?${params.toString()}`);
  };

  /* quick-fill from a favourite route */
  const applyFavourite = (fav: { from_station: Station; to_station: Station }) => {
    setFromStation(fav.from_station);
    setToStation(fav.to_station);
    setFormError('');
  };

  /* ── render ── */
  return (
    <div className="min-h-screen bg-slate-50">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-800 pb-32 pt-12">
        {/* decorative circles */}
        <div className="pointer-events-none absolute -top-24 -right-24 h-96 w-96 rounded-full bg-white/5 blur-3xl" />
        <div className="pointer-events-none absolute bottom-0 -left-20 h-72 w-72 rounded-full bg-blue-500/20 blur-3xl" />

        {/* pattern overlay */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg,transparent,transparent 40px,white 40px,white 41px),repeating-linear-gradient(90deg,transparent,transparent 40px,white 40px,white 41px)',
          }}
        />

        <div className="relative mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          {/* RailOne Brand pill */}
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 backdrop-blur-md border border-white/10">
              <Train className="h-4 w-4 text-blue-200" />
              <span className="text-sm font-extrabold text-white tracking-wide">
                Rail<span className="text-blue-300">One</span>
              </span>
              <span className="text-xs text-blue-200">· Super App</span>
            </div>
            {user && (
              <div className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-xs text-blue-100 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5 text-yellow-300" />
                Welcome back, {user.full_name.split(' ')[0]}!
              </div>
            )}
          </div>

          {/* headline */}
          <h1 className="mb-2 text-3xl font-black tracking-tight text-white sm:text-5xl">
            Book Train Tickets
          </h1>
          <p className="mb-8 text-base sm:text-lg text-blue-100 font-medium">
            India's trusted railway booking platform · Instant seat availability &amp; reservations
          </p>

          {/* ─── SEARCH CARD ─── */}
          <div className="relative rounded-2xl bg-white shadow-2xl shadow-black/30">
            {/* card header stripe */}
            <div className="flex items-center gap-2 rounded-t-2xl border-b border-slate-100 bg-slate-50 px-6 py-3">
              <Train className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-semibold text-slate-600 uppercase tracking-wide">
                Find Trains
              </span>
            </div>

            <form onSubmit={handleSearch} noValidate>
              <div className="p-5 sm:p-6">
                {/* row 1: stations + swap */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto_1fr]">
                  {/* FROM */}
                  <StationAutocomplete
                    label="From Station"
                    value={fromStation}
                    onChange={(s) => { setFromStation(s); setFormError(''); }}
                    placeholder="Departure city or station"
                  />

                  {/* SWAP */}
                  <div className="flex items-end justify-center pb-0.5">
                    <button
                      type="button"
                      onClick={handleSwap}
                      className="group flex h-10 w-10 items-center justify-center rounded-full border-2 border-slate-200 bg-white text-slate-400 transition-all duration-200 hover:border-blue-400 hover:bg-blue-50 hover:text-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                      aria-label="Swap stations"
                    >
                      <ArrowLeftRight className="h-4 w-4 transition-transform group-hover:scale-110" />
                    </button>
                  </div>

                  {/* TO */}
                  <StationAutocomplete
                    label="To Station"
                    value={toStation}
                    onChange={(s) => { setToStation(s); setFormError(''); }}
                    placeholder="Destination city or station"
                  />
                </div>

                {/* row 2: date, class, quota */}
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {/* Journey Date */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Journey Date
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Calendar className="h-4 w-4" />
                      </div>
                      <input
                        type="date"
                        value={journeyDate}
                        min={dateOffset(0)}
                        onChange={(e) => { setJourneyDate(e.target.value); setFormError(''); }}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  {/* Class */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Class
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Train className="h-4 w-4" />
                      </div>
                      <select
                        value={coachClass}
                        onChange={(e) => setCoachClass(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                      >
                        {CLASS_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>

                  {/* Quota */}
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">
                      Quota
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                        <Star className="h-4 w-4" />
                      </div>
                      <select
                        value={quota}
                        onChange={(e) => setQuota(e.target.value)}
                        className="w-full pl-9 pr-8 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-slate-800 font-medium appearance-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
                      >
                        {QUOTA_OPTIONS.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-400">
                        <ChevronDown className="h-4 w-4" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* error */}
                {formError && (
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-sm text-red-700">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {formError}
                  </div>
                )}

                {/* submit */}
                <div className="mt-5">
                  <button
                    type="submit"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3.5 text-base font-bold text-white shadow-lg shadow-blue-600/30 transition-all duration-200 hover:bg-blue-700 hover:shadow-blue-700/40 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 active:scale-[0.98]"
                  >
                    <Search className="h-5 w-5 transition-transform group-hover:scale-110" />
                    Search Trains
                  </button>
                </div>
              </div>
            </form>
          </div>

          {/* favourite routes quick-fill */}
          {hasFavourites && (
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="flex items-center gap-1 text-xs text-blue-200">
                <Heart className="h-3 w-3 text-rose-300" /> Favourites:
              </span>
              {favourites!.slice(0, 4).map((fav) => (
                <button
                  key={fav.id}
                  type="button"
                  onClick={() => applyFavourite(fav)}
                  className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-blue-100 backdrop-blur-sm transition hover:bg-white/20"
                >
                  {fav.from_station.code} → {fav.to_station.code}
                </button>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════ QUICK FEATURES STRIP ═══════════════ */}
      <section className="relative mx-auto -mt-16 max-w-5xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {/* PNR Status */}
          <Link
            to="/pnr"
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-lg shadow-slate-200/60 border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 hover:border-blue-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-100 transition-colors">
              <QrCode className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">PNR Status</div>
              <div className="text-xs text-slate-400 mt-0.5">Check booking</div>
            </div>
          </Link>

          {/* Live Train Status */}
          <Link
            to="/live-status"
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-lg shadow-slate-200/60 border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 hover:border-emerald-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600 group-hover:bg-emerald-100 transition-colors">
              <Radio className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Live Status</div>
              <div className="text-xs text-slate-400 mt-0.5">Track your train</div>
            </div>
          </Link>

          {/* Favourite Routes */}
          <Link
            to="/?tab=favourites"
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-lg shadow-slate-200/60 border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 hover:border-rose-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-500 group-hover:bg-rose-100 transition-colors">
              <Heart className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">Favourite Routes</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {hasFavourites ? `${favourites!.length} saved` : 'Save routes'}
              </div>
            </div>
          </Link>

          {/* My Bookings */}
          <Link
            to="/bookings"
            className="group flex flex-col items-center gap-2 rounded-2xl bg-white p-5 text-center shadow-lg shadow-slate-200/60 border border-slate-100 transition-all duration-200 hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80 hover:border-amber-200"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 group-hover:bg-amber-100 transition-colors">
              <Ticket className="h-6 w-6" />
            </div>
            <div>
              <div className="text-sm font-bold text-slate-800">My Bookings</div>
              <div className="text-xs text-slate-400 mt-0.5">
                {bookings ? `${bookings.length} total` : 'View all'}
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* ═══════════════ RECENT BOOKINGS ═══════════════ */}
      <section className="mx-auto mt-10 max-w-5xl px-4 pb-16 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-5 w-1 rounded-full bg-blue-600" />
            <h2 className="text-lg font-bold text-slate-800">Recent Bookings</h2>
          </div>
          <Link
            to="/bookings"
            className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* loading */}
        {bookingsLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-24 rounded-xl bg-slate-200 animate-pulse"
              />
            ))}
          </div>
        )}

        {/* bookings list */}
        {!bookingsLoading && recentBookings.length > 0 && (
          <div className="space-y-3">
            {recentBookings.map((b) => (
              <RecentBookingCard key={b.id} booking={b} />
            ))}
          </div>
        )}

        {/* empty state */}
        {!bookingsLoading && recentBookings.length === 0 && (
          <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white py-14 text-center">
            <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <Ticket className="h-8 w-8 text-slate-400" />
            </div>
            <p className="text-base font-semibold text-slate-700">No bookings yet</p>
            <p className="mt-1 text-sm text-slate-400">
              Search for a train above and book your first ticket!
            </p>
            <button
              type="button"
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="mt-5 flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-blue-700 transition-colors"
            >
              <Search className="h-4 w-4" /> Search Trains
            </button>
          </div>
        )}
      </section>

      {/* ═══════════════ TRUST BAR ═══════════════ */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 text-center text-xs text-slate-500">
            {[
              { icon: <Train className="h-5 w-5" />, title: '1000+ Trains', sub: 'Across India' },
              { icon: <CheckCircle2 className="h-5 w-5" />, title: 'Instant Confirmation', sub: 'Real-time updates' },
              { icon: <Star className="h-5 w-5" />, title: '4.8★ Rating', sub: 'Trusted by millions' },
              { icon: <Clock className="h-5 w-5" />, title: '24/7 Support', sub: 'Always available' },
            ].map((item) => (
              <div key={item.title} className="flex flex-col items-center gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                  {item.icon}
                </div>
                <span className="font-semibold text-slate-700 text-sm">{item.title}</span>
                <span>{item.sub}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
