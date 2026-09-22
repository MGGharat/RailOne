import api from './client';
import { Booking } from '../types';

export interface CreateBookingPayload {
  train_id: number;
  from_station_id: number;
  to_station_id: number;
  journey_date: string;
  coach_class: string;
  quota?: string;
  payment_method?: string;
  passengers: {
    full_name: string;
    age: number;
    gender: string;
    berth_preference?: string;
  }[];
}

export interface CancellationResult {
  booking_id: string;
  pnr: string;
  status: string;
  cancellation_fee: number;
  refund_amount: number;
  refund_status: string;
  refund_ref: string;
}

export const bookingApi = {
  createBooking: async (payload: CreateBookingPayload): Promise<Booking> => {
    const res = await api.post('/bookings', payload);
    return res.data.data;
  },

  getMyBookings: async (status?: string): Promise<Booking[]> => {
    const params = status ? { status } : {};
    const res = await api.get('/bookings', { params });
    return res.data.data;
  },

  getBookingDetails: async (idOrPnr: string): Promise<Booking> => {
    const res = await api.get(`/bookings/${idOrPnr}`);
    return res.data.data;
  },

  cancelBooking: async (idOrPnr: string): Promise<CancellationResult> => {
    const res = await api.post(`/bookings/${idOrPnr}/cancel`);
    return res.data.data;
  },

  downloadTicketPdf: async (idOrPnr: string): Promise<Blob> => {
    const res = await api.get(`/bookings/${idOrPnr}/ticket-pdf`, {
      responseType: 'blob'
    });
    return res.data;
  }
};
