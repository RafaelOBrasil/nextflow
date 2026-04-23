/**
 * Converte "HH:mm" para minutos totais desde as 00:00
 */
export const timeToMinutes = (time: string): number => {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
};

/**
 * Converte minutos totais desde as 00:00 para o formato "HH:mm"
 */
export const minutesToTime = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = Math.floor(minutes % 60);
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

export interface AppointmentBlock {
  startMin: number;
  endMin: number;
  date: string;
  barberId: string;
  status: string;
  customerName?: string;
  originalTime?: string;
  original?: any;
}

export interface FreeInterval {
  start: number;
  end: number;
}

/**
 * 2) Gera os intervalos válidos baseados no quadro de abertura e bloqueando horários.
 * Essa varredura previne sobreposições ignorando espaços que já foram cruzados.
 */
export const gerarIntervalosLivres = (
  openTime: string, 
  closeTime: string, 
  appointments: AppointmentBlock[]
): FreeInterval[] => {
  const openMin = timeToMinutes(openTime);
  const closeMin = timeToMinutes(closeTime);

  // Ordenar agendamentos pelo horário de início de forma cronológica
  const sortedApts = [...appointments].sort((a, b) => a.startMin - b.startMin);

  const freeIntervals: FreeInterval[] = [];
  let currentStart = openMin;

  for (const apt of sortedApts) {
    if (apt.startMin > currentStart) {
      // Existe um buraco / período ocioso antes deste agendamento, criar um freeInterval válido
      freeIntervals.push({ start: currentStart, end: apt.startMin });
    }
    // Avançar o ponteiro para o final do agendamento (garantindo que não volte pra trás se houver sujeira/sobreposição no bd)
    if (apt.endMin > currentStart) {
      currentStart = apt.endMin;
    }
  }

  // Se sobrou tempo depois do último agendamento até o fechamento
  if (currentStart < closeMin) {
    freeIntervals.push({ start: currentStart, end: closeMin });
  }

  return freeIntervals;
};

/**
 * 3) Gera horários baseados num grid granular se couber nestes intervalos
 */
export const gerarHorariosDisponiveisDinamico = (
  freeIntervals: FreeInterval[],
  serviceDuration: number,
  granularityMin: number = 30 // de quantos em quantos minutos sugerir os botões na tela (ex: a cada 15, 30 min)
): string[] => {
  const slots: string[] = [];

  for (const interval of freeIntervals) {
    let currentMin = interval.start;
    
    // Enquanto for possível encaixar a duração inteira do serviço dentro deste intervalo livre
    while (currentMin + serviceDuration <= interval.end) {
      slots.push(minutesToTime(currentMin));
      
      // Avança a granularidade desejável.
      currentMin += granularityMin;
    }
  }

  return Array.from(new Set(slots)).sort((a,b) => timeToMinutes(a) - timeToMinutes(b)); // Filtra duplicatas e garante ordem
};

export interface AdminAgendaItem {
  id?: string;
  inicio: string;
  fim: string;
  cliente?: string;
  barberId: string;
  status: string;
  original: any;
}

/**
 * 4) Montar Agenda Admin
 * Recebe os dados brutos e não filtra buracos. Retorna os blocos exatos e seu tamanho para renderizar uma timeline sem filtros.
 */
export const montarAgendaAdmin = (
  appointments: any[], 
  services: any[],
  defaultInterval: number = 30,
  useDynamicInterval: boolean = false
): AdminAgendaItem[] => {
  return appointments.map(apt => {
    const startMin = timeToMinutes(apt.time);
    let duration = defaultInterval;
    
    if (useDynamicInterval) {
      const s = services?.find(svc => svc.id === apt.serviceId);
      if (s?.duration) {
        duration = s.duration;
      }
    }
    
    return {
      id: apt.id,
      inicio: apt.time,
      fim: minutesToTime(startMin + duration),
      cliente: apt.customerName,
      barberId: apt.barberId,
      status: apt.status,
      original: apt
    };
  }).sort((a, b) => timeToMinutes(a.inicio) - timeToMinutes(b.inicio));
};
