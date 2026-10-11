import React, { useState } from 'react';
import {
  DollarSign,
  Fuel,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Layers,
  Settings2,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Share2,
  Car,
  Check,
  ArrowRight,
} from 'lucide-react';
import {
  ExpenseEntry,
  EarningsEntry,
  DriverProfile,
  ExpenseCategoryConfig,
  FuelTypeConfig,
  PlatformOption,
} from '../types';
import { DEFAULT_EXPENSE_CATEGORIES, DEFAULT_FUEL_TYPES, PLATFORMS, getRelativeDate } from '../data/constants';
import {
  formatCurrency,
  formatDateBR,
  formatDateFull,
  formatLocalDate,
  calculateDateDiffDays,
  calculatePlatformFilteredData,
} from '../utils/helpers';
import { getCategoryIcon } from './ManageExpenseCategoriesModal';
import { DateRangePicker } from './DateRangePicker';

export type ExpenseTimeFilterPeriod = 'day' | 'week' | 'month' | 'year' | 'custom' | 'all';

interface ExpensesViewProps {
  selectedDate?: string;
  setSelectedDate?: (date: string) => void;
  customStartDate?: string;
  setCustomStartDate?: (date: string) => void;
  customEndDate?: string;
  setCustomEndDate?: (date: string) => void;
  expenses: ExpenseEntry[];
  earnings?: EarningsEntry[];
  platforms?: PlatformOption[];
  selectedPlatformIds?: string[];
  setSelectedPlatformIds?: (ids: string[]) => void;
  profile: DriverProfile;
  categories?: ExpenseCategoryConfig[];
  fuelTypes?: FuelTypeConfig[];
  onOpenAddExpense: () => void;
  onEditExpense: (expense: ExpenseEntry) => void;
  onDeleteExpense: (id: string) => void;
  onToggleExpenseCalculation?: (id: string) => void;
  onOpenManageCategories?: () => void;
  onOpenManageFuelTypes?: () => void;
  onNavigateToFuel?: () => void;
}

export const ExpensesView: React.FC<ExpensesViewProps> = ({
  selectedDate,
  setSelectedDate,
  customStartDate,
  setCustomStartDate,
  customEndDate,
  setCustomEndDate,
  expenses,
  earnings = [],
  platforms,
  selectedPlatformIds,
  setSelectedPlatformIds,
  profile,
  categories = DEFAULT_EXPENSE_CATEGORIES,
  fuelTypes = DEFAULT_FUEL_TYPES,
  onOpenAddExpense,
  onEditExpense,
  onDeleteExpense,
  onToggleExpenseCalculation,
  onOpenManageCategories,
  onOpenManageFuelTypes,
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
    effectiveSelectedPlatformIds.length === activePlatforms.length;

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

  const [internalDate, setInternalDate] = useState<string>(getRelativeDate(0));
  const currentSelectedDate = selectedDate || internalDate;
  const setCurrentSelectedDate = (dateStr: string) => {
    if (setSelectedDate) {
      setSelectedDate(dateStr);
    } else {
      setInternalDate(dateStr);
    }
  };

  const [periodFilter, setPeriodFilter] = useState<ExpenseTimeFilterPeriod>('day');
  const [copied, setCopied] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [filterCalculation, setFilterCalculation] = useState<'all' | 'included' | 'excluded'>('all');

  const isToday = currentSelectedDate === getRelativeDate(0);
  const isYesterday = currentSelectedDate === getRelativeDate(1);

  // Compute date range based on periodFilter and currentSelectedDate
  const getPeriodRange = () => {
    if (periodFilter === 'all') {
      return {
        startDate: '2000-01-01',
        endDate: '2099-12-31',
        label: 'Todo o Histórico',
        subLabel: 'Todas as despesas registradas',
        multiplier: 1,
      };
    }

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

    const [yearStr, monthStr, dayStr] = currentSelectedDate.split('-');
    const baseDate = new Date(Number(yearStr), Number(monthStr) - 1, Number(dayStr));

    if (periodFilter === 'day') {
      return {
        startDate: currentSelectedDate,
        endDate: currentSelectedDate,
        label: isToday ? 'Hoje' : isYesterday ? 'Ontem' : formatDateBR(currentSelectedDate),
        subLabel: formatDateFull(currentSelectedDate),
        multiplier: 1,
      };
    }

    if (periodFilter === 'week') {
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
        subLabel: 'Fechamento semanal de despesas',
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

  const range = getPeriodRange();

  // Date shifting according to period
  const handleDateShift = (direction: number) => {
    if (periodFilter === 'all') return;

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

    const [yearStr, monthStr, dayStr] = currentSelectedDate.split('-');
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

    setCurrentSelectedDate(formatLocalDate(current));
  };

  // 1. Filter expenses and earnings within period range
  const periodFilteredExpenses = expenses.filter(
    (e) => e.date >= range.startDate && e.date <= range.endDate
  );
  const periodDateEarnings = (earnings || []).filter(
    (e) => e.date >= range.startDate && e.date <= range.endDate
  );

  // 2. Filter expenses by platform using calculatePlatformFilteredData
  const {
    filteredExpenses: platformFilteredExpenses,
  } = calculatePlatformFilteredData(
    periodDateEarnings,
    periodFilteredExpenses,
    effectiveSelectedPlatformIds,
    allPlatformIds
  );

  // 3. Apply secondary filters (Category & Calculation status)
  const filteredExpenses = platformFilteredExpenses.filter((e) => {
    if (selectedCategory !== 'all' && e.category !== selectedCategory) return false;
    if (filterCalculation === 'included' && e.includeInCalculations === false) return false;
    if (filterCalculation === 'excluded' && e.includeInCalculations !== false) return false;
    return true;
  });

  // Only count expenses that are included in calculations for financial totals
  const includedPeriodExpenses = platformFilteredExpenses.filter((e) => e.includeInCalculations !== false);
  const totalAmount = includedPeriodExpenses.reduce((acc, curr) => acc + curr.amount, 0);
  const totalExcludedCount = platformFilteredExpenses.filter((e) => e.includeInCalculations === false).length;

  // Group by category for breakdown cards (in selected period and included in calculations)
  const categoryTotals: Record<string, number> = {};
  categories.forEach((cat) => {
    categoryTotals[cat.id] = 0;
  });

  includedPeriodExpenses.forEach((e) => {
    categoryTotals[e.category] = (categoryTotals[e.category] || 0) + e.amount;
  });

  // Fuel analytics in selected period (only included)
  const fuelEntries = includedPeriodExpenses.filter((e) => e.category === 'combustivel');
  const totalFuelSpend = fuelEntries.reduce((acc, curr) => acc + curr.amount, 0);
  const totalLiters = fuelEntries.reduce((acc, curr) => acc + (curr.liters || 0), 0);
  const avgPricePerLiter = totalLiters > 0 ? totalFuelSpend / totalLiters : profile.fuelPricePerLiter;

  const getCategoryInfo = (catId: string) => {
    return categories.find((c) => c.id === catId) || {
      id: catId,
      name: catId.replace('_', ' '),
      iconName: 'Layers',
      color: 'text-zinc-400',
    };
  };

  // Only display categories that actually have records in the selected period
  const presentCategoryIds = Array.from(new Set(periodFilteredExpenses.map((e) => e.category)));
  const categoriesWithRecords = categories.filter(
    (cat) => (categoryTotals[cat.id] || 0) > 0 || presentCategoryIds.includes(cat.id)
  );
  presentCategoryIds.forEach((catId) => {
    if (!categoriesWithRecords.some((c) => c.id === catId)) {
      categoriesWithRecords.push(getCategoryInfo(catId));
    }
  });

  // Quick WhatsApp summary export
  const handleShareWhatsApp = () => {
    let msg = `*DESPESAS & CUSTOS - ROSIDA DRIVER*\n`;
    msg += `📅 *Período:* ${range.label} (${range.subLabel})\n`;
    msg += `💸 *Total de Despesas:* ${formatCurrency(totalAmount)}\n`;
    if (totalFuelSpend > 0) {
      msg += `⛽ *Combustível:* ${formatCurrency(totalFuelSpend)} (${totalLiters.toFixed(1)} L)\n`;
    }
    const topCats = categories
      .map((c) => ({ name: c.name, val: categoryTotals[c.id] || 0 }))
      .filter((c) => c.val > 0)
      .sort((a, b) => b.val - a.val);

    if (topCats.length > 0) {
      msg += `\n*Totais por Categoria:*\n`;
      topCats.forEach((c) => {
        msg += `• ${c.name}: ${formatCurrency(c.val)}\n`;
      });
    }
    msg += `\n_Rosida Driver - Controle Financeiro_`;

    navigator.clipboard.writeText(msg);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
                <DollarSign className="w-3 h-3" />
                Custos Operacionais
              </span>
              <span className="text-xs text-zinc-400">Controle de Despesas, Categorias & Abastecimento</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Despesas & Gastos de Rodagem
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Cadastre, edite ou exclua despesas e categorias personalizadas. Você pode definir quais lançamentos entram ou não nos cálculos de lucro.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-center min-w-[130px]">
              <div className="text-[11px] text-zinc-400 font-semibold">Total no Período</div>
              <div className="text-lg font-black text-rose-400 mt-0.5">
                {formatCurrency(totalAmount)}
              </div>
              <div className="text-[10px] text-zinc-500 truncate max-w-[120px] mx-auto">
                {range.label}
              </div>
              {totalExcludedCount > 0 && (
                <div className="text-[10px] text-amber-400 font-medium mt-0.5">
                  {totalExcludedCount} fora dos cálculos
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <button
                id="btn-add-expense-open"
                onClick={onOpenAddExpense}
                className="flex items-center justify-center gap-2 bg-rose-500 hover:bg-rose-600 active:scale-95 text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-rose-500/20 cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[3]" />
                <span>Nova Despesa</span>
              </button>

              <div className="flex items-center gap-1.5">
                {onOpenManageCategories && (
                  <button
                    onClick={onOpenManageCategories}
                    className="flex-1 flex items-center justify-center gap-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Adicionar, editar ou excluir categorias de despesas"
                  >
                    <Settings2 className="w-3.5 h-3.5 text-rose-400" />
                    <span>Categorias</span>
                  </button>
                )}

                {onOpenManageFuelTypes && (
                  <button
                    onClick={onOpenManageFuelTypes}
                    className="flex-1 flex items-center justify-center gap-1 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer"
                    title="Adicionar, editar ou excluir tipos de combustível"
                  >
                    <Fuel className="w-3.5 h-3.5 text-amber-400" />
                    <span>Combustíveis</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Date & Period Navigation Bar (Identical to Ganhos do Dia) */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
        {/* Top row: Period Selector Tabs + Quick Share */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
          <div className="flex items-center gap-1 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800 self-start sm:self-auto flex-wrap">
            <span className="text-[11px] font-semibold text-zinc-400 px-2 hidden sm:inline flex items-center gap-1">
              <Layers className="w-3 h-3 text-rose-400" />
              Período:
            </span>
            <button
              id="filter-period-expense-day"
              type="button"
              onClick={() => setPeriodFilter('day')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'day'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Dia
            </button>
            <button
              id="filter-period-expense-week"
              type="button"
              onClick={() => setPeriodFilter('week')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'week'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Semana
            </button>
            <button
              id="filter-period-expense-month"
              type="button"
              onClick={() => setPeriodFilter('month')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'month'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Mensal
            </button>
            <button
              id="filter-period-expense-year"
              type="button"
              onClick={() => setPeriodFilter('year')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'year'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Anual
            </button>
            <button
              id="filter-period-expense-custom"
              type="button"
              onClick={() => setPeriodFilter('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'custom'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Período
            </button>
            <button
              id="filter-period-expense-all"
              type="button"
              onClick={() => setPeriodFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                periodFilter === 'all'
                  ? 'bg-rose-500 text-white shadow-md shadow-rose-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              Todas
            </button>
          </div>

          <div className="flex items-center gap-2 self-end sm:self-auto">
            <button
              onClick={handleShareWhatsApp}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
              title="Copiar relatório de despesas para o WhatsApp"
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
              disabled={periodFilter === 'all'}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
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
                    {formatDateBR(currentSelectedDate)}
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-400 capitalize">
                {range.subLabel}
              </p>
            </div>

            <button
              onClick={() => handleDateShift(1)}
              disabled={periodFilter === 'all'}
              className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed rounded-xl transition-colors cursor-pointer"
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
                setCurrentSelectedDate(getRelativeDate(0));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isToday && periodFilter === 'day'
                  ? 'bg-zinc-800 text-rose-400 border border-rose-500/40'
                  : 'bg-zinc-950 text-zinc-400 border border-zinc-800 hover:bg-zinc-800 hover:text-white'
              }`}
            >
              Hoje
            </button>
            <button
              onClick={() => {
                setPeriodFilter('day');
                setCurrentSelectedDate(getRelativeDate(1));
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isYesterday && periodFilter === 'day'
                  ? 'bg-zinc-800 text-rose-400 border border-rose-500/40'
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
                  setPeriodFilter('day');
                  setCurrentSelectedDate(e.target.value);
                }}
                className="bg-zinc-950 border border-zinc-800 text-zinc-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-rose-500 cursor-pointer"
                title="Selecionar data base"
              />
            </div>
          </div>
        </div>

        {/* Custom Date Range Picker matching user's reference screenshot */}
        {periodFilter === 'custom' && (
          <div className="pt-3 border-t border-zinc-800/80 animate-in fade-in">
            <DateRangePicker
              startDate={effectiveCustomStartDate}
              endDate={effectiveCustomEndDate}
              onChangeStartDate={setEffectiveCustomStartDate}
              onChangeEndDate={setEffectiveCustomEndDate}
              accentColor="rose"
            />
          </div>
        )}

        {/* Platform/App Multi-select Filter */}
        <div className="pt-3 border-t border-zinc-800/80 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="p-1 rounded-md bg-rose-500/10 text-rose-400">
                <Car className="w-3.5 h-3.5" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-zinc-300">
                Filtrar por Aplicativo:
              </span>
              <span className="text-[11px] font-semibold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-md border border-rose-500/20">
                {isAllPlatformsSelected
                  ? `Todos os Apps (${activePlatforms.length})`
                  : `${effectiveSelectedPlatformIds.length} de ${activePlatforms.length} selecionado(s)`}
              </span>
            </div>

            <div className="flex items-center gap-2 text-xs">
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-rose-400 hover:text-rose-300 font-bold transition-colors cursor-pointer"
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
            <button
              type="button"
              onClick={selectAllPlatforms}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                isAllPlatformsSelected
                  ? 'bg-rose-500 text-white border-rose-400 shadow-sm shadow-rose-500/20'
                  : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:border-zinc-700 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Todos os Apps ({activePlatforms.length})</span>
            </button>

            {activePlatforms.map((plat) => {
              const isSelected = effectiveSelectedPlatformIds.includes(plat.id);

              return (
                <button
                  type="button"
                  key={plat.id}
                  onClick={() => togglePlatform(plat.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2 border ${
                    isSelected
                      ? isAllPlatformsSelected
                        ? 'bg-zinc-950 text-zinc-200 border-zinc-700 hover:border-zinc-600 hover:text-white'
                        : 'bg-rose-950/40 text-white border-rose-500 ring-1 ring-rose-500/50 shadow-sm'
                      : 'bg-zinc-950/40 text-zinc-500 border-zinc-900 opacity-60 hover:opacity-90 hover:text-zinc-400'
                  }`}
                  title={
                    isAllPlatformsSelected
                      ? `Filtrar apenas despesas de ${plat.name}`
                      : isSelected
                      ? `Remover ${plat.name}`
                      : `Adicionar ${plat.name}`
                  }
                >
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: plat.accentColor || '#f43f5e' }}
                  />
                  <span>{plat.name}</span>
                  {isSelected && !isAllPlatformsSelected && (
                    <Check className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>

          {!isAllPlatformsSelected && effectiveSelectedPlatformIds.length > 0 && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] text-zinc-400 bg-rose-950/20 border border-rose-500/20 rounded-lg px-2.5 py-1.5">
              <span>
                Filtrando despesas de:{' '}
                <strong className="text-white">
                  {activePlatforms.filter(p => effectiveSelectedPlatformIds.includes(p.id)).map(p => p.name).join(', ')}
                </strong>
                . Mostrando despesas exclusivas e rateio de custos operacionais (combustível e manutenção) para a data/período selecionado.
              </span>
              <button
                type="button"
                onClick={selectAllPlatforms}
                className="text-rose-400 hover:text-rose-300 font-bold underline shrink-0 cursor-pointer text-left sm:text-right"
              >
                Ver todos os apps
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Fuel Intelligence Card */}
      <div className="bg-gradient-to-r from-zinc-900 via-amber-950/20 to-zinc-900 border border-amber-500/30 rounded-2xl p-4 sm:p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-amber-500/20 text-amber-400">
              <Fuel className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-amber-400">
                Análise de Abastecimento & Combustível ({range.label})
              </h2>
              <span className="text-[11px] text-zinc-400">
                Veículo: {profile.vehicleModel || 'Padrão'} ({profile.kmPerLiter || 10} km/L) • Base: {formatCurrency(profile.fuelPricePerLiter || 3.89)}/L
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            {onNavigateToFuel && (
              <button
                type="button"
                onClick={onNavigateToFuel}
                className="text-xs bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 px-3 py-1.5 rounded-xl font-bold transition-all flex items-center gap-1.5 cursor-pointer shadow-sm"
              >
                <span>Telemetria Km/L do Tanque</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {onOpenManageFuelTypes && (
              <button
                type="button"
                onClick={onOpenManageFuelTypes}
                className="text-xs text-amber-400 hover:text-amber-300 font-semibold underline cursor-pointer"
              >
                Preços de combustível →
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 text-center">
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Total Gasto em Combustível</span>
            <strong className="text-base sm:text-lg font-black text-white">
              {formatCurrency(totalFuelSpend)}
            </strong>
          </div>
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Litros / m³ Abastecidos</span>
            <strong className="text-base sm:text-lg font-black text-amber-400">
              {totalLiters.toFixed(1)} L
            </strong>
          </div>
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Preço Médio por Litro</span>
            <strong className="text-base sm:text-lg font-black text-white">
              {formatCurrency(avgPricePerLiter)}/L
            </strong>
          </div>
          <div className="bg-zinc-950/80 p-3 rounded-xl border border-zinc-800">
            <span className="text-[11px] text-zinc-400 block">Custo Combustível por KM</span>
            <strong className="text-base sm:text-lg font-black text-emerald-400">
              {formatCurrency(avgPricePerLiter / (profile.kmPerLiter || 10))}/km
            </strong>
          </div>
        </div>
      </div>

      {/* Dynamic Categories Grid */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Totais por Categoria ({range.label} - Cálculos Ativos)
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-[10px] text-zinc-400 hover:text-white bg-zinc-800 px-2 py-0.5 rounded-md cursor-pointer transition-colors"
                title="Mostrar todas as categorias"
              >
                Limpar filtro ({getCategoryInfo(selectedCategory).name})
              </button>
            )}
          </div>
          {onOpenManageCategories && (
            <button
              onClick={onOpenManageCategories}
              className="text-xs text-rose-400 hover:text-rose-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <Settings2 className="w-3.5 h-3.5" />
              <span>Gerenciar Categorias</span>
            </button>
          )}
        </div>

        {categoriesWithRecords.length === 0 ? (
          <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 text-center text-xs text-zinc-500">
            Nenhuma despesa registrada nas categorias em <strong className="text-zinc-400 font-semibold">{range.label}</strong>.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {categoriesWithRecords.map((cat) => {
              const isSelected = selectedCategory === cat.id;
              const total = categoryTotals[cat.id] || 0;

              return (
                <div
                  key={cat.id}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.id)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-rose-500/20 border-rose-500 ring-1 ring-rose-500'
                      : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                  }`}
                  title={isSelected ? 'Clique para desmarcar filtro' : `Filtrar apenas por ${cat.name}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className={`flex items-center gap-1.5 text-xs font-bold ${cat.color || 'text-zinc-400'}`}>
                      <span>{getCategoryIcon(cat.iconName)}</span>
                      <span className="truncate">{cat.name}</span>
                    </div>
                  </div>
                  <div className="text-base font-black text-white">{formatCurrency(total)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter and Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 sm:p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-rose-400" />
            <h3 className="font-bold text-white text-sm">
              Histórico de Lançamentos ({filteredExpenses.length}) • <span className="text-rose-400">{range.label}</span>
            </h3>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter by Category */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Categoria:</span>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all">Todas as Categorias</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter by Calculation Status */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-zinc-400">Cálculo:</span>
              <select
                value={filterCalculation}
                onChange={(e) => setFilterCalculation(e.target.value as any)}
                className="bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-rose-500"
              >
                <option value="all">Todos os Status</option>
                <option value="included">Apenas Incluídos nos Cálculos</option>
                <option value="excluded">Apenas Fora dos Cálculos</option>
              </select>
            </div>
          </div>
        </div>

        {filteredExpenses.length === 0 ? (
          <div className="text-center py-10 text-zinc-500 text-xs space-y-2">
            <div>Nenhuma despesa encontrada para {range.label} com os filtros selecionados.</div>
            <button
              onClick={onOpenAddExpense}
              className="text-rose-400 hover:underline font-bold cursor-pointer"
            >
              + Lançar uma nova despesa
            </button>
          </div>
        ) : (
          <div className="divide-y divide-zinc-800/80">
            {filteredExpenses.map((exp) => {
              const catInfo = getCategoryInfo(exp.category);
              const isIncluded = exp.includeInCalculations !== false;

              return (
                <div
                  key={exp.id}
                  className={`py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs hover:bg-zinc-950/50 px-2.5 rounded-xl transition-colors ${
                    !isIncluded ? 'opacity-70 bg-zinc-950/30' : ''
                  }`}
                >
                  {/* Left: Icon, Category name, Date & details */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl bg-zinc-950 flex items-center justify-center border border-zinc-800 shrink-0 ${
                        catInfo.color || 'text-zinc-300'
                      }`}
                    >
                      {getCategoryIcon(catInfo.iconName)}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-white text-xs sm:text-sm">
                          {catInfo.name}
                        </span>

                        {/* Platform attribution tag */}
                        {exp.platformId && exp.platformId !== 'all' ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 border border-zinc-700 font-semibold inline-flex items-center gap-1">
                            <Car className="w-3 h-3 text-rose-400" />
                            {activePlatforms.find((p) => p.id === exp.platformId)?.name || exp.platformId}
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-zinc-800/60 text-zinc-400 border border-zinc-700/60 font-medium">
                            Geral (Todos os apps)
                          </span>
                        )}

                        {/* Calculation badge */}
                        {isIncluded ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-medium inline-flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Nos cálculos
                          </span>
                        ) : (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium inline-flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            Fora dos cálculos
                          </span>
                        )}
                      </div>

                      <div className="text-zinc-400 text-[11px] flex items-center gap-2 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-3 h-3 text-zinc-500" />
                          {formatDateBR(exp.date)}
                        </span>
                        {exp.notes && <span>• {exp.notes}</span>}
                        {exp.liters && (
                          <span className="text-amber-400 font-semibold">
                            • {exp.liters} L ({exp.fuelType || 'Combustível'})
                            {exp.pricePerLiter ? ` @ ${formatCurrency(exp.pricePerLiter)}/L` : ''}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Value, Calculation Toggle, Edit, Delete */}
                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-zinc-800/50">
                    <span
                      className={`font-black text-sm sm:text-base ${
                        isIncluded ? 'text-rose-400' : 'text-zinc-500 line-through decoration-zinc-600'
                      }`}
                    >
                      -{formatCurrency(exp.amount)}
                    </span>

                    <div className="flex items-center gap-1">
                      {/* Toggle include/exclude button */}
                      {onToggleExpenseCalculation && (
                        <button
                          type="button"
                          onClick={() => onToggleExpenseCalculation(exp.id)}
                          className={`p-1.5 rounded-lg border transition-colors cursor-pointer ${
                            isIncluded
                              ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20'
                              : 'border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white'
                          }`}
                          title={isIncluded ? 'Desativar dos cálculos' : 'Ativar nos cálculos'}
                        >
                          {isIncluded ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                        </button>
                      )}

                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => onEditExpense(expenses.find((x) => x.id === exp.id) || exp)}
                        className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Editar lançamento de despesa"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => onDeleteExpense(exp.id)}
                        className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                        title="Excluir despesa"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

