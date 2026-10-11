import React, { useState } from 'react';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Fuel,
  DollarSign,
  Car,
  Clock,
  Navigation,
  Plus,
  Share2,
  Trash2,
  Edit2,
  Sparkles,
  Target,
  CheckCircle,
  Package,
  Layers,
  Settings2,
  PieChart,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import { EarningsEntry, ExpenseEntry, DriverProfile, PlatformOption } from '../types';
import { PLATFORMS, getRelativeDate } from '../data/constants';
import { calculateFuelCycles } from '../utils/fuelTracking';
import {
  formatCurrency,
  formatDateBR,
  formatDateFull,
  formatLocalDate,
  formatHours,
  formatNumber,
  generateWhatsAppReport,
  calculateDailyVehicleCost,
  countWorkingDaysInMonth,
  calculateDateDiffDays,
  calculatePlatformFilteredData,
} from '../utils/helpers';
import { DateRangePicker } from './DateRangePicker';

export type TimeFilterPeriod = 'day' | 'week' | 'month' | 'year' | 'custom';

interface DayOverviewProps {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
  earnings: EarningsEntry[];
  expenses: ExpenseEntry[];
  profile: DriverProfile;
  platforms?: PlatformOption[];
  selectedPlatformIds?: string[];
  setSelectedPlatformIds?: (ids: string[]) => void;
  onOpenManagePlatforms?: () => void;
  onOpenAddEarnings: () => void;
  onOpenAddExpense: () => void;
  onEditEarnings: (entry: EarningsEntry) => void;
  onDeleteEarnings: (id: string) => void;
  onDeleteExpense: (id: string) => void;
  onEditExpense?: (expense: ExpenseEntry) => void;
  onToggleEarningsCalculation?: (id: string) => void;
  onToggleExpenseCalculation?: (id: string) => void;
  onNavigateToFuel?: () => void;
}

export const DayOverview: React.FC<DayOverviewProps> = ({
  selectedDate,
  setSelectedDate,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  earnings,
  expenses,
  profile,
  platforms,
  selectedPlatformIds,
  setSelectedPlatformIds,
  onOpenManagePlatforms,
  onOpenAddEarnings,
  onOpenAddExpense,
  onEditEarnings,
  onDeleteEarnings,
  onDeleteExpense,
  onEditExpense,
  onToggleEarningsCalculation,
  onToggleExpenseCalculation,
  onNavigateToFuel,
}) => {
  const activePlatforms = platforms || PLATFORMS;
  const allPlatformIds = activePlatforms.map((p) => p.id);
  const [internalPlatformIds, setInternalPlatformIds] = useState<string[]>(allPlatformIds);

  const effectiveSelectedPlatformIds = selectedPlatformIds || internalPlatformIds;
  const setEffectiveSelectedPlatformIds = (ids: string[]) => {
    if (setSelectedPlatformIds) setSelectedPlatformIds(ids);
    else setInternalPlatformIds(ids);
  };

  const isAllPlatformsSelected =
    effectiveSelectedPlatformIds.length === 0 ||
    effectiveSelectedPlatformIds.length === allPlatformIds.length;

  const togglePlatform = (id: string) => {
    if (isAllPlatformsSelected) {
      setEffectiveSelectedPlatformIds([id]);
    } else if (effectiveSelectedPlatformIds.includes(id)) {
      const next = effectiveSelectedPlatformIds.filter((pId) => pId !== id);
      setEffectiveSelectedPlatformIds(next.length === 0 ? allPlatformIds : next);
    } else {
      setEffectiveSelectedPlatformIds([...effectiveSelectedPlatformIds, id]);
    }
  };

  const selectAllPlatforms = () => {
    setEffectiveSelectedPlatformIds(allPlatformIds);
  };

  const clearAllPlatforms = () => {
    setEffectiveSelectedPlatformIds([]);
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

  const [periodFilter, setPeriodFilter] = useState<TimeFilterPeriod>('day');
  const [copied, setCopied] = useState(false);

  // Compute date range based on periodFilter and selectedDate
  const getPeriodRange = () => {
    if (periodFilter === 'custom') {
      const daysCount = calculateDateDiffDays(effectiveCustomStartDate, effectiveCustomEndDate);
      return {
        startDate: effectiveCustomStartDate,
        endDate: effectiveCustomEndDate,
        label: `Período ${formatDateBR(effectiveCustomStartDate)} a ${formatDateBR(effectiveCustomEndDate)}`,
        subLabel: `${daysCount} ${daysCount === 1 ? 'dia selecionado' : 'dias selecionados'}`,
        multiplier: daysCount,
      };
    }

    const [yearStr, monthStr, dayStr] = selectedDate.split('-');
    const baseDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

    if (periodFilter === 'day') {
      return {
        startDate: selectedDate,
        endDate: selectedDate,
        label: isToday ? 'Hoje' : isYesterday ? 'Ontem' : formatDateBR(selectedDate),
        subLabel: formatDateFull(selectedDate),
        multiplier: 1,
      };
    }

    if (periodFilter === 'week') {
      // Find Monday (or Sunday) of the week for baseDate
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
        subLabel: `Fechamento semanal consolidado`,
        multiplier: 7,
      };
    }

    if (periodFilter === 'month') {
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

  const isToday = selectedDate === getRelativeDate(0);
  const isYesterday = selectedDate === getRelativeDate(1);

  const range = getPeriodRange();

  // Filter entries within period range
  const periodDateEarnings = earnings.filter(
    (e) => e.date >= range.startDate && e.date <= range.endDate
  );
  const periodDateExpenses = expenses.filter(
    (e) => e.date >= range.startDate && e.date <= range.endDate
  );

  // Platform filtered data (apportioning general expenses if filtered by app)
  const {
    filteredEarnings,
    filteredExpenses,
    totalGross,
    totalExpenses: totalExpenseAmount,
    netProfit,
    totalRides,
    totalHours,
    totalKm,
    ratePerHour,
    ratePerKm,
    netPerHour,
  } = calculatePlatformFilteredData(
    periodDateEarnings,
    periodDateExpenses,
    effectiveSelectedPlatformIds,
    allPlatformIds
  );

  // Filter only entries included in calculations for totals
  const calcEarnings = filteredEarnings.filter((e) => e.includeInCalculations !== false);
  const calcExpenses = filteredExpenses.filter((e) => e.includeInCalculations !== false);
  const totalTips = calcEarnings.reduce((acc, curr) => acc + (curr.tipsOrBonus || 0), 0);

  // Target metrics scaled for the selected period
  const dailyTarget = profile.targetDailyGross || 350;
  let periodTarget = dailyTarget;
  let targetTitle = 'Meta Diária de Produção';

  const workdaysSelectedCount = profile.workdaysOfWeek && profile.workdaysOfWeek.length > 0
    ? profile.workdaysOfWeek.length
    : 6;

  const [selYearStr, selMonthStr] = selectedDate.split('-');
  const monthWorkdaysCount = countWorkingDaysInMonth(
    Number(selYearStr),
    Number(selMonthStr),
    profile.workdaysOfWeek
  );

  const vehicleCostSummary = calculateDailyVehicleCost(profile);
  const fuelTelemetry = calculateFuelCycles(expenses, earnings, profile);
  const latestFuelCycle = fuelTelemetry.currentCycle;

  if (periodFilter === 'week') {
    periodTarget = dailyTarget * workdaysSelectedCount;
    targetTitle = `Meta Semanal (${workdaysSelectedCount} dias selecionados)`;
  } else if (periodFilter === 'month') {
    periodTarget = dailyTarget * monthWorkdaysCount;
    targetTitle = `Meta Mensal (${monthWorkdaysCount} dias de trabalho no mês)`;
  } else if (periodFilter === 'year') {
    const annualWorkdays = workdaysSelectedCount * 52;
    periodTarget = dailyTarget * annualWorkdays;
    targetTitle = `Meta Anual (~${annualWorkdays} dias de trabalho)`;
  } else if (periodFilter === 'custom') {
    const daysCount = calculateDateDiffDays(effectiveCustomStartDate, effectiveCustomEndDate);
    periodTarget = dailyTarget * daysCount;
    targetTitle = `Meta do Período (${daysCount} ${daysCount === 1 ? 'dia' : 'dias'})`;
  }

  const progressPercent = Math.min(100, Math.round((totalGross / periodTarget) * 100));
  const remainingToGoal = Math.max(0, periodTarget - totalGross);

  // Date shifting according to period
  const handleDateShift = (direction: number) => {
    if (periodFilter === 'custom') {
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

    const [yearStr, monthStr, dayStr] = selectedDate.split('-');
    const current = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

    if (periodFilter === 'day') {
      current.setDate(current.getDate() + direction);
    } else if (periodFilter === 'week') {
      current.setDate(current.getDate() + direction * 7);
    } else if (periodFilter === 'month') {
      current.setMonth(current.getMonth() + direction);
    } else if (periodFilter === 'year') {
      current.setFullYear(current.getFullYear() + direction);
    }

    setSelectedDate(formatLocalDate(current));
  };

  // Active platform summary with earnings, hours, rides and total KM driven
  const allPlatforms = platforms || PLATFORMS;
  const activeAppSummary = allPlatforms
    .map((p) => {
      const pEntries = calcEarnings.filter((e) => e.platformId === p.id);
      const amount = pEntries.reduce((acc, curr) => acc + curr.grossAmount, 0);
      const count = pEntries.reduce((acc, curr) => acc + curr.ridesCount, 0);
      const hours = pEntries.reduce((acc, curr) => acc + curr.onlineHours, 0);
      const km = pEntries.reduce((acc, curr) => acc + curr.kmDriven, 0);
      return { ...p, amount, count, hours, km };
    })
    .filter((p) => p.amount > 0 || p.km > 0)
    .sort((a, b) => b.amount - a.amount);

  // WhatsApp share
  const handleShareWhatsApp = () => {
    const platformSummary = activeAppSummary.map((p) => ({
      name: p.name,
      amount: p.amount,
      count: p.count,
      km: p.km,
    }));

    const reportText = generateWhatsAppReport(
      periodFilter === 'day' ? selectedDate : `${range.startDate} até ${range.endDate}`,
      totalGross,
      totalExpenseAmount,
      netProfit,
      totalRides,
      totalHours,
      totalKm,
      platformSummary
    );

    if (navigator.clipboard) {
      navigator.clipboard.writeText(reportText);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Date & Period Navigation Bar */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
        {/* Top row: Period Selector Tabs + Quick Share */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto">
            <span className="text-[11px] font-semibold text-zinc-400 px-2 hidden sm:inline flex items-center gap-1">
              <Layers className="w-3 h-3 text-emerald-400" />
              Período:
            </span>
            <button
              id="filter-period-day"
              type="button"
              onClick={() => setPeriodFilter('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'day'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dia
            </button>
            <button
              id="filter-period-week"
              type="button"
              onClick={() => setPeriodFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'week'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              id="filter-period-month"
              type="button"
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              id="filter-period-year"
              type="button"
              onClick={() => setPeriodFilter('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'year'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anual
            </button>
            <button
              id="filter-period-custom"
              type="button"
              onClick={() => setPeriodFilter('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'custom'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Período
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Copiar relatório para o WhatsApp"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>{copied ? 'Copiado!' : 'WhatsApp'}</span>
            </button>
          </div>
        </div>

        {/* Bottom row: Stepper navigation + Date picker */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
            <button
              onClick={() => handleDateShift(-1)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={
                periodFilter === 'day'
                  ? 'Dia anterior'
                  : periodFilter === 'week'
                  ? 'Semana anterior'
                  : periodFilter === 'month'
                  ? 'Mês anterior'
                  : periodFilter === 'year'
                  ? 'Ano anterior'
                  : 'Período anterior'
              }
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <span className="font-extrabold text-white text-base sm:text-lg">
                  {range.label}
                </span>
                {periodFilter === 'day' && (
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700">
                    {formatDateBR(selectedDate)}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 capitalize">
                {range.subLabel}
              </p>
            </div>

            <button
              onClick={() => handleDateShift(1)}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
              title={
                periodFilter === 'day'
                  ? 'Próximo dia'
                  : periodFilter === 'week'
                  ? 'Próxima semana'
                  : periodFilter === 'month'
                  ? 'Próximo mês'
                  : periodFilter === 'year'
                  ? 'Próximo ano'
                  : 'Próximo período'
              }
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Date Presets & Custom Picker */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-center sm:justify-end">
            <button
              onClick={() => {
                setPeriodFilter('day');
                setSelectedDate(getRelativeDate(0));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isToday && periodFilter === 'day'
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => {
                setPeriodFilter('day');
                setSelectedDate(getRelativeDate(1));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isYesterday && periodFilter === 'day'
                  ? 'bg-zinc-800 text-emerald-400 border border-emerald-500/40'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Ontem
            </button>

            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => {
                  setPeriodFilter('day');
                  setSelectedDate(e.target.value);
                }}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-emerald-500 cursor-pointer"
                title="Selecionar data base"
              />
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker matching the user's reference screenshot */}
        {periodFilter === 'custom' && (
          <div className="pt-3 border-t border-zinc-800/80 animate-in fade-in">
            <DateRangePicker
              startDate={effectiveCustomStartDate}
              endDate={effectiveCustomEndDate}
              onChangeStartDate={setEffectiveCustomStartDate}
              onChangeEndDate={setEffectiveCustomEndDate}
              accentColor="emerald"
            />
          </div>
        )}

        {/* Platform/App Multi-select Filter */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-md bg-emerald-500/10 text-emerald-400">
                <Car className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Filtrar por Aplicativo:
              </span>
              <span className="text-[11px] font-semibold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {isAllPlatformsSelected
                  ? `Todos os Apps (${activePlatforms.length})`
                  : `${effectiveSelectedPlatformIds.length} de ${activePlatforms.length} selecionado(s)`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-emerald-400 hover:text-emerald-300 font-bold transition-colors cursor-pointer"
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

          {/* Chips list */}
          <div className="flex flex-wrap items-center gap-1.5">
            {/* Button Todos */}
            <button
              type="button"
              onClick={selectAllPlatforms}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAllPlatformsSelected
                  ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-sm shadow-emerald-500/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos os Apps ({activePlatforms.length})</span>
            </button>

            {/* Individual Platform chips */}
            {activePlatforms.map((plat) => {
              const isSelected = effectiveSelectedPlatformIds.includes(plat.id);
              const platGross = periodDateEarnings
                .filter((e) => e.platformId === plat.id && e.includeInCalculations !== false)
                .reduce((acc, curr) => acc + curr.grossAmount, 0);

              return (
                <button
                  type="button"
                  key={plat.id}
                  onClick={() => togglePlatform(plat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? isAllPlatformsSelected
                        ? 'bg-zinc-950 text-zinc-200 border-zinc-700 hover:border-zinc-600 hover:text-white'
                        : 'bg-emerald-950/40 text-white border-emerald-500 ring-1 ring-emerald-500/50 shadow-sm'
                      : 'bg-zinc-950/40 text-zinc-500 border-zinc-900 opacity-60 hover:opacity-90 hover:text-zinc-400'
                  }`}
                  title={
                    isAllPlatformsSelected
                      ? `Filtrar apenas ${plat.name}`
                      : isSelected
                      ? `Remover ${plat.name}`
                      : `Adicionar ${plat.name}`
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: plat.accentColor || '#10b981' }}
                  />
                  <span>{plat.name}</span>
                  {isSelected && !isAllPlatformsSelected && (
                    <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  {platGross > 0 && (
                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-900 text-zinc-400 border border-zinc-800">
                      {formatCurrency(platGross)}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {!isAllPlatformsSelected && effectiveSelectedPlatformIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400 bg-emerald-950/20 border border-emerald-500/20 rounded-lg px-2.5 py-1.5">
              <span>
                Filtrando por:{' '}
                <strong className="text-white">
                  {activePlatforms.filter((p) => effectiveSelectedPlatformIds.includes(p.id)).map((p) => p.name).join(', ')}
                </strong>
                . Ganhos e despesas da data selecionada ajustados proporcionalmente.
              </span>
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-emerald-400 hover:text-emerald-300 font-bold underline shrink-0 cursor-pointer text-left sm:text-right"
              >
                Ver todos os apps
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Daily/Period Target Progress Card */}
      <div className="bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                {targetTitle}
              </span>
              {progressPercent >= 100 && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  🎉 Meta Batida!
                </span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                {formatCurrency(totalGross)}
              </span>
              <span className="text-sm font-semibold text-zinc-400">
                / {formatCurrency(periodTarget)}
              </span>
            </div>
            <p className="text-xs text-zinc-400">
              {progressPercent >= 100
                ? `Excelente! Você superou sua meta do período por ${formatCurrency(totalGross - periodTarget)}.`
                : `Faltam ${formatCurrency(remainingToGoal)} para atingir os 100% da sua meta no período selecionado.`}
            </p>
          </div>

          <div className="sm:text-right space-y-1">
            <div className="text-2xl sm:text-3xl font-black text-emerald-400">
              {progressPercent}%
            </div>
            <div className="text-xs text-zinc-400">
              {formatHours(totalHours)} online • {totalRides} corridas
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 w-full bg-zinc-800/80 rounded-full h-3 overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              progressPercent >= 100
                ? 'bg-gradient-to-r from-emerald-500 via-emerald-400 to-amber-400 shadow-md shadow-emerald-500/40'
                : 'bg-emerald-500'
            }`}
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Vehicle Cost Impact breakdown if rented or financed */}
        {(profile.vehicleOwnershipType === 'alugado' || profile.vehicleOwnershipType === 'financiado') &&
          (profile.vehicleMonthlyPayment || 0) > 0 && (
            <div className="mt-3.5 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center justify-between text-[11px] gap-2">
              <span className="text-zinc-400 flex items-center gap-1.5">
                <Car className="w-3.5 h-3.5 text-amber-400" />
                <span>
                  Veículo{' '}
                  <strong className="text-amber-300">
                    ({profile.vehicleOwnershipType === 'alugado' ? 'Alugado' : 'Financiado'}):
                  </strong>{' '}
                  <strong className="text-white">{formatCurrency(profile.vehicleMonthlyPayment || 0)}/mês</strong>
                </span>
              </span>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 font-semibold">
                  {vehicleCostSummary.workingDaysThisMonth} dias no mês ({workdaysSelectedCount} dias/sem)
                </span>
                <span className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                  {formatCurrency(vehicleCostSummary.dailyCost)}/dia trabalhado
                </span>
              </div>
            </div>
          )}
      </div>

      {/* Main KPI 4-Card Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Faturamento Bruto */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Bruto nos Apps</span>
            <div className="p-1.5 bg-emerald-500/10 text-emerald-400 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-white tracking-tight">
            {formatCurrency(totalGross)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1 flex items-center gap-1">
            <span>+{formatCurrency(totalTips)} em bônus/gorjetas</span>
          </div>
        </div>

        {/* Despesas do Período */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Despesas</span>
            <div className="p-1.5 bg-rose-500/10 text-rose-400 rounded-lg">
              <Fuel className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-rose-400 tracking-tight">
            -{formatCurrency(totalExpenseAmount)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {filteredExpenses.length} abastecimentos/gastos
          </div>
        </div>

        {/* Lucro Líquido Real */}
        <div className="bg-zinc-900 border border-emerald-500/30 rounded-2xl p-4 shadow-sm bg-gradient-to-br from-zinc-900 to-emerald-950/20">
          <div className="flex items-center justify-between text-emerald-400 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido Real</span>
            <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div
            className={`text-xl sm:text-2xl font-black tracking-tight ${
              netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {formatCurrency(netProfit)}
          </div>
          <div className="text-[11px] text-zinc-400 mt-1">
            {totalGross > 0 ? `${Math.round((netProfit / totalGross) * 100)}% de margem no bolso` : 'Livre de despesas'}
          </div>
        </div>

        {/* Indicadores Médios (R$/h e R$/km) */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-zinc-400 mb-2">
            <span className="text-xs font-semibold">Eficiência / Ritmo</span>
            <div className="p-1.5 bg-sky-500/10 text-sky-400 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-base sm:text-lg font-black text-white">
                {formatCurrency(ratePerHour)}
                <span className="text-[11px] font-normal text-zinc-500">/h</span>
              </div>
              <div className="text-[10px] text-zinc-400">{formatHours(totalHours)} online</div>
            </div>
            <div className="text-right">
              <div className="text-base sm:text-lg font-black text-white">
                {formatCurrency(ratePerKm)}
                <span className="text-[11px] font-normal text-zinc-500">/km</span>
              </div>
              <div className="text-[10px] text-zinc-400">{formatNumber(totalKm, 0)} km rodados</div>
            </div>
          </div>
        </div>
      </div>

      {/* Live Fuel Telemetry from Latest Fill-up */}
      {latestFuelCycle && (
        <div className="bg-gradient-to-r from-zinc-950 via-zinc-900 to-amber-950/20 border border-amber-500/30 rounded-2xl p-4 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
                  Último Abastecimento ({formatDateBR(latestFuelCycle.fillDate)})
                </span>
                <span className="text-zinc-400 text-[11px]">
                  {latestFuelCycle.liters.toFixed(1)} L de {latestFuelCycle.fuelType}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 mt-1">
                <span className="text-white font-bold text-sm">
                  {latestFuelCycle.kmDriven.toLocaleString('pt-BR')} km rodados
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-300">
                  Média atual:{' '}
                  <strong className="text-emerald-400 font-black text-sm">
                    {latestFuelCycle.kmPerLiter > 0 ? `${latestFuelCycle.kmPerLiter.toFixed(2)} km/L` : '0,00 km/L'}
                  </strong>
                </span>
                <span className="text-zinc-500">•</span>
                <span className="text-zinc-400">
                  ~{latestFuelCycle.remainingKmEstimate.toFixed(0)} km de autonomia restante
                </span>
              </div>
            </div>
          </div>

          {onNavigateToFuel && (
            <button
              type="button"
              onClick={onNavigateToFuel}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-xl font-bold text-xs transition-colors self-start md:self-auto cursor-pointer"
            >
              <span>Ver Análise de Consumo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* Main Section: Ganhos Registrados por Aplicativo */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Car className="w-5 h-5 text-emerald-400" />
              Lançamentos por Aplicativo ({filteredEarnings.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Extrato do período ({range.label}) detalhado de Uber, 99, inDrive, Mercado Livre e outros
            </p>
          </div>

          <div className="flex items-center gap-2">
            {onOpenManagePlatforms && (
              <button
                type="button"
                onClick={onOpenManagePlatforms}
                className="flex items-center gap-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-2 rounded-xl text-xs font-semibold border border-zinc-700 transition-all cursor-pointer"
              >
                <Settings2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Gerenciar Apps</span>
              </button>
            )}

            <button
              id="btn-day-add-earnings"
              onClick={onOpenAddEarnings}
              className="flex items-center justify-center gap-2 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Lançar Ganhos</span>
            </button>
          </div>
        </div>

        {filteredEarnings.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <Car className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-300 font-semibold text-sm">
              Nenhum ganho registrado para este período.
            </p>
            <p className="text-zinc-500 text-xs mt-1 max-w-sm mx-auto">
              Clique no botão acima para registrar seus ganhos da Uber, 99, inDrive ou Mercado Livre.
            </p>
            <button
              onClick={onOpenAddEarnings}
              className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              + Lançar Primeiro Ganho
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Consolidated Summary: Faturamento & KM por Aplicativo */}
            {activeAppSummary.length > 0 && (
              <div className="bg-zinc-950/80 border border-zinc-800/90 rounded-xl p-3.5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <PieChart className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs sm:text-sm font-bold text-white">
                      Faturamento por Aplicativo
                    </h3>
                  </div>
                  <span className="text-[10px] text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
                    Consolidado ({range.label})
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                  {activeAppSummary.map((app) => {
                    const appRatePerKm = app.km > 0 ? app.amount / app.km : 0;
                    return (
                      <div
                        key={app.id}
                        className="bg-zinc-900/80 border border-zinc-800 rounded-xl p-3 flex flex-col justify-between gap-2 shadow-sm"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: app.accentColor }}
                            />
                            <strong className="text-white text-xs sm:text-sm">{app.name}</strong>
                          </div>
                          <span className="font-black text-emerald-400 text-sm">
                            {formatCurrency(app.amount)}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-[11px] pt-1 border-t border-zinc-800/60 text-zinc-400">
                          <span className="text-sky-400 font-bold bg-sky-500/10 px-2 py-0.5 rounded-md border border-sky-500/20 flex items-center gap-1">
                            <Navigation className="w-3 h-3 text-sky-400" />
                            {formatNumber(app.km, 0)} km rodados
                          </span>
                          <span>
                            {app.count} {app.count === 1 ? 'corrida' : 'corridas'} ({formatCurrency(appRatePerKm)}/km)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Individual Entries Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {filteredEarnings.map((entry) => {
                const platform = allPlatforms.find((p) => p.id === entry.platformId) || {
                  id: entry.platformId,
                  name: entry.platformId,
                  tag: 'App',
                  textColor: 'text-zinc-200',
                  bgColor: 'bg-zinc-900',
                  borderColor: 'border-zinc-700',
                  category: 'carro' as const,
                };
                const pRatePerHour = entry.onlineHours > 0 ? entry.grossAmount / entry.onlineHours : 0;
                const pRatePerKm = entry.kmDriven > 0 ? entry.grossAmount / entry.kmDriven : 0;

                return (
                  <div
                    key={entry.id}
                    className="bg-zinc-950/80 border border-zinc-800 hover:border-zinc-700 rounded-xl p-4 transition-all space-y-3 relative group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center border ${platform.bgColor} ${platform.borderColor}`}
                        >
                          {platform.category === 'entrega' ? (
                            <Package className="w-5 h-5 text-white" />
                          ) : (
                            <Car className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-extrabold text-white text-base">
                              {platform.name}
                            </span>
                            <span className="text-[10px] uppercase font-bold text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
                              {entry.shift}
                            </span>
                            {entry.includeInCalculations === false ? (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium inline-flex items-center gap-1">
                                <XCircle className="w-3 h-3" />
                                Fora dos cálculos
                              </span>
                            ) : (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium inline-flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Nos cálculos
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                            <span>{platform.tag}</span>
                            <span className="text-zinc-600">•</span>
                            <span className="text-zinc-300 font-medium">{formatDateBR(entry.date)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div
                          className={`text-xl font-black ${
                            entry.includeInCalculations !== false
                              ? 'text-emerald-400'
                              : 'text-zinc-500 line-through decoration-zinc-600'
                          }`}
                        >
                          {formatCurrency(entry.grossAmount)}
                        </div>
                        {entry.tipsOrBonus > 0 && (
                          <div className="text-[10px] text-amber-400">
                            +{formatCurrency(entry.tipsOrBonus)} bônus
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Metrics grid with Total KM Rodado */}
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 pt-2 border-t border-zinc-900 text-center">
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Corridas</span>
                        <strong className="text-xs text-white">{entry.ridesCount}</strong>
                      </div>
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Km Rodado</span>
                        <strong className="text-xs text-sky-400 font-bold">
                          {formatNumber(entry.kmDriven, 0)} km
                        </strong>
                      </div>
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">Tempo</span>
                        <strong className="text-xs text-white">{formatHours(entry.onlineHours)}</strong>
                      </div>
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg">
                        <span className="text-[10px] text-zinc-500 block">R$/h</span>
                        <strong className="text-xs text-emerald-400 font-bold">
                          {formatCurrency(pRatePerHour)}
                        </strong>
                      </div>
                      <div className="bg-zinc-900/60 p-1.5 rounded-lg col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-zinc-500 block">R$/km</span>
                        <strong className="text-xs text-emerald-400 font-bold">
                          {formatCurrency(pRatePerKm)}
                        </strong>
                      </div>
                    </div>

                    {entry.notes && (
                      <p className="text-xs text-zinc-400 italic bg-zinc-900/40 px-2.5 py-1.5 rounded-lg">
                        "{entry.notes}"
                      </p>
                    )}

                    {/* Actions */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    {onToggleEarningsCalculation && (
                      <button
                        onClick={() => onToggleEarningsCalculation(entry.id)}
                        className={`p-1.5 rounded-lg text-xs flex items-center gap-1 border transition-colors cursor-pointer ${
                          entry.includeInCalculations !== false
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                        title={
                          entry.includeInCalculations !== false
                            ? 'Excluir dos cálculos'
                            : 'Incluir nos cálculos'
                        }
                      >
                        {entry.includeInCalculations !== false ? (
                          <Eye className="w-3.5 h-3.5" />
                        ) : (
                          <EyeOff className="w-3.5 h-3.5" />
                        )}
                        <span>
                          {entry.includeInCalculations !== false ? 'Nos cálculos' : 'Ignorado'}
                        </span>
                      </button>
                    )}
                    <button
                      onClick={() => onEditEarnings(entry)}
                      className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      onClick={() => onDeleteEarnings(entry.id)}
                      className="p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded-lg text-xs flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Excluir</span>
                    </button>
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>

      {/* Section: Despesas do Período */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
              <Fuel className="w-5 h-5 text-rose-400" />
              Despesas e Custos do Período ({filteredExpenses.length})
            </h2>
            <p className="text-xs text-zinc-400">
              Combustível, alimentação, pedágios e manutenção no período selecionado
            </p>
          </div>

          <button
            id="btn-day-add-expense"
            onClick={onOpenAddExpense}
            className="flex items-center justify-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Lançar Despesa</span>
          </button>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-zinc-800 rounded-xl bg-zinc-950/40">
            <p className="text-zinc-400 text-xs">
              Nenhuma despesa lançada neste período. Abasteceu ou almoçou na rua? Registre para calcular o lucro líquido real.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredExpenses.map((exp) => (
              <div
                key={exp.id}
                className={`bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 text-xs transition-opacity ${
                  exp.includeInCalculations === false ? 'opacity-70' : ''
                }`}
              >
                <div>
                  <div className="font-bold text-white uppercase tracking-wider text-[11px] flex items-center gap-1.5 flex-wrap">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span>{exp.category}</span>
                    {exp.includeInCalculations === false ? (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                        Fora dos cálculos
                      </span>
                    ) : (
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                        Ativo
                      </span>
                    )}
                  </div>
                  <div className="text-zinc-400 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <span className="text-zinc-300 font-medium">{formatDateBR(exp.date)}</span>
                    {exp.notes && <span>• {exp.notes}</span>}
                  </div>
                  {exp.liters && (
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {exp.liters} L • {exp.fuelType}
                      {exp.pricePerLiter ? ` @ ${formatCurrency(exp.pricePerLiter)}/L` : ''}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`font-black text-sm ${
                      exp.includeInCalculations !== false
                        ? 'text-rose-400'
                        : 'text-zinc-500 line-through decoration-zinc-600'
                    }`}
                  >
                    -{formatCurrency(exp.amount)}
                  </span>

                  <div className="flex items-center gap-1">
                    {onToggleExpenseCalculation && (
                      <button
                        onClick={() => onToggleExpenseCalculation(exp.id)}
                        className={`p-1 rounded border transition-colors cursor-pointer ${
                          exp.includeInCalculations !== false
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                            : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white'
                        }`}
                        title={
                          exp.includeInCalculations !== false
                            ? 'Desativar dos cálculos'
                            : 'Ativar nos cálculos'
                        }
                      >
                        {exp.includeInCalculations !== false ? (
                          <Eye className="w-3 h-3" />
                        ) : (
                          <EyeOff className="w-3 h-3" />
                        )}
                      </button>
                    )}
                    {onEditExpense && (
                      <button
                        onClick={() => onEditExpense(expenses.find((e) => e.id === exp.id) || exp)}
                        className="p-1 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                        title="Editar despesa"
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                    )}
                    <button
                      onClick={() => onDeleteExpense(exp.id)}
                      className="p-1 text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 rounded transition-colors cursor-pointer"
                      title="Remover despesa"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

