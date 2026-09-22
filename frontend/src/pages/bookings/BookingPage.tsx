import { useState } from 'react';
import { useSearchParams, useNavigate, useParams, Link } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { bookingApi, CreateBookingPayload } from '../../api/bookingApi';
import { fareApi } from '../../api/extraApis';
import { trainApi } from '../../api/trainApi';
import { Plus, Minus, Train, ArrowRight, Calendar, CreditCard, AlertCircle, CheckCircle, Download, ExternalLink, Home } from 'lucide-react';

const CLASS_LABELS: Record<string, string> = {
  '1A': 'First AC', '2A': 'Second AC', '3A': 'Third AC',
  'SL': 'Sleeper', 'CC': 'Chair Car', '2S': 'Second Sitting', 'EC': 'Exec Chair'
};

const BASE_FARES: Record<string, number> = {
  '1A': 2900, '2A': 1800, '3A': 1200, 'SL': 450, 'CC': 800, '2S': 180, 'EC': 1500
};

interface PassengerInput {
  full_name: string;
  age: number | '';
  gender: string;
  berth_preference: string;
}

const emptyPassenger = (): PassengerInput => ({
  full_name: '', age: '', gender: 'MALE', berth_preference: 'NO_PREFERENCE'
});

export function BookingPage() {
  const [params] = useSearchParams();
  const pathParams = useParams<{ trainId?: string }>();
  const navigate = useNavigate();

  const trainId = Number(pathParams.trainId || params.get('train_id') || 0);

  // Fetch train detail if station information is missing from query params
  const { data: trainDetail } = useQuery({
    queryKey: ['trainDetail', trainId],
    queryFn: () => trainApi.getTrainDetail(String(trainId)),
    enabled: !!trainId,
  });

  const fromStationId = Number(params.get('from_station_id')) || trainDetail?.source_station?.id || 0;
  const toStationId = Number(params.get('to_station_id')) || trainDetail?.destination_station?.id || 0;
  const journeyDate = params.get('journey_date') || new Date(Date.now() + 86400000).toISOString().split('T')[0];
  const coachClass = params.get('coach_class') || 'SL';
  const quota = params.get('quota') || 'GENERAL';
  const fromName = params.get('from_name') || trainDetail?.source_station?.name || '';
  const fromCode = params.get('from_code') || trainDetail?.source_station?.code || '';
  const toName = params.get('to_name') || trainDetail?.destination_station?.name || '';
  const toCode = params.get('to_code') || trainDetail?.destination_station?.code || '';

  const [passengers, setPassengers] = useState<PassengerInput[]>([emptyPassenger()]);
  const [paymentMethod, setPaymentMethod] = useState<string>('UPI');
  const [errors, setErrors] = useState<string[]>([]);
  const [confirmedBooking, setConfirmedBooking] = useState<any>(null);

  // Live fare calculation from backend
  const { data: fareData } = useQuery({
    queryKey: ['fareCalc', trainId, coachClass, quota, passengers.length],
    queryFn: () =>
      fareApi.calculateFare({
        train_id: trainId,
        coach_class: coachClass,
        quota,
        passengers_count: passengers.length,
      }),
    enabled: !!trainId,
  });

  const baseFare = fareData ? fareData.breakdown.base_fare : (BASE_FARES[coachClass] || 500);
  const taxes = fareData ? fareData.breakdown.gst : Math.round(baseFare * 0.05);
  const resFee = fareData ? (fareData.breakdown.reservation_charge + fareData.breakdown.superfast_surcharge) : 35.40;
  const total = fareData ? fareData.total_fare : (baseFare + taxes + resFee) * passengers.length;

  const addPassenger = () => {
    if (passengers.length < 6) setPassengers([...passengers, emptyPassenger()]);
  };

  const removePassenger = (i: number) => {
    if (passengers.length > 1) setPassengers(passengers.filter((_, idx) => idx !== i));
  };

  const updatePassenger = (i: number, field: keyof PassengerInput, value: string | number) => {
    setPassengers(passengers.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  };

  const validate = (): boolean => {
    const errs: string[] = [];
    passengers.forEach((p, i) => {
      if (!p.full_name.trim()) errs.push(`Passenger ${i + 1}: Name is required`);
      if (!p.age || Number(p.age) < 1 || Number(p.age) > 120) errs.push(`Passenger ${i + 1}: Valid age (1-120) is required`);
      if (!p.gender) errs.push(`Passenger ${i + 1}: Gender is required`);
    });
    setErrors(errs);
    return errs.length === 0;
  };

  const mutation = useMutation({
    mutationFn: (payload: CreateBookingPayload) => bookingApi.createBooking(payload),
    onSuccess: (booking) => {
      setConfirmedBooking(booking);
    },
    onError: (err: any) => {
      const msg = err?.response?.data?.error?.message || err?.response?.data?.detail || 'Booking failed. Please try again.';
      setErrors([msg]);
    },
  });

  const handleDownloadPdf = async (pnr: string) => {
    try {
      const blob = await bookingApi.downloadTicketPdf(pnr);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `RailOne_${pnr}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert('Could not download ticket PDF. Please view booking details.');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    mutation.mutate({
      train_id: trainId,
      from_station_id: fromStationId,
      to_station_id: toStationId,
      journey_date: journeyDate,
      coach_class: coachClass,
      quota,
      payment_method: paymentMethod,
      passengers: passengers.map((p) => ({
        full_name: p.full_name.trim(),
        age: Number(p.age),
        gender: p.gender,
        berth_preference: p.berth_preference,
      })),
    });
  };

  if (confirmedBooking) {
    return (
      <div className="min-h-screen bg-slate-50 py-12 px-4 flex items-center justify-center">
        <div className="max-w-lg w-full bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden text-center p-8">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner">
            <CheckCircle className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-extrabold text-slate-900 mb-1">Booking Confirmed!</h2>
          <p className="text-slate-500 text-sm mb-6">Your RailOne electronic ticket has been successfully booked.</p>

          {/* PNR card */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 mb-6 text-left">
            <div className="flex justify-between items-center mb-3 pb-3 border-b border-slate-800">
              <span className="text-xs text-slate-400 font-semibold tracking-wider uppercase">PNR NUMBER</span>
              <span className="font-mono text-xl font-bold tracking-widest text-emerald-400">{confirmedBooking.pnr}</span>
            </div>
            <div className="space-y-1.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">Train:</span>
                <span className="font-medium text-white">{confirmedBooking.train?.name || `Train #${trainId}`} ({confirmedBooking.train?.train_number || 'Express'})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Class & Quota:</span>
                <span className="font-medium text-white">{confirmedBooking.coach_class} · {confirmedBooking.quota}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Journey Date:</span>
                <span className="font-medium text-white">{confirmedBooking.journey_date}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 font-semibold">
                <span className="text-slate-400">Total Paid:</span>
                <span className="text-emerald-400 text-base">₹{Number(confirmedBooking.total_amount).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleDownloadPdf(confirmedBooking.pnr)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" /> Download RailOne E-Ticket (PDF)
            </button>
            <button
              onClick={() => navigate(`/bookings/${confirmedBooking.pnr}`)}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2 shadow-sm"
            >
              <ExternalLink className="w-4 h-4" /> View Complete Ticket & Passengers
            </button>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold py-3 px-4 rounded-xl text-sm transition-colors flex items-center justify-center gap-2"
            >
              <Home className="w-4 h-4" /> Book Another Ticket
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Journey summary */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 mb-6 shadow-md">
          <div className="flex items-center gap-2 mb-3 text-blue-400 text-xs font-bold uppercase tracking-wider">
            <Train className="w-4 h-4" />
            <span>RailOne Journey Summary</span>
          </div>
          <div className="flex items-center gap-4 text-lg font-bold">
            <span>{fromName || fromCode || 'Source'} <span className="text-slate-400 text-sm font-mono">({fromCode || fromStationId})</span></span>
            <ArrowRight className="w-5 h-5 text-blue-400" />
            <span>{toName || toCode || 'Destination'} <span className="text-slate-400 text-sm font-mono">({toCode || toStationId})</span></span>
          </div>
          <div className="flex gap-4 mt-3 text-sm text-slate-300 font-medium">
            <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4 text-blue-400" />{journeyDate}</span>
            <span>·</span>
            <span>{CLASS_LABELS[coachClass] || coachClass} ({coachClass})</span>
            <span>·</span>
            <span>{quota} Quota</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Passengers form */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-bold text-slate-900 text-base">Passenger Details</h3>
                <p className="text-xs text-slate-500">Enter passenger name as shown on official photo ID</p>
              </div>
              <button
                type="button"
                onClick={addPassenger}
                disabled={passengers.length >= 6}
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 font-bold disabled:text-slate-300 transition-colors"
              >
                <Plus className="w-4 h-4" /> Add ({passengers.length}/6)
              </button>
            </div>

            <div className="space-y-4">
              {passengers.map((p, i) => (
                <div key={i} className="border border-slate-200 rounded-xl p-4 bg-slate-50/80">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">Passenger #{i + 1}</span>
                    {i > 0 && (
                      <button
                        type="button"
                        onClick={() => removePassenger(i)}
                        className="text-red-500 hover:text-red-700 p-1 text-xs flex items-center gap-0.5 font-medium"
                      >
                        <Minus className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Full Name *</label>
                      <input
                        type="text"
                        value={p.full_name}
                        onChange={(e) => updatePassenger(i, 'full_name', e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. Ramesh Patel"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Age *</label>
                      <input
                        type="number"
                        value={p.age}
                        min={1}
                        max={120}
                        onChange={(e) => updatePassenger(i, 'age', e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="e.g. 28"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-slate-600">Gender *</label>
                      <select
                        value={p.gender}
                        onChange={(e) => updatePassenger(i, 'gender', e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="MALE">Male</option>
                        <option value="FEMALE">Female</option>
                        <option value="TRANSGENDER">Transgender / Other</option>
                      </select>
                    </div>
                    <div className="col-span-2">
                      <label className="text-xs font-semibold text-slate-600">Berth Preference</label>
                      <select
                        value={p.berth_preference}
                        onChange={(e) => updatePassenger(i, 'berth_preference', e.target.value)}
                        className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        <option value="NO_PREFERENCE">No Preference</option>
                        <option value="LOWER">Lower Berth</option>
                        <option value="MIDDLE">Middle Berth</option>
                        <option value="UPPER">Upper Berth</option>
                        <option value="SIDE_LOWER">Side Lower</option>
                        <option value="SIDE_UPPER">Side Upper</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-base">
              <CreditCard className="w-5 h-5 text-blue-600" /> Select Payment Method
            </h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                { id: 'UPI', label: 'UPI / QR' },
                { id: 'CARD', label: 'Credit / Debit Card' },
                { id: 'NET_BANKING', label: 'Net Banking' },
                { id: 'WALLET', label: 'RailOne Wallet' }
              ].map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPaymentMethod(m.id)}
                  className={`p-3 rounded-xl border-2 text-xs font-bold transition-all text-center ${
                    paymentMethod === m.id
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-xs'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Fare breakdown summary */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
            <h3 className="font-bold text-slate-900 mb-3 text-base">Fare Breakdown</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Base Ticket Fare ({passengers.length} × ₹{baseFare.toFixed(2)})</span>
                <span className="font-medium text-slate-900">₹{(baseFare * passengers.length).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Reservation & Superfast Surcharge</span>
                <span className="font-medium text-slate-900">₹{(resFee * passengers.length).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST & Statutory Taxes</span>
                <span className="font-medium text-slate-900">₹{(taxes * passengers.length).toFixed(2)}</span>
              </div>
              <div className="border-t border-slate-200 pt-3 flex justify-between font-extrabold text-slate-900 text-lg">
                <span>Total Payable</span>
                <span className="text-blue-600">₹{total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Errors alert */}
          {errors.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
              <div className="flex items-start gap-2 text-rose-700">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <ul className="text-sm space-y-1">
                  {errors.map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={mutation.isPending}
            className="w-full bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:bg-blue-300 text-white font-bold py-4 rounded-2xl text-lg transition-colors flex items-center justify-center gap-2 shadow-md cursor-pointer"
          >
            {mutation.isPending ? (
              <><div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing Payment...</>
            ) : (
              <>Pay ₹{total.toFixed(2)} & Confirm Booking</>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
