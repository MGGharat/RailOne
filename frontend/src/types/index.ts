export interface User {
  id: number;
  email: string;
  full_name: string;
  mobile: string;
  gender?: string;
  dob?: string;
  address?: string;
  role: 'USER' | 'ADMIN';
  is_active: boolean;
  created_at: string;
}

export interface Station {
  id: number;
  code: string;
  name: string;
  city: string;
  state: string;
  zone?: string;
  latitude?: number;
  longitude?: number;
  has_wifi: boolean;
  has_waiting_room: boolean;
  has_food_court: boolean;
}

export interface Availability {
  coach_class: string;
  available_seats: number;
  status: string;
  fare: number;
  tatkal_fare: number;
}

export interface ScheduleStop {
  stop_number: number;
  station_code: string;
  station_name: string;
  city: string;
  arrival_time?: string;
  departure_time?: string;
  day_offset: number;
  platform_number: string;
  distance_from_source_km: number;
  halt_duration_mins: number;
}

export interface TrainSearchItem {
  id: number;
  train_number: string;
  name: string;
  train_type: string;
  source_station: Station;
  destination_station: Station;
  from_station: Station;
  to_station: Station;
  departure_time: string;
  arrival_time: string;
  duration: string;
  running_days: string[];
  catering_available: boolean;
  availability: Availability[];
}

export interface TrainDetail {
  id: number;
  train_number: string;
  name: string;
  train_type: string;
  source_station: Station;
  destination_station: Station;
  runs_on_days: string;
  total_distance_km: number;
  catering_available: boolean;
  schedule: ScheduleStop[];
  availability: Availability[];
}

export interface PassengerProfile {
  id: number;
  user_id: number;
  full_name: string;
  age: number;
  gender: string;
  berth_preference: string;
  nationality: string;
  id_type: string;
  id_number_masked: string;
  created_at: string;
}

export interface BookingPassenger {
  id: number;
  passenger_name: string;
  passenger_age: number;
  passenger_gender: string;
  coach_code?: string;
  seat_number?: number;
  berth_type?: string;
  status: string;
  ticket_number: string;
}

export interface PaymentDetails {
  transaction_id: string;
  payment_method: string;
  amount: number;
  status: string;
  provider_ref: string;
  created_at: string;
}

export interface RefundDetails {
  refund_ref: string;
  cancellation_fee: number;
  refund_amount: number;
  status: string;
  initiated_at: string;
}

export interface Booking {
  id: number;
  pnr: string;
  booking_id: string;
  user_id: number;
  train_id: number;
  train_number: string;
  train_name: string;
  from_station: Station;
  to_station: Station;
  departure_time: string;
  arrival_time: string;
  journey_date: string;
  coach_class: string;
  quota: string;
  status: 'CONFIRMED' | 'WAITLISTED' | 'CANCELLED' | 'COMPLETED';
  total_passengers: number;
  base_fare: number;
  taxes: number;
  convenience_fee: number;
  total_amount: number;
  created_at: string;
  passengers: BookingPassenger[];
  payment?: PaymentDetails;
  refund?: RefundDetails;
  qr_code_data?: string;
}

export interface PNRPassenger {
  passenger_name: string;
  booking_status: string;
  current_status: string;
  coach_code?: string;
  seat_number?: number;
  berth_type?: string;
}

export interface PNRStatus {
  pnr: string;
  train_number: string;
  train_name: string;
  from_station: Station;
  to_station: Station;
  journey_date: string;
  chart_status: string;
  booking_status: string;
  coach_class: string;
  passengers: PNRPassenger[];
}

export interface LiveTimelineStop {
  station_code: string;
  station_name: string;
  city: string;
  scheduled_arrival?: string;
  scheduled_departure?: string;
  actual_arrival?: string;
  actual_departure?: string;
  platform: string;
  distance_km: number;
  status: 'DEPARTED' | 'CURRENT' | 'UPCOMING';
  delay_minutes: number;
}

export interface LiveTrainStatus {
  train_number: string;
  train_name: string;
  journey_date: string;
  current_station?: string;
  previous_station?: string;
  next_station?: string;
  status: string;
  overall_delay_minutes: number;
  timeline: LiveTimelineStop[];
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  created_at: string;
}

export interface FavouriteRoute {
  id: number;
  from_station: Station;
  to_station: Station;
  created_at: string;
}

export interface AdminStats {
  total_users: number;
  total_bookings: number;
  today_bookings: number;
  total_revenue: number;
  cancelled_tickets: number;
  active_trains: number;
  daily_trends: { date: string; bookings: number; revenue: number }[];
  popular_routes: { route: string; count: number }[];
  class_distribution: { class_name: string; count: number }[];
}
