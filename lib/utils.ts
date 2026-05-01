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

export function normalizeNumber(value: string): string {
  return value.replace(/\D/g, '');
}

export function normalizePhone(value: string): string {
  let cleaned = value.replace(/\D/g, '');
  if (cleaned.startsWith('55') && cleaned.length > 11) {
    cleaned = cleaned.substring(2);
  }
  return cleaned;
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

export function maskCPF(value: string): string {
  const v = normalizeNumber(value).slice(0, 11);
  if (v.length <= 3) return v;
  if (v.length <= 6) return v.replace(/(\d{3})(\d{0,3})/, '$1.$2');
  if (v.length <= 9) return v.replace(/(\d{3})(\d{3})(\d{0,3})/, '$1.$2.$3');
  return v.replace(/(\d{3})(\d{3})(\d{3})(\d{0,2})/, '$1.$2.$3-$4');
}

export function maskCNPJ(value: string): string {
  const v = normalizeNumber(value).slice(0, 14);
  if (v.length <= 2) return v;
  if (v.length <= 5) return v.replace(/(\d{2})(\d{0,3})/, '$1.$2');
  if (v.length <= 8) return v.replace(/(\d{2})(\d{3})(\d{0,3})/, '$1.$2.$3');
  if (v.length <= 12) return v.replace(/(\d{2})(\d{3})(\d{3})(\d{0,4})/, '$1.$2.$3/$4');
  return v.replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{0,2})/, '$1.$2.$3/$4-$5');
}

export function validateCPF(value: string): boolean {
  const cpf = normalizeNumber(value);
  return cpf.length === 11;
}

export function validateCNPJ(value: string): boolean {
  const cnpj = normalizeNumber(value);
  return cnpj.length === 14;
}
