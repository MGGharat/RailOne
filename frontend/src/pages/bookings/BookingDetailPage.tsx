import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingApi } from '../../api/bookingApi';
import { Train, MapPin, Calendar, CreditCard, Users, Download, XCircle, ArrowLeft, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  '1A': 'First AC', '2A': 'Second AC', '3A': 'Third AC',
  'SL': 'Sleeper', 'CC': 'Chair Car', '2S': 'Second Sitting', 'EC': 'Exec Chair'
};

export function BookingDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: booking, isLoading, error } = useQuery({
    queryKey: ['booking', id],
    queryFn: () => bookingApi.getBookingDetails(id!),
    enabled: !!id,
  });

  const cancelMutation = useMutation({
    mutationFn: () => bookingApi.cancelBooking(id!),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['booking', id] }),
  });

  const handleDownload = async () => {
    if (!booking) return;
    try {
      const blob = await bookingApi.downloadTicketPdf(booking.pnr);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RailOne_${booking.pnr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Download failed. Please try again.');
    }
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  if (error || !booking) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
      <AlertCircle className="w-12 h-12 text-red-400" />
      <p className="text-slate-600">Booking not found.</p>
      <button onClick={() => navigate('/bookings')} className="text-blue-600 hover:underline">← Back to bookings</button>
    </div>
  );

  const isConfirmed = booking.status === 'CONFIRMED';

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back nav */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-6 text-sm font-medium">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>

        {/* Status banner */}
        <div className={`rounded-2xl p-5 mb-5 flex items-center justify-between ${
          booking.status === 'CONFIRMED' ? 'bg-emerald-600' :
          booking.status === 'CANCELLED' ? 'bg-red-500' :
          booking.status === 'COMPLETED' ? 'bg-slate-600' : 'bg-yellow-500'
        } text-white`}>
          <div>
            <div className="flex items-center gap-2 text-lg font-bold">
              {booking.status === 'CONFIRMED' && <CheckCircle className="w-5 h-5" />}
              {booking.status === 'CANCELLED' && <XCircle className="w-5 h-5" />}
              {booking.status === 'WAITLISTED' && <Clock className="w-5 h-5" />}
              {booking.status}
            </div>
            <div className="text-sm opacity-90 mt-0.5">PNR: <span className="font-mono font-bold">{booking.pnr}</span></div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold">₹{booking.total_amount.toFixed(0)}</div>
            <div className="text-xs opacity-80">{booking.booking_id}</div>
          </div>
        </div>

        {/* Train & route */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <Train className="w-5 h-5 text-blue-600" />
            <span className="font-bold text-slate-800">{booking.train_name}</span>
            <span className="text-xs text-slate-400 font-mono">{booking.train_number}</span>
          </div>

          <div className="grid grid-cols-3 items-center gap-4 bg-slate-50 rounded-xl p-4">
            <div>
              <div className="text-xl font-bold text-slate-900">{booking.departure_time}</div>
              <div className="text-sm font-semibold text-slate-700 mt-1">{booking.from_station.name}</div>
              <div className="text-xs text-slate-400">{booking.from_station.code} · {booking.from_station.city}</div>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="flex items-center gap-1 text-xs text-slate-400">
                <div className="h-px w-6 bg-slate-300" />
                <MapPin className="w-3.5 h-3.5" />
                <div className="h-px w-6 bg-slate-300" />
              </div>
              <div className="text-xs text-center text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(booking.journey_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
              </div>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold text-slate-900">{booking.arrival_time}</div>
              <div className="text-sm font-semibold text-slate-700 mt-1">{booking.to_station.name}</div>
              <div className="text-xs text-slate-400">{booking.to_station.code} · {booking.to_station.city}</div>
            </div>
          </div>

          <div className="flex gap-4 mt-3 text-sm text-slate-600">
            <span className="bg-slate-100 px-3 py-1 rounded-lg">{CLASS_LABELS[booking.coach_class] || booking.coach_class}</span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg">{booking.quota}</span>
            <span className="bg-slate-100 px-3 py-1 rounded-lg">{booking.total_passengers} Passenger{booking.total_passengers > 1 ? 's' : ''}</span>
          </div>
        </div>

        {/* Passengers */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" /> Passengers
          </h3>
          <div className="space-y-3">
            {booking.passengers.map((pax, i) => (
              <div key={pax.id} className="flex items-center justify-between bg-slate-50 rounded-xl p-3">
                <div>
                  <div className="font-semibold text-slate-800 text-sm">{pax.passenger_name}</div>
                  <div className="text-xs text-slate-500 mt-0.5">
                    {pax.passenger_age} yrs · {pax.passenger_gender}
                    {pax.coach_code && pax.seat_number && (
                      <> · <span className="font-mono font-medium text-blue-600">{pax.coach_code}/{pax.seat_number} {pax.berth_type}</span></>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">{pax.ticket_number}</div>
                </div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  pax.status === 'CONFIRMED' ? 'bg-emerald-100 text-emerald-700' :
                  pax.status === 'CANCELLED' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                }`}>
                  {pax.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Fare breakdown */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5 mb-4">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-blue-600" /> Fare Details
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-slate-600"><span>Base Fare</span><span>₹{booking.base_fare.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Taxes</span><span>₹{booking.taxes.toFixed(2)}</span></div>
            <div className="flex justify-between text-slate-600"><span>Convenience Fee</span><span>₹{booking.convenience_fee.toFixed(2)}</span></div>
            <div className="border-t pt-2 flex justify-between font-bold text-slate-900 text-base">
              <span>Total</span><span>₹{booking.total_amount.toFixed(2)}</span>
            </div>
            {booking.payment && (
              <div className="mt-2 text-xs text-slate-500 bg-emerald-50 rounded-lg p-2 border border-emerald-100">
                Payment: {booking.payment.payment_method} · {booking.payment.status} · Ref: {booking.payment.provider_ref}
              </div>
            )}
          </div>
        </div>

        {/* Refund info */}
        {booking.refund && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-4">
            <h3 className="font-bold text-slate-800 mb-3">Refund Information</h3>
            <div className="space-y-1.5 text-sm text-slate-700">
              <div className="flex justify-between"><span>Cancellation Fee</span><span>₹{booking.refund.cancellation_fee}</span></div>
              <div className="flex justify-between font-semibold text-emerald-700"><span>Refund Amount</span><span>₹{booking.refund.refund_amount}</span></div>
              <div className="flex justify-between text-xs text-slate-500"><span>Status</span><span>{booking.refund.status}</span></div>
              <div className="text-xs text-slate-400 font-mono">{booking.refund.refund_ref}</div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          {isConfirmed && (
            <>
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 rounded-xl transition-colors"
              >
                <Download className="w-4 h-4" /> Download PDF
              </button>
              <button
                onClick={() => {
                  if (confirm('Cancel this booking? Refund will be processed per cancellation policy.')) {
                    cancelMutation.mutate();
                  }
                }}
                disabled={cancelMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 font-semibold py-3 rounded-xl transition-colors disabled:opacity-50"
              >
                {cancelMutation.isPending ? <div className="w-4 h-4 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> : <XCircle className="w-4 h-4" />}
                Cancel Booking
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
