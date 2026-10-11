import { DriverProfile, CopilotCalculation, PlatformId, EarningsEntry, ExpenseEntry } from '../types';
import { PLATFORMS } from '../data/constants';

export const formatCurrency = (val: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(val || 0);
};

export const formatBRLDecimal = (
  value: number | string | undefined | null,
  decimals: number = 2
): string => {
  if (value === undefined || value === null || value === '') return '';
  const num = typeof value === 'number' ? value : parseBRLDecimal(value);
  if (isNaN(num)) return '';

  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(num);
};

export const parseBRLDecimal = (str: string | number | undefined | null): number => {
  if (str === undefined || str === null || str === '') return 0;
  if (typeof str === 'number') return isNaN(str) ? 0 : str;

  let cleaned = String(str).replace(/[R$\s]/g, '').trim();
  if (!cleaned) return 0;

  if (cleaned.includes('.') && cleaned.includes(',')) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      cleaned = cleaned.replace(/,/g, '');
    }
  } else if (cleaned.includes(',')) {
    cleaned = cleaned.replace(',', '.');
  } else if (cleaned.includes('.')) {
    if (/^\d{1,3}(\.\d{3})+$/.test(cleaned)) {
      cleaned = cleaned.replace(/\./g, '');
    }
  }

  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

export const formatNumber = (val: number, decimals: number = 0): string => {
  return new Intl.NumberFormat('pt-BR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(val || 0);
};

export const formatHours = (decimalHours: number): string => {
  if (!decimalHours || decimalHours <= 0) return '0h';
  const hours = Math.floor(decimalHours);
  const minutes = Math.round((decimalHours - hours) * 60);
  if (minutes === 0) return `${hours}h`;
  if (hours === 0) return `${minutes}min`;
  return `${hours}h ${minutes}min`;
};

export const formatDateBR = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
};

export const formatLocalDate = (d: Date): string => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const formatDateFull = (dateStr: string): string => {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return date.toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
};

export const calculateDateDiffDays = (startDate: string, endDate: string): number => {
  if (!startDate || !endDate) return 1;
  const [sy, sm, sd] = startDate.split('-').map(Number);
  const [ey, em, ed] = endDate.split('-').map(Number);
  const d1 = new Date(sy, sm - 1, sd);
  const d2 = new Date(ey, em - 1, ed);
  const diffTime = d2.getTime() - d1.getTime();
  const days = Math.round(diffTime / (1000 * 60 * 60 * 24)) + 1;
  return days > 0 ? days : 1;
};

export const getPlatformConfig = (id: PlatformId) => {
  return PLATFORMS.find((p) => p.id === id) || PLATFORMS[0];
};

export const calculateCopilotRide = (
  offeredValue: number,
  pickupDistanceKm: number,
  tripDistanceKm: number,
  estimatedMinutes: number,
  platform: PlatformId,
  profile: DriverProfile
): CopilotCalculation => {
  const totalDistanceKm = Math.max(0.1, Number((pickupDistanceKm + tripDistanceKm).toFixed(2)));
  const mins = Math.max(1, estimatedMinutes);
  
  // Consumo e custo de combustível
  const litersConsumed = totalDistanceKm / (profile.kmPerLiter || 10);
  const fuelCost = litersConsumed * (profile.fuelPricePerLiter || 4);
  
  // Desgaste de veículo (pneus, óleo, suspensão)
  const wearCost = totalDistanceKm * (profile.maintenanceCostPerKm || 0.18);

  // Depreciação do veículo por KM (FIPE)
  const depreciationCost = totalDistanceKm * (profile.depreciationCostPerKm || 0);
  
  // Custo operacional direto da corrida (combustível + desgaste + depreciação FIPE)
  const operationalCost = Number((fuelCost + wearCost + depreciationCost).toFixed(2));
  
  // Lucro líquido
  const netProfit = Number((offeredValue - operationalCost).toFixed(2));
  
  // Indicadores
  const ratePerKm = Number((offeredValue / totalDistanceKm).toFixed(2));
  const ratePerHour = Number(((offeredValue / mins) * 60).toFixed(2));
  const netPerHour = Number(((netProfit / mins) * 60).toFixed(2));

  // Lógica do Semáforo Zeca
  let verdict: 'green' | 'yellow' | 'red' = 'yellow';
  let verdictLabel = '🟡 ATENÇÃO - Avalie o destino';
  let verdictReason = 'Margem de lucro moderada. Verifique se o ponto de desembarque é dinâmico e seguro.';

  // Custo mínimo por km para não tomar prejuízo (combustível + 20% desgaste)
  const minCostPerKm = (fuelCost + wearCost) / totalDistanceKm;

  if (
    netProfit <= 1.5 ||
    ratePerKm < minCostPerKm * 1.15 ||
    (pickupDistanceKm > tripDistanceKm && pickupDistanceKm > 4) ||
    ratePerHour < (profile.minAcceptableRatePerHour || 40) * 0.6
  ) {
    verdict = 'red';
    verdictLabel = '🔴 RECUSAR - Risco de Prejuízo!';
    verdictReason = `Corrida com margem negativa ou km de busca excessivo (${pickupDistanceKm}km para buscar). Paga apenas ${formatCurrency(ratePerKm)}/km.`;
  } else if (
    ratePerKm >= (profile.minAcceptableRatePerKm || 2.2) &&
    ratePerHour >= (profile.minAcceptableRatePerHour || 40) &&
    netProfit >= 4.0
  ) {
    verdict = 'green';
    verdictLabel = '🟢 EXCELENTE - Aceitar!';
    verdictReason = `Alta rentabilidade! Gera ${formatCurrency(ratePerKm)}/km e ritmo de ${formatCurrency(ratePerHour)}/hora com lucro líquido de ${formatCurrency(netProfit)}.`;
  } else {
    verdict = 'yellow';
    verdictLabel = '🟡 ATENÇÃO - Corrida Regular';
    verdictReason = `Margem aceitável (${formatCurrency(ratePerKm)}/km e ${formatCurrency(netPerHour)}/h líquido). Aceite se o destino for para uma área movimentada.`;
  }

  return {
    id: `calc-${Date.now()}`,
    platform,
    offeredValue,
    pickupDistanceKm,
    tripDistanceKm,
    estimatedMinutes: mins,
    totalDistanceKm,
    ratePerKm,
    ratePerHour,
    operationalCost,
    netProfit,
    verdict,
    verdictLabel,
    verdictReason,
    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  };
};

export const generateWhatsAppReport = (
  date: string,
  gross: number,
  expenses: number,
  net: number,
  rides: number,
  hours: number,
  km: number,
  platformSummary: Array<{ name: string; amount: number; count: number; km?: number }>,
  avgDailyGross?: number,
  recordedDaysCount?: number
): string => {
  const ratePerHour = hours > 0 ? gross / hours : 0;
  const ratePerKm = km > 0 ? gross / km : 0;
  const netPerHour = hours > 0 ? net / hours : 0;

  let text = `🚕 *FECHAMENTO - ROSIDA MOTORISTA*\n`;
  text += `📅 Período: ${date.startsWith('Período') ? date : formatDateBR(date)}\n\n`;
  text += `💰 *FATURAMENTO BRUTO:* ${formatCurrency(gross)}\n`;
  if (avgDailyGross !== undefined && recordedDaysCount !== undefined && recordedDaysCount > 0) {
    text += `📊 *MÉDIA DIÁRIA DE GANHOS:* ${formatCurrency(avgDailyGross)}/dia (${recordedDaysCount} ${recordedDaysCount === 1 ? 'dia registrado' : 'dias registrados'})\n`;
  }
  text += `⛽ *DESPESAS:* -${formatCurrency(expenses)}\n`;
  text += `💵 *LUCRO LÍQUIDO REAL:* ${formatCurrency(net)}\n\n`;
  text += `📈 *MÉTRICAS DO PLANTÃO:*\n`;
  text += `• Total de Corridas/Entregas: ${rides}\n`;
  text += `• Tempo Online: ${formatHours(hours)}\n`;
  text += `• Quilômetros Rodados: ${formatNumber(km, 0)} km\n`;
  text += `• Ganho por Hora: ${formatCurrency(ratePerHour)}/h\n`;
  text += `• Ganho por Km: ${formatCurrency(ratePerKm)}/km\n`;
  text += `• Lucro Líquido por Hora: ${formatCurrency(netPerHour)}/h\n\n`;

  text += `📱 *GANHOS POR APLICATIVO:*\n`;
  platformSummary.forEach((p) => {
    if (p.amount > 0) {
      const kmText = p.km !== undefined && p.km > 0 ? ` • ${formatNumber(p.km, 0)} km` : '';
      text += `• ${p.name}: ${formatCurrency(p.amount)} (${p.count} corridas${kmText})\n`;
    }
  });

  text += `\n_Gerado pelo Rosida - Motorista_ 🚀`;
  return text;
};

export const WORKDAY_OPTIONS = [
  { day: 1, label: 'Segunda', short: 'Seg' },
  { day: 2, label: 'Terça', short: 'Ter' },
  { day: 3, label: 'Quarta', short: 'Qua' },
  { day: 4, label: 'Quinta', short: 'Qui' },
  { day: 5, label: 'Sexta', short: 'Sex' },
  { day: 6, label: 'Sábado', short: 'Sáb' },
  { day: 0, label: 'Domingo', short: 'Dom' },
];

export const countWorkingDaysInMonth = (
  year: number,
  month: number, // 1 to 12
  workdaysOfWeek: number[] = [1, 2, 3, 4, 5, 6]
): number => {
  if (!workdaysOfWeek || workdaysOfWeek.length === 0) return 0;
  const daysInMonth = new Date(year, month, 0).getDate();
  let count = 0;
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month - 1, day);
    if (workdaysOfWeek.includes(d.getDay())) {
      count++;
    }
  }
  return count;
};

export const countWorkingDaysInCurrentMonth = (
  workdaysOfWeek: number[] = [1, 2, 3, 4, 5, 6]
): number => {
  const now = new Date();
  return countWorkingDaysInMonth(now.getFullYear(), now.getMonth() + 1, workdaysOfWeek);
};

export const calculateDailyVehicleCost = (profile: DriverProfile): {
  dailyCost: number;
  monthlyCost: number;
  workingDaysThisMonth: number;
  daysPerWeek: number;
} => {
  const workdays = profile.workdaysOfWeek && profile.workdaysOfWeek.length > 0
    ? profile.workdaysOfWeek
    : [1, 2, 3, 4, 5, 6];
  const daysPerWeek = workdays.length;
  const workingDaysThisMonth = countWorkingDaysInCurrentMonth(workdays);
  const isRentedOrFinanced =
    profile.vehicleOwnershipType === 'alugado' || profile.vehicleOwnershipType === 'financiado';
  const monthlyCost = isRentedOrFinanced ? (profile.vehicleMonthlyPayment || 0) : 0;
  const dailyCost = (isRentedOrFinanced && workingDaysThisMonth > 0)
    ? monthlyCost / workingDaysThisMonth
    : 0;

  return {
    dailyCost,
    monthlyCost,
    workingDaysThisMonth,
    daysPerWeek,
  };
};

export interface FilteredPlatformMetrics {
  filteredEarnings: EarningsEntry[];
  filteredExpenses: ExpenseEntry[];
  totalGross: number;
  totalExpenses: number;
  netProfit: number;
  totalRides: number;
  totalHours: number;
  totalKm: number;
  ratePerHour: number;
  ratePerKm: number;
  netPerHour: number;
  ticketAverage: number;
}

/**
 * Calculates earnings and expenses correctly for a selected date range and selected platform(s).
 * - When all platforms are selected, includes all earnings and all expenses.
 * - When specific platforms are selected:
 *   - Earnings are strictly from the selected platforms.
 *   - Expenses explicitly tagged to a selected platform are included 100%.
 *   - Expenses explicitly tagged to an excluded platform are excluded.
 *   - General expenses (untagged or 'all') are apportioned based on the selected platform's share
 *     of KM driven (or gross earnings) on that date/period, so that net profit is accurately reflected.
 */
export const calculatePlatformFilteredData = (
  dateEarnings: EarningsEntry[],
  dateExpenses: ExpenseEntry[],
  selectedPlatformIds: string[],
  allPlatformIds: string[]
): FilteredPlatformMetrics => {
  const isAll =
    selectedPlatformIds.length === 0 ||
    selectedPlatformIds.length === allPlatformIds.length;

  // Filter earnings
  const filteredEarnings = dateEarnings.filter(
    (e) => isAll || selectedPlatformIds.includes(e.platformId)
  );
  const calcEarnings = filteredEarnings.filter((e) => e.includeInCalculations !== false);

  // Filter expenses
  let filteredExpenses: ExpenseEntry[] = [];

  if (isAll) {
    filteredExpenses = [...dateExpenses];
  } else {
    const totalKmInScope = dateEarnings
      .filter((e) => e.includeInCalculations !== false)
      .reduce((sum, e) => sum + e.kmDriven, 0);

    const selectedKmInScope = calcEarnings.reduce((sum, e) => sum + e.kmDriven, 0);

    const totalGrossInScope = dateEarnings
      .filter((e) => e.includeInCalculations !== false)
      .reduce((sum, e) => sum + e.grossAmount, 0);

    const selectedGrossInScope = calcEarnings.reduce((sum, e) => sum + e.grossAmount, 0);

    filteredExpenses = dateExpenses
      .map((exp) => {
        // 1. Explicitly tagged to one of the selected platforms
        if (exp.platformId && selectedPlatformIds.includes(exp.platformId)) {
          return exp;
        }
        // 2. Explicitly tagged to another platform not in selection
        if (exp.platformId && !selectedPlatformIds.includes(exp.platformId) && exp.platformId !== 'all') {
          return null;
        }
        // 3. General expense (untagged or 'all')
        // Apportion based on KM proportion on that expense date (or scope)
        const dayEarns = dateEarnings.filter(
          (e) => e.date === exp.date && e.includeInCalculations !== false
        );
        let ratio = 0;

        if (dayEarns.length > 0) {
          const dayTotalKm = dayEarns.reduce((sum, e) => sum + e.kmDriven, 0);
          const daySelKm = dayEarns
            .filter((e) => selectedPlatformIds.includes(e.platformId))
            .reduce((sum, e) => sum + e.kmDriven, 0);

          if (dayTotalKm > 0) {
            ratio = daySelKm / dayTotalKm;
          } else {
            const dayTotalGross = dayEarns.reduce((sum, e) => sum + e.grossAmount, 0);
            const daySelGross = dayEarns
              .filter((e) => selectedPlatformIds.includes(e.platformId))
              .reduce((sum, e) => sum + e.grossAmount, 0);
            ratio = dayTotalGross > 0 ? daySelGross / dayTotalGross : 0;
          }
        } else if (totalKmInScope > 0) {
          ratio = selectedKmInScope / totalKmInScope;
        } else if (totalGrossInScope > 0) {
          ratio = selectedGrossInScope / totalGrossInScope;
        } else {
          ratio = selectedPlatformIds.length / allPlatformIds.length;
        }

        if (ratio <= 0) return null;

        return {
          ...exp,
          amount: Number((exp.amount * ratio).toFixed(2)),
          notes: exp.notes ? `${exp.notes} (Rateio: ${(ratio * 100).toFixed(0)}%)` : undefined,
        };
      })
      .filter((exp): exp is ExpenseEntry => exp !== null);
  }

  const calcExpenses = filteredExpenses.filter((e) => e.includeInCalculations !== false);

  const totalGross = calcEarnings.reduce((acc, curr) => acc + curr.grossAmount, 0);
  const totalExpenses = calcExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const netProfit = totalGross - totalExpenses;

  const totalRides = calcEarnings.reduce((acc, curr) => acc + curr.ridesCount, 0);
  const totalHours = calcEarnings.reduce((acc, curr) => acc + curr.onlineHours, 0);
  const totalKm = calcEarnings.reduce((acc, curr) => acc + curr.kmDriven, 0);

  const ratePerHour = totalHours > 0 ? totalGross / totalHours : 0;
  const ratePerKm = totalKm > 0 ? totalGross / totalKm : 0;
  const netPerHour = totalHours > 0 ? netProfit / totalHours : 0;
  const ticketAverage = totalRides > 0 ? totalGross / totalRides : 0;

  return {
    filteredEarnings,
    filteredExpenses,
    totalGross,
    totalExpenses,
    netProfit,
    totalRides,
    totalHours,
    totalKm,
    ratePerHour,
    ratePerKm,
    netPerHour,
    ticketAverage,
  };
};
