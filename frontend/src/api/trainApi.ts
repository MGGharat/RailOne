import api from './client';
import { Station, TrainSearchItem, TrainDetail, Availability } from '../types';

export const stationApi = {
  getStations: async (query?: string): Promise<Station[]> => {
    const params = query ? { q: query } : {};
    const res = await api.get('/stations', { params });
    return res.data.data;
  },

  getStationById: async (id: number): Promise<Station> => {
    const res = await api.get(`/stations/${id}`);
    return res.data.data;
  }
};

export const trainApi = {
  searchTrains: async (params: {
    from_station_id?: number;
    from_code?: string;
    to_station_id?: number;
    to_code?: string;
    journey_date: string;
    coach_class?: string;
    quota?: string;
  }): Promise<TrainSearchItem[]> => {
    const res = await api.get('/trains/search', { params });
    return res.data.data;
  },

  getTrainDetail: async (idOrNumber: string, journeyDate?: string): Promise<TrainDetail> => {
    const params = journeyDate ? { journey_date: journeyDate } : {};
    const res = await api.get(`/trains/${idOrNumber}`, { params });
    return res.data.data;
  },

  getAvailability: async (id: number, coach_class: string, journey_date: string, quota?: string): Promise<Availability> => {
    const res = await api.get(`/trains/${id}/availability`, {
      params: { coach_class, journey_date, quota }
    });
    return res.data.data;
  }
};
