import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api/bookingApi';
import { Booking } from '../../types';
import { Link } from 'react-router-dom';
import { Train, Calendar, ChevronRight, Download, XCircle, Clock, CheckCircle, AlertCircle, Search } from 'lucide-react';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  CONFIRMED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle className="w-3.5 h-3.5" /> },
  WAITLISTED: { label: 'Waitlisted', color: 'bg-yellow-100 text-yellow-700', icon: <Clock className="w-3.5 h-3.5" /> },
  CANCELLED: { label: 'Cancelled', color: 'bg-red-100 text-red-700', icon: <XCircle className="w-3.5 h-3.5" /> },
  COMPLETED: { label: 'Completed', color: 'bg-slate-100 text-slate-600', icon: <CheckCircle className="w-3.5 h-3.5" /> },
};

const CLASS_LABELS: Record<string, string> = {
  '1A': 'First AC', '2A': 'Second AC', '3A': 'Third AC',
  'SL': 'Sleeper', 'CC': 'Chair Car', '2S': 'Second Sitting', 'EC': 'Exec Chair'
};

export function MyBookingsPage() {
  const [filter, setFilter] = useState<string>('');
  const [search, setSearch] = useState('');
  const qc = useQueryClient();

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ['myBookings', filter],
    queryFn: () => bookingApi.getMyBookings(filter || undefined),
  });

  const cancelMutation = useMutation({
    mutationFn: (id: string) => bookingApi.cancelBooking(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myBookings'] }),
  });

  const handleDownload = async (booking: Booking) => {
    try {
      const blob = await bookingApi.downloadTicketPdf(booking.pnr);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RailOne_${booking.pnr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download ticket. Please try again.');
    }
  };

  const filtered = bookings.filter((b) =>
    !search || b.pnr.toLowerCase().includes(search.toLowerCase()) ||
    b.train_name.toLowerCase().includes(search.toLowerCase()) ||
    b.booking_id.toLowerCase().includes(search.toLowerCase())
  );

  const tabs = ['', 'UPCOMING', 'COMPLETED', 'CANCELLED'];

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6">My Bookings</h1>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-6">
          <div className="flex gap-2 bg-white rounded-xl border border-slate-200 p-1">
            {tabs.map((t) => (
              <button
                key={t}
                onClick={() => setFilter(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                  filter === t ? 'bg-blue-600 text-white' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {t === '' ? 'All' : t.charAt(0) + t.slice(1).toLowerCase()}
              </button>
            ))}
          </div>
          <div className="relative flex-1 min-w-48">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search by PNR or train..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!isLoading && filtered.length === 0 && (
          <div className="text-center py-20">
            <Train className="w-16 h-16 text-slate-200 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-600 mb-2">No bookings found</h3>
            <p className="text-slate-400 text-sm mb-6">Book your first train ticket today!</p>
            <Link to="/" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
              Search Trains
            </Link>
          </div>
        )}

        <div className="space-y-4">
          {filtered.map((booking) => {
            const cfg = STATUS_CONFIG[booking.status] || STATUS_CONFIG.CONFIRMED;
            return (
              <div key={booking.id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden hover:shadow-md transition-shadow">
                <div className="p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-800">{booking.train_name}</span>
                        <span className="text-xs text-slate-400 font-mono">{booking.train_number}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <span className="font-semibold">{booking.from_station.code}</span>
                        <span className="text-slate-300">→</span>
                        <span className="font-semibold">{booking.to_station.code}</span>
                        <span className="text-slate-400">·</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(booking.journey_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full ${cfg.color}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-xs text-slate-500 bg-slate-50 rounded-xl p-3 mb-4">
                    <div><div className="font-semibold text-slate-700 text-sm">{booking.pnr}</div><div>PNR</div></div>
                    <div><div className="font-semibold text-slate-700 text-sm">{CLASS_LABELS[booking.coach_class] || booking.coach_class}</div><div>Class</div></div>
                    <div><div className="font-semibold text-slate-700 text-sm">₹{booking.total_amount.toFixed(0)}</div><div>Amount</div></div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      to={`/bookings/${booking.pnr}`}
                      className="flex-1 flex items-center justify-center gap-1 text-sm font-semibold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 py-2 rounded-xl transition-colors"
                    >
                      View Details <ChevronRight className="w-4 h-4" />
                    </Link>

                    {booking.status === 'CONFIRMED' && (
                      <>
                        <button
                          onClick={() => handleDownload(booking)}
                          className="flex items-center gap-1 text-sm font-semibold text-slate-600 border border-slate-200 hover:bg-slate-100 py-2 px-3 rounded-xl transition-colors"
                          title="Download ticket"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm('Cancel this booking? Cancellation charges may apply.')) {
                              cancelMutation.mutate(booking.pnr);
                            }
                          }}
                          disabled={cancelMutation.isPending}
                          className="flex items-center gap-1 text-sm font-semibold text-red-600 border border-red-200 hover:bg-red-50 py-2 px-3 rounded-xl transition-colors disabled:opacity-50"
                          title="Cancel booking"
                        >
                          <XCircle className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {booking.status === 'CANCELLED' && booking.refund && (
                      <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200">
                        <AlertCircle className="w-3.5 h-3.5" />
                        Refund: ₹{booking.refund.refund_amount}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
