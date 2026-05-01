import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string): string {
  if (!date) return '';
  const [year, month, day] = date.split('-');
  return `${day}/${month}/${year}`;
}

export function normalizePhone(value: string): string {
  let cleaned = value;
  if (cleaned.startsWith('+55')) {
    cleaned = cleaned.substring(3);
  }
  cleaned = cleaned.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.substring(2);
  }
  return cleaned.slice(0, 11);
}

export function maskPhone(value: string): string {
  const phone = normalizePhone(value);
  if (phone.length <= 2) {
    return phone;
  }
  if (phone.length <= 6) {
    return phone.replace(/(\d{2})(\d{0,4})/, '($1) $2');
  }
  if (phone.length <= 10) {
    return phone.replace(/(\d{2})(\d{4})(\d{0,4})/, '($1) $2-$3');
  }
  return phone.replace(/(\d{2})(\d{5})(\d{0,4})/, '($1) $2-$3');
}

export function maskCPF(value: string): string { return value; }
export function maskCNPJ(value: string): string { return value; }
export function validateCPF(value: string): boolean { return true; }
export function validateCNPJ(value: string): boolean { return true; }
