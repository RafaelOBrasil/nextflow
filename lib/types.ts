export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
}

export interface Barber {
  id: string;
  name: string;
  role: string;
  avatar: string;
}

export interface Customer {
  name: string;
  phone: string;
}

export interface Appointment {
  id: string;
  shopId: string;
  customerName: string;
  customerPhone: string;
  serviceId: string;
  barberId: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'completed';
}

export type ReviewStatus = 'pending' | 'approved' | 'approved_for_display';

export interface Review {
  id: string;
  appointmentId: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
  status: ReviewStatus;
}

export interface PlanFeature {
  id: string;
  name: string;
  description: string;
  key: string;
}

export interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  discount?: number;
  monthlyPlanId?: string;
  features: string[];
  maxAppointments: number | null; // null for unlimited
  isPopular?: boolean;
}

export interface Subscription {
  id: string;
  shopId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'unpaid' | 'trial';
  currentPeriodEnd: string;
  mercadoPagoSubscriptionId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BarberShop {
  id: string;
  slug: string;
  name: string;
  description: string;
  address: string;
  phone: string;
  document?: string; // CPF or CNPJ
  logo?: string;
  banner?: string;
  services: Service[];
  barbers: Barber[];
  appointments: Appointment[];
  reviews?: Review[];
  adminEmail?: string;
  adminPassword?: string;
  status?: 'active' | 'blocked' | 'trial' | 'expired';
  planId?: string;
  subscriptions?: Subscription[];
  createdAt?: string;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
}
