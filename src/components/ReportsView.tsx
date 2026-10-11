import React, { useState } from 'react';
import {
  BarChart3,
  TrendingUp,
  Fuel,
  DollarSign,
  Clock,
  Navigation,
  Car,
  Share2,
  Download,
  Printer,
  Sparkles,
  PieChart,
  Calendar,
  CalendarDays,
  CheckCircle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Layers,
  X,
  Info,
  Filter,
  Check,
  Calculator,
  Target,
  Award,
} from 'lucide-react';
import { EarningsEntry, ExpenseEntry, DriverProfile, PlatformOption } from '../types';
import { PLATFORMS, getRelativeDate } from '../data/constants';
import {
  formatCurrency,
  formatDateBR,
  formatDateFull,
  formatLocalDate,
  formatHours,
  formatNumber,
  generateWhatsAppReport,
  calculateDateDiffDays,
  calculatePlatformFilteredData,
} from '../utils/helpers';
import { DateRangePicker } from './DateRangePicker';

export type ReportPeriodFilter = 'today' | 'week' | 'month' | 'year' | 'custom' | 'all';

interface ReportsViewProps {
  earnings: EarningsEntry[];
  expenses: ExpenseEntry[];
  profile: DriverProfile;
  platforms?: PlatformOption[];
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
  selectedPlatformIds?: string[];
  setSelectedPlatformIds?: (ids: string[]) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
}

export interface BestDayOfMonthInfo {
  date: string;
  gross: number;
  dayNumber: number;
}

export function findBestDayOfMonth(
  dates: string[],
  statsMap: Record<string, { gross: number; dayNumber: number }>
): BestDayOfMonthInfo | null {
  let best: BestDayOfMonthInfo | null = null;
  let maxGross = 0;
  for (const d of dates) {
    const s = statsMap[d];
    if (s && s.gross > maxGross && s.gross > 0) {
      maxGross = s.gross;
      best = { date: d, gross: s.gross, dayNumber: s.dayNumber };
    }
  }
  return best;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  earnings,
  expenses,
  profile,
  platforms,
  selectedDate,
  setSelectedDate,
  selectedPlatformIds,
  setSelectedPlatformIds,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
}) => {
  const [internalDate, setInternalDate] = useState<string>(getRelativeDate(0));
  const currentSelectedDate = selectedDate || internalDate;
  const setCurrentSelectedDate = (dateStr: string) => {
    if (setSelectedDate) setSelectedDate(dateStr);
    else setInternalDate(dateStr);
  };

  const activePlatforms = platforms || PLATFORMS;
  const allPlatformIds = activePlatforms.map((p) => p.id);
  const [internalPlatformIds, setInternalPlatformIds] = useState<string[]>(allPlatformIds);

  const effectiveSelectedPlatformIds = selectedPlatformIds || internalPlatformIds;
  const setEffectiveSelectedPlatformIds = (ids: string[]) => {
    if (setSelectedPlatformIds) setSelectedPlatformIds(ids);
    else setInternalPlatformIds(ids);
  };

  const [internalStartDate, setInternalStartDate] = useState<string>(() => getRelativeDate(7));
  const [internalEndDate, setInternalEndDate] = useState<string>(() => getRelativeDate(0));

  const effectiveCustomStartDate = customStartDate || internalStartDate;
  const setEffectiveCustomStartDate = (d: string) => {
    if (setCustomStartDate) setCustomStartDate(d);
    else setInternalStartDate(d);
  };

  const effectiveCustomEndDate = customEndDate || internalEndDate;
  const setEffectiveCustomEndDate = (d: string) => {
    if (setCustomEndDate) setCustomEndDate(d);
    else setInternalEndDate(d);
  };

  const [period, setPeriod] = useState<ReportPeriodFilter>('week');
  const [copied, setCopied] = useState(false);

  // Compute date range based on period and currentSelectedDate
  const getPeriodRange = () => {
    if (period === 'all') {
      return {
        startDate: '2000-01-01',
        endDate: '2099-12-31',
        label: 'Todo o Histórico',
        subLabel: 'Todos os registros acumulados',
        multiplier: 1,
      };
    }

    if (period === 'custom') {
      const daysCount = calculateDateDiffDays(effectiveCustomStartDate, effectiveCustomEndDate);
      return {
        startDate: effectiveCustomStartDate,
        endDate: effectiveCustomEndDate,
        label: `Período ${formatDateBR(effectiveCustomStartDate)} a ${formatDateBR(effectiveCustomEndDate)}`,
        subLabel: `${daysCount} ${daysCount === 1 ? 'dia selecionado' : 'dias selecionados'}`,
        multiplier: daysCount,
      };
    }

    const [yearStr, monthStr, dayStr] = currentSelectedDate.split('-');
    const baseDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

    if (period === 'today') {
      const isToday = currentSelectedDate === getRelativeDate(0);
      const isYesterday = currentSelectedDate === getRelativeDate(1);
      return {
        startDate: currentSelectedDate,
        endDate: currentSelectedDate,
        label: isToday ? 'Hoje' : isYesterday ? 'Ontem' : formatDateBR(currentSelectedDate),
        subLabel: formatDateFull(currentSelectedDate),
        multiplier: 1,
      };
    }

    if (period === 'week') {
      const d = new Date(baseDate);
      const dayOfWeek = d.getDay(); // 0 is Sunday, 1 is Monday...
      const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      const start = new Date(d);
      start.setDate(d.getDate() + diffToMonday);
      const end = new Date(start);
      end.setDate(start.getDate() + 6);

      const startIso = formatLocalDate(start);
      const endIso = formatLocalDate(end);

      return {
        startDate: startIso,
        endDate: endIso,
        label: `Semana ${formatDateBR(startIso)} a ${formatDateBR(endIso)}`,
        subLabel: 'Fechamento semanal consolidado',
        multiplier: 7,
      };
    }

    if (period === 'month') {
      const year = baseDate.getFullYear();
      const month = baseDate.getMonth();
      const start = new Date(year, month, 1);
      const end = new Date(year, month + 1, 0);

      const startIso = formatLocalDate(start);
      const endIso = formatLocalDate(end);
      const monthName = baseDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

      return {
        startDate: startIso,
        endDate: endIso,
        label: `Mês de ${monthName.charAt(0).toUpperCase() + monthName.slice(1)}`,
        subLabel: `${formatDateBR(startIso)} a ${formatDateBR(endIso)}`,
        multiplier: end.getDate(),
      };
    }

    // 'year'
    const year = baseDate.getFullYear();
    const start = new Date(year, 0, 1);
    const end = new Date(year, 11, 31);
    const startIso = formatLocalDate(start);
    const endIso = formatLocalDate(end);

    return {
      startDate: startIso,
      endDate: endIso,
      label: `Ano de ${year}`,
      subLabel: `01/01/${year} a 31/12/${year}`,
      multiplier: 365,
    };
  };

  const range = getPeriodRange();

  // Date shifting for stepping through periods
  const handleDateShift = (direction: number) => {
    if (period === 'all') return;

    if (period === 'custom') {
      const daysCount = calculateDateDiffDays(effectiveCustomStartDate, effectiveCustomEndDate);
      const [sy, sm, sd] = effectiveCustomStartDate.split('-').map(Number);
      const [ey, em, ed] = effectiveCustomEndDate.split('-').map(Number);
      const s = new Date(sy, sm - 1, sd);
      const e = new Date(ey, em - 1, ed);
      s.setDate(s.getDate() + direction * daysCount);
      e.setDate(e.getDate() + direction * daysCount);
      setEffectiveCustomStartDate(formatLocalDate(s));
      setEffectiveCustomEndDate(formatLocalDate(e));
      return;
    }

    const [yearStr, monthStr, dayStr] = currentSelectedDate.split('-');
    const current = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

    if (period === 'today') {
      current.setDate(current.getDate() + direction);
    } else if (period === 'week') {
      current.setDate(current.getDate() + direction * 7);
    } else if (period === 'month') {
      current.setMonth(current.getMonth() + direction);
    } else if (period === 'year') {
      current.setFullYear(current.getFullYear() + direction);
    }

    setCurrentSelectedDate(formatLocalDate(current));
  };

  // Filter based on period
  const filterByPeriod = (itemDate: string): boolean => {
    return itemDate >= range.startDate && itemDate <= range.endDate;
  };

  const isAllPlatformsSelected =
    effectiveSelectedPlatformIds.length === 0 ||
    effectiveSelectedPlatformIds.length === activePlatforms.length;

  const togglePlatform = (id: string) => {
    if (isAllPlatformsSelected) {
      // If currently all are selected, clicking one app isolates it (quick 1-click filter)
      setEffectiveSelectedPlatformIds([id]);
    } else if (effectiveSelectedPlatformIds.includes(id)) {
      const next = effectiveSelectedPlatformIds.filter((pId) => pId !== id);
      if (next.length === 0) {
        setEffectiveSelectedPlatformIds(allPlatformIds);
      } else {
        setEffectiveSelectedPlatformIds(next);
      }
    } else {
      const next = [...effectiveSelectedPlatformIds, id];
      setEffectiveSelectedPlatformIds(next);
    }
  };

  const selectAllPlatforms = () => {
    setEffectiveSelectedPlatformIds(allPlatformIds);
  };

  const clearAllPlatforms = () => {
    setEffectiveSelectedPlatformIds([]);
  };

  // 1. Raw entries in the period range
  const periodRawEarnings = earnings.filter((e) => filterByPeriod(e.date));
  const periodRawExpenses = expenses.filter((e) => filterByPeriod(e.date));

  // Gross per platform in the current period (regardless of app filter, to show revenue on chips)
  const platformPeriodGrossMap: Record<string, number> = {};
  periodRawEarnings
    .filter((e) => e.includeInCalculations !== false)
    .forEach((e) => {
      platformPeriodGrossMap[e.platformId] =
        (platformPeriodGrossMap[e.platformId] || 0) + e.grossAmount;
    });

  // 2. Apply platform filtering to both earnings AND expenses correctly
  const {
    filteredEarnings: periodEarnings,
    filteredExpenses: periodExpenses,
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
  } = calculatePlatformFilteredData(
    periodRawEarnings,
    periodRawExpenses,
    effectiveSelectedPlatformIds,
    allPlatformIds
  );

  // Only consider entries included in calculations
  const calcPeriodEarnings = periodEarnings.filter((e) => e.includeInCalculations !== false);
  const calcPeriodExpenses = periodExpenses.filter((e) => e.includeInCalculations !== false);
  const netMargin = totalGross > 0 ? (netProfit / totalGross) * 100 : 0;

  // Visible platform breakdown
  const visiblePlatforms = activePlatforms.filter((p) =>
    effectiveSelectedPlatformIds.includes(p.id)
  );

  // Breakdown by platform
  const platformStats = visiblePlatforms
    .map((p) => {
      const pEntries = calcPeriodEarnings.filter((e) => e.platformId === p.id);
      const amount = pEntries.reduce((acc, curr) => acc + curr.grossAmount, 0);
      const rides = pEntries.reduce((acc, curr) => acc + curr.ridesCount, 0);
      const hours = pEntries.reduce((acc, curr) => acc + curr.onlineHours, 0);
      const km = pEntries.reduce((acc, curr) => acc + curr.kmDriven, 0);
      const percent = totalGross > 0 ? (amount / totalGross) * 100 : 0;
      return {
        ...p,
        amount,
        rides,
        hours,
        km,
        percent,
      };
    })
    .filter((p) => p.amount > 0 || (visiblePlatforms.length === 1 && effectiveSelectedPlatformIds.includes(p.id)))
    .sort((a, b) => b.amount - a.amount);

  const topPlatform = platformStats.length > 0 ? platformStats[0] : null;

  // 3. Daily Averages based on recorded days in the selected period
  const periodDaysWithEarnings = Array.from(
    new Set(
      calcPeriodEarnings
        .filter((e) => (e.grossAmount || 0) > 0)
        .map((e) => e.date)
    )
  ).sort();

  const countPeriodDaysWithEarnings = periodDaysWithEarnings.length;

  const avgDailyGrossInPeriod =
    countPeriodDaysWithEarnings > 0
      ? totalGross / countPeriodDaysWithEarnings
      : 0;

  const avgDailyNetInPeriod =
    countPeriodDaysWithEarnings > 0
      ? netProfit / countPeriodDaysWithEarnings
      : 0;

  const avgDailyHoursInPeriod =
    countPeriodDaysWithEarnings > 0
      ? totalHours / countPeriodDaysWithEarnings
      : 0;

  const avgDailyKmInPeriod =
    countPeriodDaysWithEarnings > 0
      ? totalKm / countPeriodDaysWithEarnings
      : 0;

  const avgDailyRidesInPeriod =
    countPeriodDaysWithEarnings > 0
      ? totalRides / countPeriodDaysWithEarnings
      : 0;

  // 4. All-time Daily Averages based on all registered days ever recorded in the app
  const allTimeCalcEarnings = earnings.filter(
    (e) => e.includeInCalculations !== false && (e.grossAmount || 0) > 0
  );
  const allTimeDaysWithEarnings = Array.from(
    new Set(allTimeCalcEarnings.map((e) => e.date))
  ).sort();

  const allTimeDaysCount = allTimeDaysWithEarnings.length;
  const allTimeTotalGross = allTimeCalcEarnings.reduce(
    (acc, curr) => acc + (curr.grossAmount || 0),
    0
  );
  const allTimeAvgDailyGross =
    allTimeDaysCount > 0 ? allTimeTotalGross / allTimeDaysCount : 0;

  // Group all-time earnings by day to determine Best Day and Lowest Day
  const allTimeDayGrossMap: Record<string, number> = {};
  allTimeCalcEarnings.forEach((e) => {
    allTimeDayGrossMap[e.date] = (allTimeDayGrossMap[e.date] || 0) + e.grossAmount;
  });

  const allTimeDayGrossSorted = Object.entries(allTimeDayGrossMap).sort(
    (a, b) => b[1] - a[1]
  );
  const bestDay =
    allTimeDayGrossSorted.length > 0
      ? { date: allTimeDayGrossSorted[0][0], gross: allTimeDayGrossSorted[0][1] }
      : null;
  const lowestDay =
    allTimeDayGrossSorted.length > 0
      ? {
          date: allTimeDayGrossSorted[allTimeDayGrossSorted.length - 1][0],
          gross: allTimeDayGrossSorted[allTimeDayGrossSorted.length - 1][1],
        }
      : null;

  // Driver Target comparison
  const targetDailyGross = profile.targetDailyGross || 350;
  const targetDailyPercent =
    targetDailyGross > 0 ? (avgDailyGrossInPeriod / targetDailyGross) * 100 : 0;

  // Group by date for daily evolution chart (using filtered earnings and filtered expenses)
  const datesSet = Array.from(
    new Set([...periodEarnings.map((e) => e.date), ...periodExpenses.map((e) => e.date)])
  ).sort();

  const dailyEvolution = datesSet.map((d) => {
    const dayGross = periodEarnings
      .filter((e) => e.date === d && e.includeInCalculations !== false)
      .reduce((acc, curr) => acc + curr.grossAmount, 0);
    const dayExp = periodExpenses
      .filter((e) => e.date === d && e.includeInCalculations !== false)
      .reduce((acc, curr) => acc + curr.amount, 0);
    const dayNet = dayGross - dayExp;
    return {
      date: d,
      gross: dayGross,
      expense: dayExp,
      net: dayNet,
    };
  });

  const maxDailyGross = Math.max(...dailyEvolution.map((d) => d.gross), 100);

  // Calendar State for Operational Days Tracking
  const now = new Date();
  const [calYear, setCalYear] = useState<number>(now.getFullYear());
  const [calMonth, setCalMonth] = useState<number>(now.getMonth());
  const [selectedCalDate, setSelectedCalDate] = useState<string | null>(getRelativeDate(0));

  const handlePrevMonth = () => {
    if (calMonth === 0) {
      setCalMonth(11);
      setCalYear((prev) => prev - 1);
    } else {
      setCalMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (calMonth === 11) {
      setCalMonth(0);
      setCalYear((prev) => prev + 1);
    } else {
      setCalMonth((prev) => prev + 1);
    }
  };

  const handleCurrentMonth = () => {
    const today = new Date();
    setCalYear(today.getFullYear());
    setCalMonth(today.getMonth());
    setSelectedCalDate(getRelativeDate(0));
  };

  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // Month stats for the calendar
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Sunday
  const paddingDays = Array.from({ length: firstDayOfWeek });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthDates = monthDays.map((d) => {
    return `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  });

  const dayStatsMap: Record<
    string,
    {
      date: string;
      dayNumber: number;
      hasRecords: boolean;
      earnings: EarningsEntry[];
      expenses: ExpenseEntry[];
      gross: number;
      expense: number;
      net: number;
      rides: number;
      hours: number;
      km: number;
    }
  > = {};

  monthDates.forEach((dateStr, idx) => {
    const dayRawEarnings = earnings.filter((e) => e.date === dateStr);
    const dayRawExpenses = expenses.filter((e) => e.date === dateStr);

    const dayFiltered = calculatePlatformFilteredData(
      dayRawEarnings,
      dayRawExpenses,
      effectiveSelectedPlatformIds,
      allPlatformIds
    );

    const calcDayEarnings = dayFiltered.filteredEarnings.filter((e) => e.includeInCalculations !== false);
    const calcDayExpenses = dayFiltered.filteredExpenses.filter((e) => e.includeInCalculations !== false);

    const gross = dayFiltered.totalGross;
    const expense = dayFiltered.totalExpenses;
    const rides = dayFiltered.totalRides;
    const hours = dayFiltered.totalHours;
    const km = dayFiltered.totalKm;

    dayStatsMap[dateStr] = {
      date: dateStr,
      dayNumber: idx + 1,
      hasRecords: dayFiltered.filteredEarnings.length > 0 || dayFiltered.filteredExpenses.length > 0,
      earnings: dayFiltered.filteredEarnings,
      expenses: dayFiltered.filteredExpenses,
      gross,
      expense,
      net: gross - expense,
      rides,
      hours,
      km,
    };
  });

  const daysWithRecords = monthDates.filter((d) => dayStatsMap[d].hasRecords);
  const totalDaysWithRecords = daysWithRecords.length;
  const totalDaysWithoutRecords = daysInMonth - totalDaysWithRecords;
  const recordedFrequency = daysInMonth > 0 ? (totalDaysWithRecords / daysInMonth) * 100 : 0;

  const monthRawEarnings = earnings.filter((e) =>
    e.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`)
  );
  const monthRawExpenses = expenses.filter((e) =>
    e.date.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`)
  );
  const monthFiltered = calculatePlatformFilteredData(
    monthRawEarnings,
    monthRawExpenses,
    effectiveSelectedPlatformIds,
    allPlatformIds
  );

  const monthEarnings = monthFiltered.filteredEarnings.filter((e) => e.includeInCalculations !== false);
  const monthExpenses = monthFiltered.filteredExpenses.filter((e) => e.includeInCalculations !== false);
  const monthGross = monthFiltered.totalGross;
  const monthNet = monthFiltered.netProfit;
  const avgPerWorkday = totalDaysWithRecords > 0 ? monthGross / totalDaysWithRecords : 0;

  // Best day of the selected calendar month (O melhor ganho do dia do mês)
  const bestDayOfMonth: BestDayOfMonthInfo | null = findBestDayOfMonth(monthDates, dayStatsMap);

  // Export CSV
  const handleExportCSV = () => {
    let csv = 'Data,Tipo,Aplicativo/Categoria,Valor Bruto,Despesa,Lucro Liquido,Corridas,Horas,Km\n';
    periodEarnings.forEach((e) => {
      const p = activePlatforms.find((pl) => pl.id === e.platformId)?.name || e.platformId;
      csv += `${e.date},Ganho,${p},${e.grossAmount.toFixed(2)},0,${e.grossAmount.toFixed(2)},${e.ridesCount},${e.onlineHours},${e.kmDriven}\n`;
    });
    periodExpenses.forEach((exp) => {
      csv += `${exp.date},Despesa,${exp.category},0,${exp.amount.toFixed(2)},-${exp.amount.toFixed(2)},0,0,0\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rosida-relatorio-${period}-${isAllPlatformsSelected ? 'todos-apps' : 'apps-filtrados'}-${getRelativeDate(0)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const appsText = isAllPlatformsSelected
      ? 'Todos os Apps'
      : visiblePlatforms.map((p) => p.name).join(', ');
    const text = generateWhatsAppReport(
      `Período (${period}) - ${appsText}`,
      totalGross,
      totalExpenses,
      netProfit,
      totalRides,
      totalHours,
      totalKm,
      platformStats.map((p) => ({ name: p.name, amount: p.amount, count: p.rides, km: p.km })),
      avgDailyGrossInPeriod,
      countPeriodDaysWithEarnings
    );

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Period Selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center gap-1">
                <BarChart3 className="w-3 h-3" />
                Relatórios Automáticos
              </span>
              <span className="text-xs text-zinc-400">Inteligência Financeira Completa</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Desempenho & Fechamento de Caixa
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Consolidação automática dos seus ganhos em todos os aplicativos, separação dos
              custos e margem real de lucro.
            </p>
          </div>

          {/* Period selector tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 text-xs">
            <button
              onClick={() => setPeriod('today')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'today'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dia
            </button>
            <button
              onClick={() => setPeriod('week')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'week'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setPeriod('month')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'month'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mês
            </button>
            <button
              onClick={() => setPeriod('year')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'year'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Ano
            </button>
            <button
              onClick={() => setPeriod('custom')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'custom'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Período
            </button>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                period === 'all'
                  ? 'bg-purple-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todo o Histórico
            </button>
          </div>
        </div>

        {/* Date Stepper & Navigation Bar */}
        {period !== 'all' && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
              <button
                type="button"
                onClick={() => handleDateShift(-1)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={
                  period === 'today'
                    ? 'Dia anterior'
                    : period === 'week'
                    ? 'Semana anterior'
                    : period === 'month'
                    ? 'Mês anterior'
                    : period === 'year'
                    ? 'Ano anterior'
                    : 'Período anterior'
                }
              >
                <ChevronLeft className="w-5 h-5" />
              </button>

              <div className="text-center sm:text-left px-1">
                <div className="text-sm font-bold text-white flex items-center justify-center sm:justify-start gap-1.5">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>{range.label}</span>
                </div>
                <div className="text-[11px] text-zinc-400">{range.subLabel}</div>
              </div>

              <button
                type="button"
                onClick={() => handleDateShift(1)}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                title={
                  period === 'today'
                    ? 'Próximo dia'
                    : period === 'week'
                    ? 'Próxima semana'
                    : period === 'month'
                    ? 'Próximo mês'
                    : period === 'year'
                    ? 'Próximo ano'
                    : 'Próximo período'
                }
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Presets & Reference Date Picker */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end flex-wrap">
              <button
                type="button"
                onClick={() => {
                  setPeriod('today');
                  setCurrentSelectedDate(getRelativeDate(0));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSelectedDate === getRelativeDate(0) && period === 'today'
                    ? 'bg-zinc-800 text-purple-400 border border-purple-500/40'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Hoje
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeriod('today');
                  setCurrentSelectedDate(getRelativeDate(1));
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  currentSelectedDate === getRelativeDate(1) && period === 'today'
                    ? 'bg-zinc-800 text-purple-400 border border-purple-500/40'
                    : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
                }`}
              >
                Ontem
              </button>

              <div className="relative">
                <input
                  type="date"
                  value={currentSelectedDate}
                  onChange={(e) => {
                    setCurrentSelectedDate(e.target.value);
                  }}
                  className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-purple-500 cursor-pointer"
                  title="Selecionar data base do relatório"
                />
              </div>
            </div>
          </div>
        )}

        {/* Custom Date Range Picker matching user's reference screenshot */}
        {period === 'custom' && (
          <div className="mt-4 pt-4 border-t border-zinc-800/80 animate-in fade-in">
            <DateRangePicker
              startDate={effectiveCustomStartDate}
              endDate={effectiveCustomEndDate}
              onChangeStartDate={setEffectiveCustomStartDate}
              onChangeEndDate={setEffectiveCustomEndDate}
              accentColor="purple"
            />
          </div>
        )}

        {/* Platform/App Multi-select Filter */}
        <div className="mt-4 pt-4 border-t border-zinc-800/80 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-md bg-purple-500/10 text-purple-400">
                <Car className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Aplicativos Exibidos:
              </span>
              <span className="text-[11px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-md border border-purple-500/20">
                {isAllPlatformsSelected
                  ? `Todos os Apps (${activePlatforms.length})`
                  : `${effectiveSelectedPlatformIds.length} de ${activePlatforms.length} selecionado(s)`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-purple-400 hover:text-purple-300 font-bold transition-colors cursor-pointer"
              >
                Marcar Todos
              </button>
              <span className="text-zinc-600">•</span>
              <button
                type="button"
                onClick={clearAllPlatforms}
                className="text-zinc-400 hover:text-zinc-200 font-semibold transition-colors cursor-pointer"
              >
                Limpar
              </button>
            </div>
          </div>

          {/* Platform chips list */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Button "Todos os Apps" */}
            <button
              type="button"
              onClick={selectAllPlatforms}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAllPlatformsSelected
                  ? 'bg-purple-600 text-white border-purple-500 shadow-sm shadow-purple-600/30'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos os Apps ({activePlatforms.length})</span>
            </button>

            {/* Individual app chips */}
            {activePlatforms.map((plat) => {
              const isSelected = effectiveSelectedPlatformIds.includes(plat.id);
              const grossInPeriod = platformPeriodGrossMap[plat.id] || 0;

              return (
                <button
                  type="button"
                  key={plat.id}
                  onClick={() => togglePlatform(plat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? isAllPlatformsSelected
                        ? 'bg-zinc-950 text-zinc-200 border-zinc-700 hover:border-zinc-600 hover:text-white'
                        : 'bg-purple-950/40 text-white border-purple-500 ring-1 ring-purple-500/50 shadow-sm'
                      : 'bg-zinc-950/40 text-zinc-500 border-zinc-900 opacity-60 hover:opacity-90 hover:text-zinc-400'
                  }`}
                  title={
                    isAllPlatformsSelected
                      ? `Clique para filtrar somente ${plat.name}`
                      : isSelected
                      ? `Clique para remover ${plat.name} da visualização`
                      : `Clique para adicionar ${plat.name} à visualização`
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: plat.accentColor || '#a855f7' }}
                  />
                  <span>{plat.name}</span>
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 shrink-0 ${
                        isAllPlatformsSelected ? 'text-zinc-500' : 'text-purple-400'
                      }`}
                    />
                  )}
                  {grossInPeriod > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {formatCurrency(grossInPeriod)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!isAllPlatformsSelected && effectiveSelectedPlatformIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400 bg-purple-950/20 border border-purple-500/20 rounded-lg px-2.5 py-1.5">
              <span>
                Filtrando por:{' '}
                <strong className="text-white">
                  {visiblePlatforms.map((p) => p.name).join(', ')}
                </strong>
                . Faturamento, corridas, km e despesas operacionais (exclusivas + rateio de combustível/manutenção) consolidados para a data e apps selecionados.
              </span>
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-purple-400 hover:text-purple-300 font-bold underline shrink-0 cursor-pointer text-left sm:text-right"
              >
                Ver todos os apps
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons Toolbar */}
        <div className="mt-5 pt-4 border-t border-zinc-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-4 flex-wrap text-zinc-400">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-purple-400" />
              <span>
                Período:{' '}
                <strong className="text-white">
                  {range.label} ({range.subLabel})
                </strong>
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              <Car className="w-4 h-4 text-purple-400" />
              <span>
                Apps:{' '}
                <strong className="text-white">
                  {isAllPlatformsSelected
                    ? `Todos (${activePlatforms.length})`
                    : `${visiblePlatforms.map((p) => p.name).join(', ')} (${visiblePlatforms.length})`}
                </strong>
              </span>
              {!isAllPlatformsSelected && (
                <button
                  type="button"
                  onClick={selectAllPlatforms}
                  className="text-[11px] text-purple-400 hover:text-purple-300 underline font-semibold ml-1 cursor-pointer"
                >
                  (ver todos)
                </button>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30 font-bold transition-all cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copiado p/ WhatsApp!' : 'Copiar WhatsApp'}</span>
            </button>

            <button
              onClick={handleExportCSV}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-bold transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Baixar CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 font-bold transition-all cursor-pointer hidden sm:flex"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner when 0 apps are selected */}
      {effectiveSelectedPlatformIds.length === 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-300 text-xs animate-in fade-in">
          <div className="flex items-center gap-2.5">
            <Info className="w-5 h-5 shrink-0 text-amber-400" />
            <span>Nenhum aplicativo selecionado no filtro. Marque os aplicativos que deseja visualizar ou clique em "Marcar Todos".</span>
          </div>
          <button
            onClick={selectAllPlatforms}
            className="px-3 py-1.5 rounded-lg bg-amber-500 text-zinc-950 font-bold hover:bg-amber-400 transition-colors shrink-0 cursor-pointer self-start sm:self-auto"
          >
            Marcar Todos os Apps
          </button>
        </div>
      )}

      {/* Top 5 KPI Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {/* Card 1: Faturamento Bruto */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Faturamento Bruto</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white">{formatCurrency(totalGross)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{totalRides} corridas / entregas</div>
        </div>

        {/* Card 2: Média Diária de Ganhos (Baseada nos registros feitos) */}
        <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-500/40 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-amber-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5 text-amber-400" />
              Média Diária
            </span>
            <div className="p-1.5 bg-amber-500/20 text-amber-300 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-300 flex items-baseline gap-1">
            {formatCurrency(avgDailyGrossInPeriod)}
            <span className="text-[10px] font-normal text-zinc-400">/dia</span>
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center justify-between flex-wrap gap-1">
            <span>
              {countPeriodDaysWithEarnings} {countPeriodDaysWithEarnings === 1 ? 'dia ativo' : 'dias ativos'}
            </span>
            {targetDailyGross > 0 && countPeriodDaysWithEarnings > 0 && (
              <span className={`font-bold ${targetDailyPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                {targetDailyPercent.toFixed(0)}% da meta
              </span>
            )}
          </div>
        </div>

        {/* Card 3: Total de Despesas */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Total de Despesas</span>
            <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400">-{formatCurrency(totalExpenses)}</div>
          <div className="text-[11px] text-zinc-400 mt-1">{periodExpenses.length} lançamentos</div>
        </div>

        {/* Card 4: Lucro Líquido Real */}
        <div className="bg-zinc-900 border border-emerald-500/40 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-zinc-900 to-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-400 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido Real</span>
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-emerald-400">{formatCurrency(netProfit)}</div>
          <div className="text-[11px] text-zinc-400 mt-1 font-semibold">
            {netMargin.toFixed(1)}% de margem no bolso
          </div>
        </div>

        {/* Card 5: Eficiência Média */}
        <div className="col-span-2 lg:col-span-1 bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-1">
            <span className="text-xs font-semibold">Eficiência Média</span>
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between mt-1">
            <div>
              <div className="text-base sm:text-lg font-black text-white">{formatCurrency(ratePerHour)}/h</div>
              <div className="text-[10px] text-zinc-500">{formatHours(totalHours)} online</div>
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-white">{formatCurrency(ratePerKm)}/km</div>
              <div className="text-[10px] text-zinc-500">{formatNumber(totalKm, 0)} km rodados</div>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED SECTION: Média Diária de Ganhos Baseada nos Registros Feitos */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-black text-white text-base sm:text-lg">
                  Média Diária de Ganhos
                </h3>
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Baseada nos Registros Realizados
                </span>
              </div>
              <p className="text-xs text-zinc-400 mt-0.5">
                Média calculada dividindo os ganhos reais exclusivamente pelos dias em que você efetivamente lançou no app
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto text-xs bg-zinc-950 px-3 py-1.5 rounded-xl border border-zinc-800 text-zinc-300 shrink-0">
            <Calendar className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Total histórico: <strong className="text-white">{allTimeDaysCount}</strong> {allTimeDaysCount === 1 ? 'dia cadastrado' : 'dias cadastrados'}
            </span>
          </div>
        </div>

        {/* 3 Core Highlight Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4">
          {/* Card 1: Média Diária do Período */}
          <div className="bg-zinc-950/90 p-4 rounded-xl border border-amber-500/40 relative overflow-hidden space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-amber-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5" />
                Média no Período Selecionado
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                {range.label}
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
              {formatCurrency(avgDailyGrossInPeriod)}
              <span className="text-xs font-normal text-zinc-400">/ dia trabalhado</span>
            </div>

            <div className="text-xs space-y-1.5 pt-1.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Dias com registros no período:</span>
                <strong className="text-white font-bold">
                  {countPeriodDaysWithEarnings} {countPeriodDaysWithEarnings === 1 ? 'dia ativo' : 'dias ativos'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Lucro Líquido Médio / dia:</span>
                <strong className="text-emerald-400 font-bold">
                  {formatCurrency(avgDailyNetInPeriod)}/dia
                </strong>
              </div>
            </div>
          </div>

          {/* Card 2: Média Geral de Todo o Histórico */}
          <div className="bg-zinc-950/90 p-4 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-sky-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5" />
                Média Geral de Todo o Histórico
              </span>
              <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800">
                Todos os Registros
              </span>
            </div>

            <div className="text-2xl sm:text-3xl font-black text-sky-400 flex items-baseline gap-1">
              {formatCurrency(allTimeAvgDailyGross)}
              <span className="text-xs font-normal text-zinc-400">/ dia trabalhado</span>
            </div>

            <div className="text-xs space-y-1.5 pt-1.5 border-t border-zinc-800/80">
              <div className="flex items-center justify-between text-zinc-400">
                <span>Total de dias registrados no app:</span>
                <strong className="text-white font-bold">
                  {allTimeDaysCount} {allTimeDaysCount === 1 ? 'dia' : 'dias'}
                </strong>
              </div>
              <div className="flex items-center justify-between text-zinc-400">
                <span>Comparação período vs histórico:</span>
                {countPeriodDaysWithEarnings > 0 && allTimeDaysCount > 0 ? (
                  avgDailyGrossInPeriod >= allTimeAvgDailyGross ? (
                    <strong className="text-emerald-400 font-bold">
                      +{formatCurrency(avgDailyGrossInPeriod - allTimeAvgDailyGross)} (acima)
                    </strong>
                  ) : (
                    <strong className="text-amber-400 font-bold">
                      -{formatCurrency(allTimeAvgDailyGross - avgDailyGrossInPeriod)} (abaixo)
                    </strong>
                  )
                ) : (
                  <strong className="text-zinc-500">Sem registros</strong>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Comparativo com a Meta Diária de Faturamento */}
          <div className="bg-zinc-950/90 p-4 rounded-xl border border-zinc-800 space-y-2.5">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-purple-400 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Meta Diária Cadastrada
              </span>
              <span className="text-xs font-black text-purple-300">
                {formatCurrency(targetDailyGross)}/dia
              </span>
            </div>

            <div className="space-y-1.5 pt-0.5">
              <div className="flex items-baseline justify-between text-xs">
                <span className="text-zinc-400">Atingimento da Meta:</span>
                <strong className={`font-black ${targetDailyPercent >= 100 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {countPeriodDaysWithEarnings > 0 ? `${targetDailyPercent.toFixed(1)}%` : '0%'}
                </strong>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-zinc-900 h-2.5 rounded-full overflow-hidden border border-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    targetDailyPercent >= 100
                      ? 'bg-emerald-500'
                      : targetDailyPercent >= 75
                      ? 'bg-amber-400'
                      : 'bg-rose-500'
                  }`}
                  style={{ width: `${Math.min(100, targetDailyPercent)}%` }}
                />
              </div>

              <div className="text-[11px] pt-1">
                {countPeriodDaysWithEarnings > 0 ? (
                  avgDailyGrossInPeriod >= targetDailyGross ? (
                    <span className="text-emerald-400 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 inline shrink-0" />
                      Meta batida! +{formatCurrency(avgDailyGrossInPeriod - targetDailyGross)}/dia acima
                    </span>
                  ) : (
                    <span className="text-amber-400 font-medium">
                      Faltam {formatCurrency(Math.max(0, targetDailyGross - avgDailyGrossInPeriod))}/dia para bater a meta
                    </span>
                  )
                ) : (
                  <span className="text-zinc-500">
                    Nenhum registro de faturamento neste período
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Operational Daily Averages Sub-strip */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2 border-t border-zinc-800/80 text-xs">
          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-semibold">Corridas por Dia Ativo</span>
            <strong className="text-sm font-black text-white">
              {avgDailyRidesInPeriod.toFixed(1)} <span className="text-[10px] font-normal text-zinc-500">viagens/dia</span>
            </strong>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-semibold">Horas Online por Dia Ativo</span>
            <strong className="text-sm font-black text-white">
              {formatHours(avgDailyHoursInPeriod)} <span className="text-[10px] font-normal text-zinc-500">/dia</span>
            </strong>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-semibold">Km Rodados por Dia Ativo</span>
            <strong className="text-sm font-black text-sky-400">
              {formatNumber(avgDailyKmInPeriod, 0)} <span className="text-[10px] font-normal text-zinc-500">km/dia</span>
            </strong>
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-semibold">Melhor Dia Registrado</span>
            <strong className="text-sm font-black text-emerald-400">
              {bestDay ? formatCurrency(bestDay.gross) : 'N/D'}
            </strong>
            {bestDay && (
              <span className="text-[9px] text-zinc-500 block truncate">em {formatDateBR(bestDay.date)}</span>
            )}
          </div>

          <div className="bg-zinc-950 p-2.5 rounded-xl border border-zinc-800">
            <span className="text-[10px] text-zinc-400 block font-semibold">Menor Dia Registrado</span>
            <strong className="text-sm font-black text-zinc-300">
              {lowestDay ? formatCurrency(lowestDay.gross) : 'N/D'}
            </strong>
            {lowestDay && (
              <span className="text-[9px] text-zinc-500 block truncate">em {formatDateBR(lowestDay.date)}</span>
            )}
          </div>
        </div>
      </div>

      {/* Calendar of Recorded Workdays & Sum */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-5">
        {/* Header with Month Navigation */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CalendarDays className="w-3.5 h-3.5" />
                Calendário Operacional
              </span>
              <span className="text-xs text-zinc-400">Dias Trabalhados & Frequência</span>
            </div>
            <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Dias com Registros Realizados
            </h3>
            <p className="text-xs text-zinc-400">
              Acompanhe no calendário cada dia trabalhado com registros e a soma total de dias ativos no mês.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto">
            <button
              onClick={handlePrevMonth}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Mês anterior"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-white min-w-[130px] text-center">
              {formattedMonthName}
            </span>
            <button
              onClick={handleNextMonth}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Próximo mês"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={handleCurrentMonth}
              className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 px-2 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 rounded-md border border-emerald-500/20 transition-colors cursor-pointer"
            >
              Hoje
            </button>
          </div>
        </div>

        {/* 4 Summary KPI Cards for the Calendar Month */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-zinc-950 p-3.5 rounded-xl border border-emerald-500/30 relative overflow-hidden">
            <div className="flex items-center justify-between text-emerald-400 mb-1">
              <span className="text-xs font-bold uppercase tracking-wider">Dias com Registros</span>
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div className="text-2xl font-black text-white">
              {totalDaysWithRecords} <span className="text-sm font-semibold text-zinc-400">dias</span>
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {totalDaysWithRecords} de {daysInMonth} dias ({recordedFrequency.toFixed(0)}% do mês)
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold">Dias sem Registro</span>
              <Calendar className="w-4 h-4 text-zinc-500" />
            </div>
            <div className="text-2xl font-black text-zinc-300">
              {totalDaysWithoutRecords} <span className="text-sm font-semibold text-zinc-500">dias</span>
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Descanso ou sem lançamentos
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold">Total Faturado no Mês</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">
              {formatCurrency(monthGross)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Lucro líq: {formatCurrency(monthNet)}
            </div>
          </div>

          <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between text-zinc-400 mb-1">
              <span className="text-xs font-semibold">Média Diária no Mês</span>
              <Calculator className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">
              {formatCurrency(avgPerWorkday)}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Dividido pelos {totalDaysWithRecords} dias com registros
            </div>
          </div>
        </div>

        {/* Banner: Melhor Ganho do Mês */}
        {bestDayOfMonth && (
          <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-zinc-950 border border-amber-500/40 rounded-xl p-3 sm:p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md shadow-amber-500/10">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-amber-400 text-zinc-950 font-black shadow-md shrink-0">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-amber-400 text-zinc-950">
                    Recorde do Mês
                  </span>
                  <span className="text-xs text-zinc-300">
                    Melhor Ganho Diário em <strong className="text-white capitalize">{formattedMonthName}</strong>
                  </span>
                </div>
                <div className="text-lg sm:text-xl font-black text-amber-300 flex items-baseline gap-1.5 mt-0.5">
                  {formatCurrency(bestDayOfMonth.gross)}
                  <span className="text-xs font-semibold text-zinc-400">
                    no dia {bestDayOfMonth.dayNumber} ({formatDateBR(bestDayOfMonth.date)})
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setSelectedCalDate(bestDayOfMonth?.date || null)}
              className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-bold transition-colors cursor-pointer self-start sm:self-auto flex items-center gap-1.5"
            >
              <span>Ver detalhes do melhor dia</span>
              <span>→</span>
            </button>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="space-y-2">
          {/* Calendar Legend */}
          <div className="flex items-center justify-between flex-wrap gap-2 pt-1 pb-1 text-[11px] text-zinc-400 border-b border-zinc-800/60">
            <div className="flex items-center gap-3 flex-wrap">
              <span className="flex items-center gap-1.5 font-bold text-amber-300">
                <span className="w-3 h-3 rounded-md bg-amber-400 border border-amber-300 inline-block shadow-sm" />
                Melhor Ganho do Mês
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                Dias com Faturamento
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400 inline-block" />
                Dias com Despesa
              </span>
            </div>
            <span className="text-zinc-500 text-[10px]">
              Toque em um dia para inspecionar os lançamentos
            </span>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center">
            {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map((dayName, idx) => (
              <div
                key={dayName}
                className={`py-1.5 text-xs font-bold rounded-lg ${
                  idx === 0 || idx === 6 ? 'text-zinc-500' : 'text-zinc-400'
                }`}
              >
                {dayName}
              </div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1 sm:gap-2">
            {paddingDays.map((_, i) => (
              <div
                key={`pad-${i}`}
                className="min-h-[58px] sm:min-h-[74px] rounded-xl bg-zinc-950/20 border border-zinc-900/40 opacity-30"
              />
            ))}

            {monthDays.map((d) => {
              const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
              const isToday = dateStr === getRelativeDate(0);
              const isSelected = selectedCalDate === dateStr;
              const stats = dayStatsMap[dateStr];
              const isBestDay =
                bestDayOfMonth !== null &&
                bestDayOfMonth.date === dateStr &&
                bestDayOfMonth.gross > 0;

              return (
                <button
                  type="button"
                  key={dateStr}
                  onClick={() => setSelectedCalDate(isSelected ? null : dateStr)}
                  className={`min-h-[58px] sm:min-h-[74px] p-1.5 sm:p-2 rounded-xl border transition-all text-left flex flex-col justify-between cursor-pointer relative group ${
                    isSelected
                      ? isBestDay
                        ? 'ring-2 ring-amber-400 border-amber-400 bg-amber-950/40 shadow-xl shadow-amber-500/25'
                        : 'ring-2 ring-emerald-400 border-emerald-500 bg-emerald-950/30'
                      : isBestDay
                      ? 'bg-gradient-to-b from-amber-500/25 via-zinc-950 to-zinc-950 border-2 border-amber-400 ring-1 ring-amber-400/40 shadow-lg shadow-amber-500/20 hover:border-amber-300 hover:shadow-amber-500/30'
                      : stats.hasRecords
                      ? 'bg-zinc-950 border-emerald-500/40 hover:border-emerald-400 hover:bg-zinc-900/80 shadow-sm'
                      : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700 text-zinc-500'
                  }`}
                  title={`${formatDateBR(dateStr)}: ${
                    isBestDay ? '🏆 MELHOR GANHO DO MÊS! ' : ''
                  }${
                    stats.hasRecords
                      ? `Faturamento ${formatCurrency(stats.gross)} (${stats.rides} corridas)`
                      : 'Sem lançamentos'
                  }`}
                >
                  {/* Top row in cell: day number + badges */}
                  <div className="flex items-center justify-between w-full">
                    <span
                      className={`text-xs font-black ${
                        isBestDay
                          ? 'text-amber-300'
                          : stats.hasRecords
                          ? 'text-white'
                          : 'text-zinc-500'
                      }`}
                    >
                      {d}
                    </span>

                    <div className="flex items-center gap-1 flex-wrap justify-end">
                      {isBestDay && (
                        <span
                          className="text-[8px] sm:text-[9px] px-1 sm:px-1.5 py-0.2 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 text-zinc-950 font-black flex items-center gap-0.5 shadow-sm uppercase tracking-wider shrink-0"
                          title={`Melhor ganho do mês: ${formatCurrency(stats.gross)}`}
                        >
                          <Award className="w-2.5 h-2.5 shrink-0" />
                          <span className="hidden sm:inline">Top</span> Ganho
                        </span>
                      )}
                      {isToday && (
                        <span className="text-[9px] px-1 py-0.2 rounded bg-emerald-500 text-zinc-950 font-black">
                          Hoje
                        </span>
                      )}
                      {stats.hasRecords && !isBestDay && (
                        <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      )}
                      {stats.expense > 0 && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                      )}
                    </div>
                  </div>

                  {/* Bottom info in cell */}
                  {stats.hasRecords ? (
                    <div className="mt-1 w-full space-y-0.5">
                      {stats.gross > 0 && (
                        <div
                          className={`text-[10px] sm:text-xs font-black truncate flex items-center gap-0.5 ${
                            isBestDay
                              ? 'text-amber-300 font-black text-xs sm:text-[13px]'
                              : 'text-emerald-400'
                          }`}
                        >
                          {isBestDay && <Sparkles className="w-3 h-3 text-amber-400 shrink-0 inline" />}
                          +{formatCurrency(stats.gross)}
                        </div>
                      )}
                      {stats.gross === 0 && stats.expense > 0 && (
                        <div className="text-[10px] sm:text-xs font-bold text-rose-400 truncate">
                          -{formatCurrency(stats.expense)}
                        </div>
                      )}
                      <div className="text-[9px] text-zinc-400 truncate hidden sm:block">
                        {stats.rides > 0 ? `${stats.rides} corr` : ''}
                        {stats.rides > 0 && stats.hours > 0 ? ' • ' : ''}
                        {stats.hours > 0 ? `${formatHours(stats.hours)}` : ''}
                      </div>
                    </div>
                  ) : (
                    <div className="text-[10px] text-zinc-700 select-none">
                      -
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Day Inspector */}
        {selectedCalDate && dayStatsMap[selectedCalDate] && (
          <div className="bg-zinc-950 p-4 sm:p-5 rounded-2xl border border-zinc-800 space-y-3 animate-in fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-2.5">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <Calendar className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="font-extrabold text-white text-sm sm:text-base capitalize">
                    {formatDateFull(selectedCalDate)}
                  </h4>
                  <span className="text-[11px] text-zinc-400">
                    {dayStatsMap[selectedCalDate].hasRecords
                      ? 'Lançamentos deste dia selecionado'
                      : 'Nenhum lançamento registrado nesta data'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedCalDate(null)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
                title="Fechar detalhes do dia"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Best day badge if this is the record day */}
            {bestDayOfMonth && selectedCalDate === bestDayOfMonth.date && (
              <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-transparent border border-amber-500/40 rounded-xl p-3 flex items-center gap-2.5 text-xs text-amber-300 shadow-sm">
                <div className="p-1.5 rounded-lg bg-amber-400 text-zinc-950 font-black shrink-0">
                  <Award className="w-4 h-4" />
                </div>
                <div>
                  <strong className="text-white block sm:inline">Dia Recorde do Mês!</strong>{' '}
                  <span>
                    Este foi o melhor faturamento diário de todo o mês de <span className="capitalize">{formattedMonthName}</span> ({formatCurrency(bestDayOfMonth.gross)}).
                  </span>
                </div>
              </div>
            )}

            {dayStatsMap[selectedCalDate].hasRecords ? (
              <div className="space-y-3">
                {/* 4 Quick KPIs for that day */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Faturamento Bruto</span>
                    <strong className="text-sm font-black text-emerald-400">
                      {formatCurrency(dayStatsMap[selectedCalDate].gross)}
                    </strong>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Despesas</span>
                    <strong className="text-sm font-black text-rose-400">
                      -{formatCurrency(dayStatsMap[selectedCalDate].expense)}
                    </strong>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Lucro Líquido</span>
                    <strong className="text-sm font-black text-white">
                      {formatCurrency(dayStatsMap[selectedCalDate].net)}
                    </strong>
                  </div>
                  <div className="bg-zinc-900/80 p-2.5 rounded-xl border border-zinc-800">
                    <span className="text-zinc-400 block text-[10px]">Produção</span>
                    <strong className="text-sm font-bold text-sky-400">
                      {dayStatsMap[selectedCalDate].rides} corridas • {formatHours(dayStatsMap[selectedCalDate].hours)}
                    </strong>
                  </div>
                </div>

                {/* Earnings entries breakdown */}
                {dayStatsMap[selectedCalDate].earnings.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Ganhos por Aplicativo ({dayStatsMap[selectedCalDate].earnings.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {dayStatsMap[selectedCalDate].earnings.map((e) => {
                        const plat = activePlatforms.find((p) => p.id === e.platformId);
                        return (
                          <div
                            key={e.id}
                            className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <span
                                className="w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: plat?.accentColor || '#10b981' }}
                              />
                              <div>
                                <span className="font-bold text-white block">
                                  {plat?.name || e.platformId}
                                </span>
                                <span className="text-[10px] text-zinc-400">
                                  {e.ridesCount} corridas • {formatHours(e.onlineHours)} • {e.kmDriven} km
                                </span>
                              </div>
                            </div>
                            <strong className="text-emerald-400 font-extrabold text-sm">
                              {formatCurrency(e.grossAmount)}
                            </strong>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Expense entries breakdown */}
                {dayStatsMap[selectedCalDate].expenses.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Despesas Realizadas ({dayStatsMap[selectedCalDate].expenses.length})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      {dayStatsMap[selectedCalDate].expenses.map((exp) => (
                        <div
                          key={exp.id}
                          className="bg-zinc-900 p-2.5 rounded-xl border border-zinc-800/80 flex items-center justify-between"
                        >
                          <div>
                            <span className="font-bold text-white capitalize block">
                              {exp.category}
                            </span>
                            <span className="text-[10px] text-zinc-400">
                              {exp.notes || 'Sem observações'}
                              {exp.liters ? ` • ${exp.liters} L` : ''}
                            </span>
                          </div>
                          <strong className="text-rose-400 font-extrabold text-sm">
                            -{formatCurrency(exp.amount)}
                          </strong>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-4 text-xs text-zinc-500">
                Nenhum faturamento ou custo lançado em {formatDateBR(selectedCalDate)}.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Breakdown by App (Comparison & Rankings) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Platform Distribution Bars (7 cols) */}
        <div className="lg:col-span-7 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3 flex-wrap gap-2">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <PieChart className="w-4 h-4 text-emerald-400" />
                Faturamento por Aplicativo
              </h3>
              <p className="text-xs text-zinc-400">
                {isAllPlatformsSelected
                  ? 'Divisão proporcional das suas fontes de receita e quilometragem'
                  : `Exibindo apenas ${visiblePlatforms.map((p) => p.name).join(', ')}`}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-black text-sky-400 bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/30 flex items-center gap-1.5 shadow-sm">
                <Navigation className="w-3.5 h-3.5" />
                Total: {formatNumber(totalKm, 1)} km rodados
              </span>
              {topPlatform && (
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 hidden sm:inline">
                  Top App: {topPlatform.name} ({topPlatform.percent.toFixed(0)}%)
                </span>
              )}
            </div>
          </div>

          {platformStats.length === 0 ? (
            <div className="text-center py-8 text-zinc-500 text-xs space-y-2">
              <p>
                {effectiveSelectedPlatformIds.length === 0
                  ? 'Nenhum aplicativo selecionado no filtro.'
                  : 'Nenhum faturamento registrado para os aplicativos selecionados no período.'}
              </p>
              {!isAllPlatformsSelected && (
                <button
                  type="button"
                  onClick={selectAllPlatforms}
                  className="px-3 py-1.5 rounded-lg bg-zinc-800 text-purple-400 hover:text-white text-xs font-bold transition-colors cursor-pointer"
                >
                  Exibir todos os aplicativos
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3.5">
              {/* Consolidated Grand Total Box with sum of all km driven */}
              <div className="bg-gradient-to-r from-sky-950/40 via-zinc-950 to-emerald-950/20 border border-sky-500/30 rounded-xl p-3.5 shadow-md">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 shrink-0">
                      <Navigation className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                        Somatória Total de KM Rodados
                      </div>
                      <div className="text-lg sm:text-xl font-black text-white">
                        {formatNumber(totalKm, 1)} km{' '}
                        <span className="text-xs font-semibold text-zinc-400">
                          {isAllPlatformsSelected
                            ? '(em todos os apps)'
                            : `(${visiblePlatforms.length} ${visiblePlatforms.length === 1 ? 'app selecionado' : 'apps selecionados'})`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Faturamento</span>
                      <strong className="text-emerald-400 font-extrabold text-xs sm:text-sm">
                        {formatCurrency(totalGross)}
                      </strong>
                    </div>
                    <div className="bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Corridas</span>
                      <strong className="text-white font-bold text-xs sm:text-sm">
                        {totalRides}
                      </strong>
                    </div>
                    <div className="bg-zinc-900/80 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                      <span className="text-[10px] text-zinc-400 block">Média Geral/km</span>
                      <strong className="text-sky-300 font-bold text-xs sm:text-sm">
                        {formatCurrency(ratePerKm)}/km
                      </strong>
                    </div>
                  </div>
                </div>
              </div>

              {platformStats.map((p) => {
                const pRatePerHour = p.hours > 0 ? p.amount / p.hours : 0;
                const pRatePerKm = p.km > 0 ? p.amount / p.km : 0;

                return (
                  <div key={p.id} className="space-y-2 bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/60">
                    <div className="flex items-center justify-between text-xs gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="w-3 h-3 rounded-md shrink-0"
                          style={{ backgroundColor: p.accentColor }}
                        />
                        <strong className="text-white text-sm">{p.name}</strong>
                        <span className="text-zinc-400 text-[11px] flex items-center gap-1.5 flex-wrap">
                          <span>• {p.rides} {p.rides === 1 ? 'corrida' : 'corridas'}</span>
                          <span className="text-zinc-600">•</span>
                          <span>{formatHours(p.hours)}</span>
                          <span className="text-zinc-600">•</span>
                          <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-sky-400" />
                            {formatNumber(p.km, 1)} km rodados
                          </span>
                        </span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className="font-extrabold text-white text-sm">
                          {formatCurrency(p.amount)}
                        </span>
                        <span className="text-xs text-zinc-400 ml-1.5">
                          ({p.percent.toFixed(1)}%)
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar with official app color */}
                    <div className="w-full bg-zinc-950 h-2.5 rounded-full overflow-hidden border border-zinc-800/80">
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{
                          width: `${p.percent}%`,
                          backgroundColor: p.accentColor,
                        }}
                      />
                    </div>

                    {/* Operational metrics breakdown per app */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] pt-0.5">
                      <div className="bg-zinc-900/90 px-2 py-1 rounded-md flex items-center justify-between border border-zinc-800/60">
                        <span className="text-zinc-400">Total KM:</span>
                        <strong className="text-sky-400 font-bold">{formatNumber(p.km, 1)} km</strong>
                      </div>
                      <div className="bg-zinc-900/90 px-2 py-1 rounded-md flex items-center justify-between border border-zinc-800/60">
                        <span className="text-zinc-400">Média/km:</span>
                        <strong className="text-emerald-400 font-bold">{formatCurrency(pRatePerKm)}/km</strong>
                      </div>
                      <div className="bg-zinc-900/90 px-2 py-1 rounded-md flex items-center justify-between border border-zinc-800/60">
                        <span className="text-zinc-400">Média/hora:</span>
                        <strong className="text-zinc-200 font-bold">{formatCurrency(pRatePerHour)}/h</strong>
                      </div>
                      <div className="bg-zinc-900/90 px-2 py-1 rounded-md flex items-center justify-between border border-zinc-800/60">
                        <span className="text-zinc-400">Ticket Médio:</span>
                        <strong className="text-zinc-200 font-bold">{formatCurrency(p.rides > 0 ? p.amount / p.rides : 0)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Operational Health & Cost breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              Saúde Financeira do Motorista
            </h3>
            <p className="text-xs text-zinc-400">Diagnóstico operacional das suas rotinas</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-semibold block">Ticket Médio por Corrida</span>
                <span className="text-[10px] text-zinc-500">Média de valor recebido por viagem</span>
              </div>
              <strong className="text-sm font-black text-white">
                {formatCurrency(ticketAverage)}
              </strong>
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-semibold block">Lucro Líquido por Hora</span>
                <span className="text-[10px] text-zinc-500">O que realmente entra por hora livre</span>
              </div>
              <strong
                className={`text-sm font-black ${
                  netPerHour >= 30 ? 'text-emerald-400' : 'text-amber-400'
                }`}
              >
                {formatCurrency(netPerHour)}/h
              </strong>
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-semibold block">Custo Operacional por KM</span>
                <span className="text-[10px] text-zinc-500">Despesas divididas pelo km rodado</span>
              </div>
              <strong className="text-sm font-black text-rose-400">
                {formatCurrency(totalKm > 0 ? totalExpenses / totalKm : 0)}/km
              </strong>
            </div>

            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800/80 flex items-center justify-between">
              <div>
                <span className="text-zinc-400 font-semibold block">Produtividade por Hora</span>
                <span className="text-[10px] text-zinc-500">Corridas atendidas a cada 60 min</span>
              </div>
              <strong className="text-sm font-black text-white">
                {totalHours > 0 ? (totalRides / totalHours).toFixed(1) : 0} viagens/h
              </strong>
            </div>
          </div>
        </div>
      </div>

      {/* Daily Evolution Visual Bars */}
      {dailyEvolution.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <div>
              <h3 className="font-bold text-white text-base flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-sky-400" />
                Evolução Diária (Bruto vs Líquido vs Despesas)
              </h3>
              <p className="text-xs text-zinc-400">Acompanhamento dia a dia do seu caixa</p>
            </div>
            <div className="flex items-center gap-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" /> Lucro Líquido
              </span>
              <span className="flex items-center gap-1.5 text-zinc-400">
                <span className="w-2.5 h-2.5 rounded-full bg-zinc-500" /> Faturamento Bruto
              </span>
              <span className="flex items-center gap-1.5 text-rose-400">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Despesas
              </span>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {dailyEvolution.map((day) => {
              const grossPercent = (day.gross / maxDailyGross) * 100;
              const netPercent = Math.max(0, (day.net / maxDailyGross) * 100);

              return (
                <div key={day.date} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">{formatDateBR(day.date)}</span>
                    <div className="flex items-center gap-3 font-semibold">
                      <span className="text-zinc-400">Bruto: {formatCurrency(day.gross)}</span>
                      <span className="text-rose-400">Desp: -{formatCurrency(day.expense)}</span>
                      <span className="text-emerald-400 font-bold">
                        Líq: {formatCurrency(day.net)}
                      </span>
                    </div>
                  </div>

                  <div className="w-full bg-zinc-950 h-3 rounded-full overflow-hidden flex relative border border-zinc-800/80">
                    <div
                      className="bg-emerald-500 h-full rounded-full transition-all"
                      style={{ width: `${netPercent}%` }}
                    />
                    <div
                      className="bg-rose-500/80 h-full transition-all"
                      style={{ width: `${Math.min(100 - netPercent, (day.expense / maxDailyGross) * 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
