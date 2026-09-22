import api from './client';
import { PassengerProfile, PNRStatus, LiveTrainStatus, Notification, FavouriteRoute, AdminStats } from '../types';

export const passengerApi = {
  getPassengers: async (): Promise<PassengerProfile[]> => {
    const res = await api.get('/passengers');
    return res.data.data;
  },

  createPassenger: async (pax: Omit<PassengerProfile, 'id' | 'user_id' | 'created_at'>): Promise<PassengerProfile> => {
    const res = await api.post('/passengers', pax);
    return res.data.data;
  },

  updatePassenger: async (id: number, pax: Partial<PassengerProfile>): Promise<PassengerProfile> => {
    const res = await api.put(`/passengers/${id}`, pax);
    return res.data.data;
  },

  deletePassenger: async (id: number): Promise<void> => {
    await api.delete(`/passengers/${id}`);
  }
};

export const pnrApi = {
  checkStatus: async (pnr: string): Promise<PNRStatus> => {
    const res = await api.get(`/pnr/${pnr}`);
    return res.data.data;
  }
};

export const liveStatusApi = {
  getLiveStatus: async (trainNumber: string, journeyDate?: string): Promise<LiveTrainStatus> => {
    const params = journeyDate ? { journey_date: journeyDate } : {};
    const res = await api.get(`/live-status/${trainNumber}`, { params });
    return res.data.data;
  }
};

export const notificationApi = {
  getNotifications: async (): Promise<Notification[]> => {
    const res = await api.get('/notifications');
    return res.data.data;
  },

  markRead: async (id: number): Promise<Notification> => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data.data;
  },

  markAllRead: async (): Promise<{ updated_count: number }> => {
    const res = await api.put('/notifications/read-all');
    return res.data.data;
  }
};

export const favouriteApi = {
  getFavourites: async (): Promise<FavouriteRoute[]> => {
    const res = await api.get('/favourites');
    return res.data.data;
  },

  addFavourite: async (from_station_id: number, to_station_id: number): Promise<FavouriteRoute> => {
    const res = await api.post('/favourites', { from_station_id, to_station_id });
    return res.data.data;
  },

  removeFavourite: async (id: number): Promise<void> => {
    await api.delete(`/favourites/${id}`);
  }
};

export const adminApi = {
  getDashboardStats: async (): Promise<AdminStats> => {
    const res = await api.get('/admin/dashboard');
    return res.data.data;
  },

  getUsers: async (q?: string, role?: string): Promise<any[]> => {
    const res = await api.get('/admin/users', { params: { q, role } });
    return res.data.data;
  },

  getAllBookings: async (status?: string, q?: string): Promise<any[]> => {
    const res = await api.get('/admin/bookings', { params: { status, q } });
    return res.data.data;
  },

  getAuditLogs: async (): Promise<any[]> => {
    const res = await api.get('/admin/audit-logs');
    return res.data.data;
  },

  createStation: async (data: any): Promise<any> => {
    const res = await api.post('/admin/stations', data);
    return res.data.data;
  },

  createTrain: async (data: any): Promise<any> => {
    const res = await api.post('/admin/trains', data);
    return res.data.data;
  }
};

export const fareApi = {
  calculateFare: async (params: {
    train_id?: number;
    train_number?: string;
    from_station_id?: number;
    to_station_id?: number;
    coach_class?: string;
    quota?: string;
    passengers_count?: number;
  }): Promise<{
    train_id?: number;
    train_number?: string;
    coach_class: string;
    quota: string;
    passengers_count: number;
    breakdown: {
      base_fare: number;
      reservation_charge: number;
      superfast_surcharge: number;
      tatkal_surcharge: number;
      gst: number;
      total_per_passenger: number;
    };
    total_fare: number;
  }> => {
    const res = await api.get('/fares/calculate', { params });
    return res.data.data;
  }
};
