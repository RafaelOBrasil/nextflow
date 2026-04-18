import { BarberShop } from './types';

export type ShopStatus = 'active' | 'blocked' | 'trial' | 'expired';

export interface Subscription {
  id: string;
  shopId: string;
  planId: string;
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

export interface Payment {
  id: string;
  shopId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'pending' | 'failed';
  method: 'credit_card' | 'pix' | 'bank_transfer';
  date: string;
  description: string;
}

export interface SuperUser {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'support' | 'viewer';
  avatar?: string;
}

export interface SupportTicket {
  id: string;
  shopId: string;
  userId: string;
  subject: string;
  description: string;
  status: 'open' | 'in_progress' | 'closed';
  priority: 'low' | 'medium' | 'high';
  category: string;
  createdAt: string;
  updatedAt: string;
  shop?: { name: string; slug: string };
  user?: { name: string; email: string };
  messages?: TicketMessage[];
  _count?: { messages: number };
}

export interface TicketMessage {
  id: string;
  content: string;
  isAdmin: boolean;
  ticketId: string;
  userId: string;
  user?: { name: string; email: string; role: string };
  createdAt: string;
}

export interface SystemLog {
  id: string;
  userId: string;
  action: string;
  target: string;
  details: string;
  timestamp: string;
  type: 'info' | 'warning' | 'error' | 'security';
}

export interface SaaSStats {
  totalMRR: number;
  activeShops: number;
  totalAppointments: number;
  newShopsThisMonth: number;
  churnRate: number;
  revenueByMonth: { month: string; amount: number }[];
}

export interface ExtendedBarberShop extends BarberShop {
  status: ShopStatus;
  planId: string;
  createdAt: string;
  lastLogin?: string;
}
