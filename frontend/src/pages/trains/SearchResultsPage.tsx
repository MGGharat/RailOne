import { useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { trainApi } from '../../api/trainApi';
import { TrainSearchItem, Station } from '../../types';
import { Train, Clock, ChevronRight, Utensils, ArrowRight, Search, AlertCircle, Calendar, RefreshCw } from 'lucide-react';
import { useState } from 'react';
import { StationAutocomplete } from '../../components/common/StationAutocomplete';

const CLASS_LABELS: Record<string, string> = {
  '1A': 'First AC', '2A': 'Second AC', '3A': 'Third AC',
  'SL': 'Sleeper', 'CC': 'Chair Car', '2S': 'Second Sitting', 'EC': 'Exec Chair'
};

const STATUS_COLORS: Record<string, string> = {
  AVAILABLE: 'bg-emerald-100 text-emerald-700 border-emerald-300',
  RAC: 'bg-amber-100 text-amber-800 border-amber-300',
  WL: 'bg-rose-100 text-rose-700 border-rose-300',
};

function getStatusColor(status: string) {
  if (status.startsWith('AVAILABLE')) return STATUS_COLORS.AVAILABLE;
  if (status.startsWith('RAC')) return STATUS_COLORS.RAC;
  return STATUS_COLORS.WL;
}

export function SearchResultsPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const [selectedClass, setSelectedClass] = useState<string>(params.get('coach_class') || '');
  const [showModifySearch, setShowModifySearch] = useState<boolean>(false);

  // Parse all possible URL parameters
  const fromIdParam = params.get('from_station_id');
  const toIdParam = params.get('to_station_id');
  const fromCodeParam = params.get('from_code') || params.get('from');
  const toCodeParam = params.get('to_code') || params.get('to');

  const fromId = fromIdParam ? Number(fromIdParam) : undefined;
  const toId = toIdParam ? Number(toIdParam) : undefined;
  const fromCode = fromCodeParam || undefined;
  const toCode = toCodeParam || undefined;
  const journeyDate = params.get('journey_date') || new Date().toISOString().split('T')[0];
  const quota = params.get('quota') || 'GENERAL';

  // Inline search form states
  const [fromStation, setFromStation] = useState<Station | null>(null);
  const [toStation, setToStation] = useState<Station | null>(null);
  const [inlineDate, setInlineDate] = useState<string>(journeyDate);

  const hasSearchParams = Boolean((fromId || fromCode) && (toId || toCode) && journeyDate);

  const { data: trains = [], isLoading, error, refetch } = useQuery({
    queryKey: ['trainSearch', fromId, fromCode, toId, toCode, journeyDate, selectedClass, quota],
    queryFn: () =>
      trainApi.searchTrains({
        from_station_id: fromId,
        from_code: fromCode,
        to_station_id: toId,
        to_code: toCode,
        journey_date: journeyDate,
        coach_class: selectedClass || undefined,
        quota,
      }),
    enabled: hasSearchParams,
  });

  const handleBook = (train: TrainSearchItem, cls: string) => {
    const sp = new URLSearchParams({
      train_id: String(train.id),
      from_station_id: String(train.from_station.id || fromId || ''),
      to_station_id: String(train.to_station.id || toId || ''),
      from_name: train.from_station.name,
      from_code: train.from_station.code,
      to_name: train.to_station.name,
      to_code: train.to_station.code,
      journey_date: journeyDate,
      coach_class: cls,
      quota,
    });
    navigate(`/book/${train.id}?${sp.toString()}`);
  };

  const executeInlineSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromStation || !toStation) return;
    const sp = new URLSearchParams({
      from_station_id: String(fromStation.id),
      to_station_id: String(toStation.id),
      from_code: fromStation.code,
      to_code: toStation.code,
      from_name: fromStation.name,
      to_name: toStation.name,
      journey_date: inlineDate,
      quota,
      ...(selectedClass ? { coach_class: selectedClass } : {}),
    });
    setShowModifySearch(false);
    navigate(`/search?${sp.toString()}`);
  };

  const fromDisplayName = params.get('from_name') || fromCode || (fromId ? `Station #${fromId}` : 'Origin');
  const toDisplayName = params.get('to_name') || toCode || (toId ? `Station #${toId}` : 'Destination');

  const dateLabel = journeyDate
    ? new Date(journeyDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
    : '';

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header bar */}
      <div className="bg-slate-900 text-white py-4 px-4 shadow-md">
        <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              <span>{fromDisplayName}</span>
              <ArrowRight className="w-4 h-4 text-blue-400" />
              <span>{toDisplayName}</span>
            </div>
            <div className="text-sm text-slate-400 mt-0.5">{dateLabel} · Quota: {quota}</div>
          </div>
          <button
            onClick={() => setShowModifySearch(!showModifySearch)}
            className="flex items-center gap-2 text-sm bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            <Search className="w-4 h-4" /> {showModifySearch ? 'Close' : 'Modify Search'}
          </button>
        </div>

        {/* Inline modify search drawer */}
        {showModifySearch && (
          <div className="max-w-5xl mx-auto mt-4 p-4 bg-slate-800 rounded-xl border border-slate-700">
            <form onSubmit={executeInlineSearch} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Departure</label>
                <StationAutocomplete
                  label=""
                  placeholder="Select source station"
                  value={fromStation}
                  onChange={setFromStation}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Destination</label>
                <StationAutocomplete
                  label=""
                  placeholder="Select destination station"
                  value={toStation}
                  onChange={setToStation}
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Journey Date</label>
                <input
                  type="date"
                  value={inlineDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setInlineDate(e.target.value)}
                  className="w-full h-11 px-3 rounded-lg bg-white text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="submit"
                  disabled={!fromStation || !toStation}
                  className="w-full h-11 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                >
                  <Search className="w-4 h-4" /> Search Trains
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      {/* Class filter strip */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-3 flex gap-2 overflow-x-auto">
          {['', 'SL', '3A', '2A', '1A', 'CC', '2S', 'EC'].map((cls) => (
            <button
              key={cls}
              onClick={() => setSelectedClass(cls)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                selectedClass === cls
                  ? 'bg-blue-600 text-white shadow'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cls === '' ? 'All Classes' : CLASS_LABELS[cls] || cls}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {!hasSearchParams && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-xl mx-auto text-center">
            <Train className="w-12 h-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-xl font-bold text-slate-800 mb-2">Find Your Train</h2>
            <p className="text-sm text-slate-500 mb-6">Select origin and destination stations to search live schedules and seat availability.</p>
            <form onSubmit={executeInlineSearch} className="space-y-4 text-left">
              <StationAutocomplete
                label="Departure Station"
                placeholder="Search station or city"
                value={fromStation}
                onChange={setFromStation}
              />
              <StationAutocomplete
                label="Destination Station"
                placeholder="Search station or city"
                value={toStation}
                onChange={setToStation}
              />
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1">Date of Journey</label>
                <input
                  type="date"
                  value={inlineDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setInlineDate(e.target.value)}
                  className="w-full h-11 px-3 border border-slate-300 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <button
                type="submit"
                disabled={!fromStation || !toStation}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white font-bold rounded-xl transition-colors"
              >
                Search Trains
              </button>
            </form>
          </div>
        )}

        {isLoading && (
          <div className="flex flex-col items-center py-20 gap-3">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-500 font-medium">Searching RailOne schedules & seat availability...</p>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-xl p-4 text-red-700">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span>Could not load trains for this route. Please check your query or try another date.</span>
            </div>
            <button onClick={() => refetch()} className="text-sm font-semibold underline flex items-center gap-1">
              <RefreshCw className="w-4 h-4" /> Retry
            </button>
          </div>
        )}

        {hasSearchParams && !isLoading && !error && trains.length === 0 && (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center max-w-xl mx-auto">
            <Train className="w-14 h-14 text-slate-300 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-800 mb-1">No direct trains found</h3>
            <p className="text-slate-500 text-sm mb-4">
              We couldn't find trains between <span className="font-semibold">{fromDisplayName}</span> and <span className="font-semibold">{toDisplayName}</span> on {dateLabel}.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 justify-center">
              <button
                onClick={() => setShowModifySearch(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
              >
                Modify Station or Date
              </button>
              <button
                onClick={() => navigate('/trains')}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-semibold transition-colors"
              >
                Browse Train Catalog
              </button>
            </div>
          </div>
        )}

        {hasSearchParams && !isLoading && trains.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-600 font-medium">
                Found <span className="font-bold text-slate-900">{trains.length} train(s)</span> for your journey
              </p>
            </div>
            {trains.map((train) => (
              <TrainCard key={train.id} train={train} onBook={handleBook} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function TrainCard({ train, onBook }: { train: TrainSearchItem; onBook: (t: TrainSearchItem, cls: string) => void }) {
  // Expanded by default so availability and book buttons are immediately actionable
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Train header */}
      <div className="p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Train className="w-5 h-5 text-blue-600 shrink-0" />
              <span className="font-bold text-slate-900 text-base">{train.name}</span>
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                #{train.train_number}
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded font-semibold border border-blue-100">
                {train.train_type}
              </span>
            </div>
            <div className="flex items-center gap-4 text-sm text-slate-700 mt-2">
              <div>
                <span className="text-lg font-bold text-slate-900">{train.departure_time}</span>
                <span className="text-xs text-slate-500 block">{train.from_station.name} ({train.from_station.code})</span>
              </div>
              <div className="flex flex-col items-center px-2">
                <span className="text-xs text-slate-400 font-medium flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {train.duration}
                </span>
                <div className="w-24 h-0.5 bg-slate-200 relative my-1">
                  <div className="w-2 h-2 rounded-full bg-blue-600 absolute -top-0.75 left-0" />
                  <div className="w-2 h-2 rounded-full bg-blue-600 absolute -top-0.75 right-0" />
                </div>
                <span className="text-[10px] text-emerald-600 font-medium">Direct</span>
              </div>
              <div>
                <span className="text-lg font-bold text-slate-900">{train.arrival_time}</span>
                <span className="text-xs text-slate-500 block">{train.to_station.name} ({train.to_station.code})</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs text-slate-500">
            {train.catering_available && (
              <span className="flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                <Utensils className="w-3 h-3" /> Catering Available
              </span>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-blue-600 hover:text-blue-800 font-semibold text-xs mt-1"
            >
              {expanded ? 'Hide class options' : 'View all class options'}
              <ChevronRight className={`w-3.5 h-3.5 transition-transform ${expanded ? 'rotate-90' : ''}`} />
            </button>
          </div>
        </div>

        {/* Running days pills */}
        <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-slate-100">
          <span className="text-[11px] font-semibold text-slate-400 mr-1">Runs:</span>
          {['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'].map((d) => (
            <span
              key={d}
              className={`text-[10px] px-1.5 py-0.5 rounded font-bold ${
                train.running_days.includes(d) || train.running_days.includes('DAILY') || train.running_days.includes('ALL')
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-slate-100 text-slate-300'
              }`}
            >
              {d}
            </span>
          ))}
        </div>
      </div>

      {/* Class availability grid */}
      {expanded && (
        <div className="border-t border-slate-200 px-5 py-4 bg-slate-50/80">
          {train.availability && train.availability.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {train.availability.map((avail) => (
                <div
                  key={avail.coach_class}
                  className="bg-white rounded-xl border border-slate-200 p-3.5 flex flex-col justify-between shadow-xs hover:border-blue-400 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {CLASS_LABELS[avail.coach_class] || avail.coach_class}
                        <span className="ml-1 text-xs text-slate-500 font-mono">({avail.coach_class})</span>
                      </div>
                      <div className="text-base font-extrabold text-slate-900 mt-1">₹{Math.round(avail.fare)}</div>
                    </div>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-bold border ${getStatusColor(avail.status)}`}>
                      {avail.status}
                    </span>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 font-medium">
                      {avail.available_seats > 0 ? `${avail.available_seats} seats` : 'Waitlisted'}
                    </span>
                    <button
                      onClick={() => onBook(train, avail.coach_class)}
                      className="bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-bold px-3.5 py-1.5 rounded-lg transition-colors shadow-xs"
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500 italic">No coach class availability listed for this date.</p>
          )}
        </div>
      )}
    </div>
  );
}
