export type Role = "admin" | "station_user";

export interface Station {
  id: string;
  name: string;
  location: string;
  created_at: string;
}

export interface Profile {
  id: string;
  role: Role;
  station_id: string | null;
  full_name: string;
  created_at: string;
}

export interface Client {
  id: string;
  name: string;
  contact_info: string;
  outstanding_balance: number;
  credit_balance: number;
  created_at: string;
}

export interface Vehicle {
  id: string;
  plate: string;
  client_id: string;
  created_at: string;
}

export interface FuelType {
  id: string;
  name: string;
  unit: string;
}

export interface Quota {
  id: string;
  client_id: string;
  fuel_type_id: string;
  amount_liters: number;
  period_type: "weekly" | "monthly" | "custom";
  period_start: string;
  period_end: string;
  scope: "single_station" | "network_wide";
  station_id: string | null;
  remaining_liters: number;
  current_period_start: string;
  current_period_end: string;
}

export interface Price {
  id: string;
  fuel_type_id: string;
  price_per_liter: number;
  effective_from: string;
  effective_to: string | null;
}

export interface FillUpTransaction {
  id: string;
  station_id: string;
  client_id: string;
  vehicle_id: string;
  fuel_type_id: string;
  liters: number;
  price_per_liter: number;
  total_price: number;
  is_overage: boolean;
  overage_request_id: string | null;
  created_at: string;
}

export interface OverageRequest {
  id: string;
  fill_up_transaction_id: string;
  client_id: string;
  overage_amount: number;
  status: "pending" | "approved" | "rejected";
  created_at: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

export interface Payment {
  id: string;
  client_id: string;
  amount: number;
  method: "cash" | "card" | "digital_wallet" | "bank_transfer";
  created_at: string;
  recorded_by: string;
}
