import type { Plan, PlanFeature } from './types';

export const ALL_FEATURES: PlanFeature[] = [
  { id: 'f1', key: 'online_booking', name: 'Página de agendamento online', description: 'Página exclusiva para seus clientes agendarem horários.' },
  { id: 'f2', key: 'service_management', name: 'Cadastro de serviços', description: 'Cadastre e gerencie seus serviços e preços.' },
  { id: 'f3', key: 'digital_agenda', name: 'Agenda digital', description: 'Controle todos os seus agendamentos em um só lugar.' },
  { id: 'f4', key: 'whatsapp_confirmation', name: 'Confirmação via WhatsApp', description: 'Confirme agendamentos diretamente pelo WhatsApp.' },
  { id: 'f5', key: 'client_management', name: 'Gestão de clientes', description: 'Mantenha um cadastro dos seus clientes.' },
  { id: 'f6', key: 'schedule_blocking', name: 'Bloqueio de horários', description: 'Bloqueie horários em que não poderá atender.' },
  { id: 'f7', key: 'whatsapp_reminders', name: 'Lembrete de agendamento', description: 'Envie lembretes automáticos para seus clientes.' },
  { id: 'f8', key: 'appointment_history', name: 'Histórico de atendimentos', description: 'Acesse o histórico completo de cada cliente.' },
  { id: 'f9', key: 'reports', name: 'Relatórios de agendamentos', description: 'Acompanhe o desempenho da sua barbearia.' },
  { id: 'f10', key: 'page_customization', name: 'Personalização da página', description: 'Personalize as cores e o banner da sua página.' },
];

export const DEFAULT_PLANS: Plan[] = [
  {
    id: 'plan_basic',
    name: 'Plano Básico',
    price: 0,
    interval: 'month',
    maxAppointments: 40,
    features: [
      'online_booking',
      'service_management',
      'digital_agenda',
      'whatsapp_confirmation',
      'client_management',
      'schedule_blocking'
    ]
  },
  {
    id: 'plan_pro',
    name: 'Plano Profissional',
    price: 59.90,
    interval: 'month',
    maxAppointments: null,
    isPopular: true,
    features: [
      'online_booking',
      'service_management',
      'digital_agenda',
      'whatsapp_confirmation',
      'client_management',
      'schedule_blocking',
      'whatsapp_reminders',
      'appointment_history',
      'reports',
      'page_customization'
    ]
  }
];
