import React, { useState } from 'react';
import {
  Fuel,
  Gauge,
  TrendingUp,
  Sparkles,
  Calendar,
  Clock,
  Car,
  DollarSign,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Plus,
  ArrowRight,
  Droplets,
  CheckCircle2,
  Navigation,
  Info,
  Scale,
  Zap,
  Filter,
  SlidersHorizontal,
  RotateCcw,
  Edit2,
} from 'lucide-react';
import {
  ExpenseEntry,
  EarningsEntry,
  DriverProfile,
  PlatformConfig,
  FuelTypeConfig,
} from '../types';
import {
  calculateFuelCycles,
  FuelCycle,
  getSortedFuelOptions,
  calculateFilteredConsumption,
  FuelEntryOption,
  FilteredFuelStats,
} from '../utils/fuelTracking';
import { formatCurrency, formatDateBR, getPlatformConfig } from '../utils/helpers';
import {
  PLATFORMS,
  getRelativeDate,
  getLastMonthRange,
  getCurrentMonthRange,
} from '../data/constants';

interface FuelConsumptionViewProps {
  expenses: ExpenseEntry[];
  earnings: EarningsEntry[];
  profile: DriverProfile;
  platforms?: PlatformConfig[];
  fuelTypes?: FuelTypeConfig[];
  onOpenAddExpense: () => void;
  onOpenAddEarnings: () => void;
  onOpenManageFuelTypes?: () => void;
  onUpdateProfile?: (profile: DriverProfile) => void;
  onEditExpense?: (expense: ExpenseEntry) => void;
}

export const FuelConsumptionView: React.FC<FuelConsumptionViewProps> = ({
  expenses,
  earnings,
  profile,
  platforms = PLATFORMS,
  fuelTypes = [],
  onOpenAddExpense,
  onOpenAddEarnings,
  onOpenManageFuelTypes,
  onUpdateProfile,
  onEditExpense,
}) => {
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [showRidesCurrentTank, setShowRidesCurrentTank] = useState<boolean>(true);
  const [etanolPriceInput, setEtanolPriceInput] = useState<string>('3.89');
  const [gasolinaPriceInput, setGasolinaPriceInput] = useState<string>('5.79');

  // Sorted fuel options for selection
  const fuelOptions = getSortedFuelOptions(expenses, profile);
  const latestFuelOption = fuelOptions.length > 0 ? fuelOptions[fuelOptions.length - 1] : null;
  const penultimateFuelOption = fuelOptions.length > 1 ? fuelOptions[fuelOptions.length - 2] : null;

  // Precomputed month ranges
  const lastMonthRange = getLastMonthRange();
  const currentMonthRange = getCurrentMonthRange();

  // Filter state for penultimate / last fill-up and custom dates
  const [filterMode, setFilterMode] = useState<'fuel_entries' | 'custom_dates'>('fuel_entries');
  const [startFuelId, setStartFuelId] = useState<string>(
    penultimateFuelOption ? penultimateFuelOption.id : (fuelOptions[0]?.id || '')
  );
  const [endFuelId, setEndFuelId] = useState<string>(
    latestFuelOption ? latestFuelOption.id : ''
  );
  const [customStartDate, setCustomStartDate] = useState<string>(
    penultimateFuelOption ? penultimateFuelOption.date : ''
  );
  const [customEndDate, setCustomEndDate] = useState<string>(
    latestFuelOption ? latestFuelOption.date : ''
  );
  const [litersBasis, setLitersBasis] = useState<'start_fill' | 'period_total'>('period_total');
  const [showFilterRides, setShowFilterRides] = useState<boolean>(false);
  const [showFilterFuelings, setShowFilterFuelings] = useState<boolean>(true);

  // Synchronize start & end selection when options load or change
  const effectiveStartId = startFuelId || (penultimateFuelOption?.id || fuelOptions[0]?.id || '');
  const effectiveEndId = endFuelId || (latestFuelOption?.id || '');
  const effectiveStartDateStr = customStartDate || (penultimateFuelOption?.date || '');
  const effectiveEndDateStr = customEndDate || (latestFuelOption?.date || '');

  // Calculate filtered stats
  const filteredStats = calculateFilteredConsumption(expenses, earnings, profile, {
    filterMode,
    startExpenseId: filterMode === 'fuel_entries' ? effectiveStartId : undefined,
    endExpenseId: filterMode === 'fuel_entries' ? effectiveEndId : undefined,
    customStartDate: filterMode === 'custom_dates' ? effectiveStartDateStr : undefined,
    customEndDate: filterMode === 'custom_dates' ? effectiveEndDateStr : undefined,
    litersBasis,
  });

  const handleSelectPenultimateToLast = () => {
    setFilterMode('fuel_entries');
    if (penultimateFuelOption && latestFuelOption) {
      setStartFuelId(penultimateFuelOption.id);
      setEndFuelId(latestFuelOption.id);
      setCustomStartDate(penultimateFuelOption.date);
      setCustomEndDate(latestFuelOption.date);
      setLitersBasis('start_fill');
    }
  };

  const handleSelectLastMonth = () => {
    setFilterMode('custom_dates');
    setCustomStartDate(lastMonthRange.start);
    setCustomEndDate(lastMonthRange.end);
    setLitersBasis('period_total');
  };

  const handleSelectCurrentMonth = () => {
    setFilterMode('custom_dates');
    setCustomStartDate(currentMonthRange.start);
    setCustomEndDate(currentMonthRange.end);
    setLitersBasis('period_total');
  };

  const handleSelectLast30Days = () => {
    setFilterMode('custom_dates');
    setCustomStartDate(getRelativeDate(29));
    setCustomEndDate(getRelativeDate(0));
    setLitersBasis('period_total');
  };

  const handleSelectLast15Days = () => {
    setFilterMode('custom_dates');
    setCustomStartDate(getRelativeDate(14));
    setCustomEndDate(getRelativeDate(0));
    setLitersBasis('period_total');
  };

  const handleSelectLast7Days = () => {
    setFilterMode('custom_dates');
    setCustomStartDate(getRelativeDate(6));
    setCustomEndDate(getRelativeDate(0));
    setLitersBasis('period_total');
  };

  const handleStartFuelChange = (id: string) => {
    setStartFuelId(id);
    const item = fuelOptions.find((o) => o.id === id);
    if (item) setCustomStartDate(item.date);
  };

  const handleEndFuelChange = (id: string) => {
    setEndFuelId(id);
    const item = fuelOptions.find((o) => o.id === id);
    if (item) setCustomEndDate(item.date);
  };

  const isPenultimateToLastActive =
    filterMode === 'fuel_entries' && filteredStats.isPenultimateToLast;
  const isLastMonthActive =
    filterMode === 'custom_dates' &&
    customStartDate === lastMonthRange.start &&
    customEndDate === lastMonthRange.end;
  const isCurrentMonthActive =
    filterMode === 'custom_dates' &&
    customStartDate === currentMonthRange.start &&
    customEndDate === currentMonthRange.end;
  const isLast30DaysActive =
    filterMode === 'custom_dates' &&
    customStartDate === getRelativeDate(29) &&
    customEndDate === getRelativeDate(0);

  // Calculate live telemetry and cycles
  const telemetry = calculateFuelCycles(expenses, earnings, profile);
  const {
    hasFuelEntries,
    currentCycle,
    completedCycles,
    allCycles,
    averageKmPerLiterCompleted,
    averageCostPerKmCompleted,
    profileKmPerLiter,
    deltaVsProfile,
    bestCycle,
    worstCycle,
    byFuelType,
  } = telemetry;

  const toggleCycleExpand = (id: string) => {
    setExpandedCycleId((prev) => (prev === id ? null : id));
  };

  // Parity 70% rule calculation
  const numEtanol = parseFloat(etanolPriceInput.replace(',', '.')) || 0;
  const numGasolina = parseFloat(gasolinaPriceInput.replace(',', '.')) || 0;
  const parityRatio = numGasolina > 0 ? (numEtanol / numGasolina) * 100 : 0;
  const parityBreakEvenEtanol = numGasolina * 0.7;

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Top Banner / Vehicle Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Fuel className="w-3.5 h-3.5" />
                Telemetria de Consumo
              </span>
              <span className="text-xs text-zinc-400">
                {profile.vehicleModel || 'Veículo'} • {profile.vehiclePlate || 'Sem placa'}
              </span>
              <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-md border border-zinc-700 font-semibold">
                Combustível Principal: {profile.fuelType?.toUpperCase() || 'ETANOL'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Consumo de Combustível (Km/L)
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Cálculo em tempo real da média de quilômetros por litro (km percorrido ÷ litros abastecidos).
              A cada corrida lançada nos aplicativos, o consumo do último abastecimento é atualizado automaticamente.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Novo Abastecimento</span>
            </button>

            <button
              onClick={onOpenAddEarnings}
              className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-emerald-400 border border-emerald-500/30 px-3.5 py-2 rounded-xl text-xs font-semibold transition-all active:scale-95 cursor-pointer"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Lançar Corridas / KM</span>
            </button>

            {onOpenManageFuelTypes && (
              <button
                onClick={onOpenManageFuelTypes}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
                title="Configurar tipos e preços de combustível"
              >
                <Droplets className="w-3.5 h-3.5 text-sky-400" />
                <span className="hidden sm:inline">Preços de Posto</span>
              </button>
            )}
          </div>
        </div>

        {/* Global Summary Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-zinc-800/80">
          <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/90">
            <span className="text-[10px] sm:text-xs text-zinc-400 block uppercase font-bold tracking-wider">
              Média Real (Ciclos Fechados)
            </span>
            <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 flex items-baseline gap-1">
              {averageKmPerLiterCompleted > 0 ? averageKmPerLiterCompleted.toFixed(2) : '--'}
              <span className="text-xs font-bold text-zinc-500">km/L</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              Meta do veículo: {profileKmPerLiter} km/L
            </span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/90">
            <span className="text-[10px] sm:text-xs text-zinc-400 block uppercase font-bold tracking-wider">
              Custo Médio de Combustível
            </span>
            <div className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-baseline gap-1">
              {averageCostPerKmCompleted > 0 ? formatCurrency(averageCostPerKmCompleted) : '--'}
              <span className="text-xs font-bold text-zinc-500">/km</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">Gasto real por km rodado</span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/90">
            <span className="text-[10px] sm:text-xs text-zinc-400 block uppercase font-bold tracking-wider">
              Abastecimentos Rasteados
            </span>
            <div className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5">
              {telemetry.totalFuelEntriesCount}
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              {completedCycles.length} ciclos concluídos
            </span>
          </div>

          <div className="bg-zinc-950/70 p-3 rounded-xl border border-zinc-800/90">
            <span className="text-[10px] sm:text-xs text-zinc-400 block uppercase font-bold tracking-wider">
              Total KM Contabilizados
            </span>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-0.5 flex items-baseline gap-1">
              {telemetry.totalKmTracked.toLocaleString('pt-BR')}
              <span className="text-xs font-bold text-zinc-500">km</span>
            </div>
            <span className="text-[10px] text-zinc-500 mt-0.5 block">
              {telemetry.totalLitersTracked.toFixed(1)} L abastecidos
            </span>
          </div>
        </div>
      </div>

      {!hasFuelEntries ? (
        /* Empty State */
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 sm:p-12 text-center space-y-4 shadow-lg">
          <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Fuel className="w-8 h-8" />
          </div>
          <div className="max-w-md mx-auto space-y-2">
            <h2 className="text-lg sm:text-xl font-bold text-white">Nenhum abastecimento registrado ainda</h2>
            <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
              Para começar a rastrear o consumo em tempo real do seu carro, cadastre o primeiro abastecimento.
              A cada corrida que você registrar, o sistema calculará automaticamente os km rodados por litro!
            </p>
          </div>
          <button
            onClick={onOpenAddExpense}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 font-bold rounded-xl text-sm transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Registrar Primeiro Abastecimento</span>
          </button>
        </div>
      ) : (
        <>
          {/* SECTION: FILTRO DE CONSUMO POR ABASTECIMENTO OU PERÍODO */}
          <div className="bg-zinc-900 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 relative">
            {/* Header with Title and Mode Toggle */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                    <Filter className="w-3.5 h-3.5 text-amber-400" />
                    Filtro de Consumo & Faturamento
                  </span>
                  {isPenultimateToLastActive && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Penúltimo ➔ Último Ativo
                    </span>
                  )}
                  {isLastMonthActive && (
                    <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-sky-500/20 text-sky-300 border border-sky-500/30 flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      Mês Passado ({lastMonthRange.label})
                    </span>
                  )}
                </div>
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                  <span>Consulta de Consumo & Abastecimentos</span>
                </h2>
                <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
                  Selecione o <strong>penúltimo ao último abastecimento</strong>, um <strong>mês inteiro</strong> ou qualquer intervalo de datas. O cálculo computa com exatidão todos os abastecimentos, a distância percorrida nos aplicativos e a média real de Km/L.
                </p>
              </div>

              {/* Mode Toggle */}
              <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs self-start lg:self-auto shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('fuel_entries');
                    setLitersBasis('start_fill');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterMode === 'fuel_entries'
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>Abastecimentos</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFilterMode('custom_dates');
                    setLitersBasis('period_total');
                  }}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                    filterMode === 'custom_dates'
                      ? 'bg-amber-500 text-zinc-950 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>Datas Livres / Mês</span>
                </button>
              </div>
            </div>

            {/* Quick Presets Bar (1-Click Filters) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-thin">
              <span className="text-[11px] font-bold text-zinc-500 uppercase tracking-wider shrink-0 mr-1 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Atalhos:
              </span>

              {penultimateFuelOption && latestFuelOption && (
                <button
                  type="button"
                  onClick={handleSelectPenultimateToLast}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                    isPenultimateToLastActive
                      ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                      : 'bg-zinc-950 hover:bg-zinc-800 text-amber-400 border border-amber-500/40 hover:border-amber-400'
                  }`}
                  title="Filtro exato entre o penúltimo e o último abastecimento"
                >
                  <Fuel className="w-3.5 h-3.5" />
                  <span>⚡ Penúltimo ao Último</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleSelectLastMonth}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isLastMonthActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                }`}
                title={`Mês passado completo: ${lastMonthRange.start.split('-').reverse().join('/')} até ${lastMonthRange.end.split('-').reverse().join('/')}`}
              >
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                <span>Mês Passado ({lastMonthRange.label})</span>
              </button>

              <button
                type="button"
                onClick={handleSelectCurrentMonth}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 ${
                  isCurrentMonthActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700'
                }`}
                title={`Mês atual completo: ${currentMonthRange.start.split('-').reverse().join('/')} até hoje`}
              >
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>Mês Atual ({currentMonthRange.label})</span>
              </button>

              <button
                type="button"
                onClick={handleSelectLast30Days}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer shrink-0 ${
                  isLast30DaysActive
                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                    : 'bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <span>Últimos 30 dias</span>
              </button>

              <button
                type="button"
                onClick={handleSelectLast15Days}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shrink-0"
              >
                <span>Últimos 15 dias</span>
              </button>

              <button
                type="button"
                onClick={handleSelectLast7Days}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-zinc-950 hover:bg-zinc-800 text-zinc-400 border border-zinc-800 hover:border-zinc-700 transition-all cursor-pointer shrink-0"
              >
                <span>Últimos 7 dias</span>
              </button>
            </div>

            {/* Filter Inputs Controls */}
            <div className="bg-zinc-950/90 border border-zinc-800/90 rounded-xl p-4 space-y-3">
              {filterMode === 'fuel_entries' ? (
                <div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 items-center">
                    {/* Start Fuel Selection */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-sky-400">
                          <Fuel className="w-3.5 h-3.5" />
                          1. Abastecimento Inicial (De):
                        </span>
                        {penultimateFuelOption && effectiveStartId === penultimateFuelOption.id && (
                          <span className="text-[10px] text-amber-400 font-extrabold uppercase bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                            Penúltimo
                          </span>
                        )}
                      </label>
                      <select
                        value={effectiveStartId}
                        onChange={(e) => handleStartFuelChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {fuelOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-zinc-500 block mt-1">
                        Ponto de partida do cálculo de consumo
                      </span>
                    </div>

                    {/* End Fuel Selection */}
                    <div>
                      <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center justify-between">
                        <span className="flex items-center gap-1 text-emerald-400">
                          <Fuel className="w-3.5 h-3.5" />
                          2. Abastecimento Final (Até):
                        </span>
                        {latestFuelOption && effectiveEndId === latestFuelOption.id && (
                          <span className="text-[10px] text-emerald-400 font-extrabold uppercase bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            Último
                          </span>
                        )}
                      </label>
                      <select
                        value={effectiveEndId}
                        onChange={(e) => handleEndFuelChange(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-2 text-white font-medium text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                      >
                        {fuelOptions.map((opt) => (
                          <option key={opt.id} value={opt.id}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                      <span className="text-[11px] text-zinc-500 block mt-1">
                        Fechamento da medição
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                    <div>
                      <label className="block text-xs font-bold text-sky-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Data Inicial (De):
                      </label>
                      <input
                        type="date"
                        value={effectiveStartDateStr}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-2 text-white font-semibold text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-zinc-500 block mt-1">
                        Início do período (ex: dia 01)
                      </span>
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        Data Final (Até):
                      </label>
                      <input
                        type="date"
                        value={effectiveEndDateStr}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full bg-zinc-900 border border-zinc-700 hover:border-zinc-600 rounded-xl px-3 py-2 text-white font-semibold text-xs focus:outline-none focus:border-amber-500 cursor-pointer"
                      />
                      <span className="text-[11px] text-zinc-500 block mt-1">
                        Término do período (ex: dia 30)
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Liters Basis Fine Tuning */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-2 border-t border-zinc-800 text-xs">
                <div className="text-zinc-400 flex items-center gap-1.5 flex-wrap">
                  <Info className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                  <span>
                    Volume considerado no cálculo:{' '}
                    <strong className="text-white font-bold">
                      {filteredStats.litersUsed.toFixed(1)} Litros
                    </strong>
                    {litersBasis === 'period_total' ? (
                      <span className="text-emerald-400 font-semibold">
                        {' '}(soma dos {filteredStats.fuelEntriesCount} abastecimentos do período)
                      </span>
                    ) : filteredStats.startFuelExpense ? (
                      <span className="text-zinc-500">
                        {' '}(apenas abastecimento inicial de {formatDateBR(filteredStats.startFuelExpense.date)})
                      </span>
                    ) : null}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[11px] text-zinc-500">Base de litros:</span>
                  <button
                    type="button"
                    onClick={() =>
                      setLitersBasis(litersBasis === 'start_fill' ? 'period_total' : 'start_fill')
                    }
                    className="text-[11px] bg-zinc-900 hover:bg-zinc-800 text-amber-400 px-2.5 py-1 rounded-lg border border-zinc-700 font-bold transition-all cursor-pointer"
                    title="Alternar entre a soma de todos os abastecimentos ou apenas o abastecimento inicial"
                  >
                    {litersBasis === 'period_total' ? 'Soma do Período (Todos)' : 'Apenas 1º Abastecimento'}
                  </button>
                </div>
              </div>
            </div>

            {/* Results Grid - The 3 Key Requested Items + Profitability */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* 1. KM Rodados */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-sky-500/40 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                    KM Rodados no Filtro
                  </span>
                  <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                    <Navigation className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
                    {filteredStats.totalKmDriven.toLocaleString('pt-BR')}
                    <span className="text-xs font-bold text-zinc-400">km</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {filteredStats.contributingRides.length} corridas nos aplicativos
                  </span>
                </div>
              </div>

              {/* 2. Valor de Corridas Feito */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-emerald-500/40 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                    Valor de Corridas Feito
                  </span>
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                    <DollarSign className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 flex items-baseline gap-1">
                    {formatCurrency(filteredStats.totalGrossEarnings)}
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {filteredStats.ridesCount > 0
                      ? `Média de ${formatCurrency(filteredStats.totalGrossEarnings / filteredStats.ridesCount)} / corrida`
                      : 'Nenhuma corrida no filtro'}
                  </span>
                </div>
              </div>

              {/* 3. Consumo Km/L da Data do Filtro */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-amber-500/40 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400">
                    Consumo (Km/L) do Filtro
                  </span>
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-baseline gap-1">
                    {filteredStats.kmPerLiter > 0 ? filteredStats.kmPerLiter.toFixed(2) : '--'}
                    <span className="text-xs font-bold text-zinc-400">km/L</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    {filteredStats.totalKmDriven === 0
                      ? '0 km rodados'
                      : filteredStats.litersUsed === 0
                      ? 'Sem abastecimentos'
                      : `${filteredStats.totalKmDriven} km ÷ ${filteredStats.litersUsed.toFixed(1)} L`}
                  </span>
                </div>
              </div>

              {/* 4. Faturamento por KM & Combustível */}
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between text-zinc-400">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                    Faturamento por KM
                  </span>
                  <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                    <Zap className="w-4 h-4" />
                  </div>
                </div>
                <div className="mt-2">
                  <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
                    {filteredStats.earningsPerKm > 0 ? formatCurrency(filteredStats.earningsPerKm) : '--'}
                    <span className="text-xs font-bold text-zinc-400">/km</span>
                  </div>
                  <span className="text-[11px] text-zinc-400 block mt-0.5">
                    Custo comb.: {formatCurrency(filteredStats.totalFuelCost)}
                  </span>
                </div>
              </div>
            </div>

            {/* Formula Explanation Banner */}
            <div className="bg-zinc-950/80 border border-zinc-800 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 text-zinc-300 flex-wrap">
                <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 font-bold">
                  Fórmula do Consumo:
                </span>
                <span className="text-sky-300 font-bold">{filteredStats.totalKmDriven} km percorridos</span>
                <span className="text-amber-400 font-bold">÷</span>
                <span className="text-amber-300 font-bold">{filteredStats.litersUsed.toFixed(1)} L de combustível</span>
                <span className="text-amber-400 font-bold">=</span>
                <span className="text-emerald-400 font-black text-sm px-2.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/30">
                  {filteredStats.kmPerLiter > 0 ? `${filteredStats.kmPerLiter.toFixed(2)} km/L` : '0,00 km/L'}
                </span>
              </div>

              <div className="text-[11px] text-zinc-400 flex items-center gap-2 flex-wrap">
                <span>
                  Período analisado: <strong>{formatDateBR(filteredStats.effectiveStartDate)}</strong> até{' '}
                  <strong>{formatDateBR(filteredStats.effectiveEndDate)}</strong>
                </span>
                <span className="text-zinc-600">•</span>
                <span className="text-emerald-300 font-bold">
                  Lucro pós-combustível: {formatCurrency(filteredStats.netAfterFuel)}
                </span>
              </div>
            </div>

            {/* SECTION: ABASTECIMENTOS CONTABILIZADOS NO FILTRO */}
            <div className="bg-zinc-950/80 rounded-xl border border-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFilterFuelings(!showFilterFuelings)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Fuel className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">
                    Abastecimentos Deste Filtro ({filteredStats.fuelEntriesCount} {filteredStats.fuelEntriesCount === 1 ? 'lançamento' : 'lançamentos'})
                  </span>
                  <span className="text-[11px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded font-bold">
                    {filteredStats.totalPeriodLiters.toFixed(1)} L total
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    {formatCurrency(filteredStats.totalPeriodSpend)} pago
                  </span>
                  {filteredStats.averageFuelPricePerLiter > 0 && (
                    <span className="text-[11px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded font-medium hidden sm:inline">
                      Média: {formatCurrency(filteredStats.averageFuelPricePerLiter)}/L
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
                  <span>{showFilterFuelings ? 'Ocultar abastecimentos' : 'Ver abastecimentos'}</span>
                  {showFilterFuelings ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showFilterFuelings && (
                <div className="p-3.5 pt-0 border-t border-zinc-900 space-y-2">
                  {filteredStats.fuelEntriesCount === 0 ? (
                    <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-center space-y-2">
                      <AlertCircle className="w-5 h-5 text-amber-400 mx-auto" />
                      <p className="text-xs text-amber-200 font-medium">
                        Nenhum abastecimento encontrado no período selecionado ({formatDateBR(filteredStats.effectiveStartDate)} até {formatDateBR(filteredStats.effectiveEndDate)}).
                      </p>
                      <p className="text-[11px] text-zinc-400 max-w-md mx-auto">
                        Para que a média de Km/L seja calculada, é necessário ter abastecimentos registrados nessa faixa de datas.
                      </p>
                      <button
                        type="button"
                        onClick={onOpenAddExpense}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-zinc-950 rounded-lg text-xs font-bold transition-all cursor-pointer mt-1"
                      >
                        <Plus className="w-3.5 h-3.5 stroke-[3]" />
                        <span>Registrar Abastecimento Neste Período</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="divide-y divide-zinc-900/90 max-h-64 overflow-y-auto pr-1">
                        {filteredStats.fuelPeriodOptions.map((opt, idx) => (
                          <div
                            key={opt.id}
                            className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-zinc-900/40 px-2.5 rounded-lg"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center shrink-0">
                                #{idx + 1}
                              </span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-white text-xs">{formatDateBR(opt.date)}</span>
                                  <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/20">
                                    {opt.fuelType}
                                  </span>
                                  {opt.isLatest && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                                      Último
                                    </span>
                                  )}
                                  {opt.isPenultimate && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-sky-500/20 text-sky-300">
                                      Penúltimo
                                    </span>
                                  )}
                                </div>
                                {opt.notes && (
                                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                                    {opt.notes}
                                  </p>
                                )}
                              </div>
                            </div>

                            <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-1 sm:pt-0 border-t sm:border-t-0 border-zinc-900">
                              <div className="text-right">
                                <span className="font-black text-amber-400 text-sm block">
                                  {opt.liters.toFixed(1)} L
                                </span>
                                <span className="text-[10px] text-zinc-500 block">
                                  {formatCurrency(opt.pricePerLiter)}/L
                                </span>
                              </div>
                              <div className="text-right">
                                <span className="font-black text-white text-sm block">
                                  {formatCurrency(opt.amount)}
                                </span>
                                <span className="text-[10px] text-emerald-400 block font-semibold">
                                  pago
                                </span>
                              </div>
                              {onEditExpense && (
                                <button
                                  type="button"
                                  onClick={() => onEditExpense(opt.expense)}
                                  className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                                  title="Editar este abastecimento"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-zinc-900 flex flex-wrap items-center justify-between gap-2 text-[11px] text-zinc-400 px-1">
                        <span>
                          Total de abastecimentos no filtro:{' '}
                          <strong className="text-white">{filteredStats.fuelPeriodOptions.length}</strong>
                        </span>
                        <div className="flex items-center gap-3">
                          <span>
                            Volume total:{' '}
                            <strong className="text-amber-400">{filteredStats.totalPeriodLiters.toFixed(1)} L</strong>
                          </span>
                          <span>
                            Gasto total:{' '}
                            <strong className="text-emerald-400">{formatCurrency(filteredStats.totalPeriodSpend)}</strong>
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* SECTION: CORRIDAS CONTABILIZADAS NO FILTRO */}
            <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowFilterRides(!showFilterRides)}
                className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  <Car className="w-4 h-4 text-sky-400" />
                  <span className="text-xs font-bold text-white">
                    Corridas Deste Filtro ({filteredStats.contributingRides.length} lançamentos)
                  </span>
                  <span className="text-[11px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold">
                    {filteredStats.totalKmDriven.toLocaleString('pt-BR')} km rodados
                  </span>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded font-bold">
                    {formatCurrency(filteredStats.totalGrossEarnings)} faturados
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-zinc-400 shrink-0">
                  <span>{showFilterRides ? 'Ocultar corridas do filtro' : 'Ver corridas do filtro'}</span>
                  {showFilterRides ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </div>
              </button>

              {showFilterRides && (
                <div className="p-3.5 pt-0 border-t border-zinc-900 space-y-2">
                  {filteredStats.contributingRides.length === 0 ? (
                    <div className="text-center py-4 text-xs text-zinc-500">
                      Nenhuma corrida registrada para o período selecionado ({formatDateBR(filteredStats.effectiveStartDate)} até {formatDateBR(filteredStats.effectiveEndDate)}).
                    </div>
                  ) : (
                    <div className="divide-y divide-zinc-900/90 max-h-56 overflow-y-auto pr-1">
                      {filteredStats.contributingRides.map((ride) => {
                        const plat = getPlatformConfig(ride.platformId);
                        return (
                          <div
                            key={ride.id}
                            className="py-2 flex items-center justify-between gap-2 text-xs hover:bg-zinc-900/40 px-2 rounded-lg"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0"
                                style={{ backgroundColor: plat.accentColor }}
                              />
                              <span className="font-semibold text-white truncate">{plat.name}</span>
                              <span className="text-[10px] text-zinc-400">{formatDateBR(ride.date)}</span>
                              {ride.notes && (
                                <span className="text-[10px] text-zinc-500 truncate hidden md:inline">
                                  • "{ride.notes}"
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <span className="font-bold text-sky-400">{ride.kmDriven} km</span>
                              <span className="font-semibold text-emerald-400">
                                {formatCurrency(ride.grossAmount)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SECTION 1: O ÚLTIMO ABASTECIMENTO (TANQUE ATUAL EM ANDAMENTO) */}
          {currentCycle && (
            <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border-2 border-amber-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 relative overflow-hidden">
              {/* Highlight ribbon */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-inner">
                    <Fuel className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black uppercase tracking-wider text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                        Último Abastecimento (Tanque Atual em Uso)
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black text-white mt-1">
                      Abastecido em {formatDateBR(currentCycle.fillDate)} • {currentCycle.liters.toFixed(1)} L de{' '}
                      <span className="capitalize">{currentCycle.fuelType}</span>
                    </h2>
                  </div>
                </div>

                <div className="text-left sm:text-right bg-zinc-950/70 p-2.5 rounded-xl border border-zinc-800 shrink-0">
                  <span className="text-[10px] text-zinc-400 uppercase font-semibold block">Valor Pago no Posto</span>
                  <span className="text-base font-black text-white">{formatCurrency(currentCycle.amount)}</span>
                  <span className="text-[11px] text-zinc-500 block">
                    {formatCurrency(currentCycle.pricePerLiter)}/L
                  </span>
                </div>
              </div>

              {/* Live Formula Badge */}
              <div className="bg-zinc-950/90 border border-amber-500/30 p-3.5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-zinc-300">
                  <span className="p-1 rounded-md bg-amber-500/20 text-amber-400 shrink-0">
                    <Gauge className="w-4 h-4" />
                  </span>
                  <div className="flex flex-wrap items-center gap-2 font-medium">
                    <span className="text-zinc-400">Fórmula em Tempo Real:</span>
                    <span className="px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-500/40 font-bold text-sky-400">
                      Distância: {currentCycle.kmDriven.toLocaleString('pt-BR')} km
                    </span>
                    <span className="text-amber-400 font-bold">÷</span>
                    <span className="px-2 py-0.5 rounded-md bg-amber-950/60 border border-amber-500/40 font-bold text-amber-300">
                      Litros: {currentCycle.liters.toFixed(1)} L
                    </span>
                    <span className="text-amber-400 font-bold">=</span>
                    <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 font-black text-emerald-300 text-sm">
                      {currentCycle.kmPerLiter > 0 ? `${currentCycle.kmPerLiter.toFixed(2)} km/L` : '0,00 km/L'}
                    </span>
                  </div>
                </div>

                <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 self-end md:self-auto shrink-0">
                  <Clock className="w-3.5 h-3.5 text-zinc-500" />
                  <span>Atualizado a cada corrida lançada no app</span>
                </div>
              </div>

              {/* 4 Telemetry Cards for Current Tank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {/* 1. KM Rodados desde o último abastecimento */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-sky-500/30 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-sky-400">
                      KM Percorridos
                    </span>
                    <div className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
                      <Navigation className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
                      {currentCycle.kmDriven.toLocaleString('pt-BR')}
                      <span className="text-xs font-bold text-zinc-400">km</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      Desde {formatDateBR(currentCycle.fillDate)} ({currentCycle.contributingRides.length} corridas)
                    </span>
                  </div>
                </div>

                {/* 2. Consumo Parcial em Tempo Real (Km/L) */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-emerald-500/40 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                      Consumo Atual (Km/L)
                    </span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-emerald-300 flex items-baseline gap-1">
                      {currentCycle.kmPerLiter > 0 ? currentCycle.kmPerLiter.toFixed(2) : '--'}
                      <span className="text-xs font-bold text-zinc-400">km/L</span>
                    </div>
                    <span className="text-[11px] text-zinc-400 block mt-0.5">
                      {currentCycle.kmDriven === 0
                        ? 'Aguardando corridas deste tanque'
                        : `${currentCycle.kmDriven} km ÷ ${currentCycle.liters.toFixed(1)} L`}
                    </span>
                  </div>
                </div>

                {/* 3. Autonomia Restante Estimada */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Autonomia Estimada
                    </span>
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                      <Gauge className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-amber-400 flex items-baseline gap-1">
                      ~{currentCycle.remainingKmEstimate.toFixed(0)}
                      <span className="text-xs font-bold text-zinc-400">km restantes</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      Alcance total estimado: {currentCycle.expectedRangeKm.toFixed(0)} km
                    </span>
                  </div>
                </div>

                {/* 4. Custo Atual do KM */}
                <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between text-zinc-400">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-300">
                      Custo por KM Atual
                    </span>
                    <div className="p-1.5 rounded-lg bg-zinc-800 text-zinc-300">
                      <DollarSign className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-2">
                    <div className="text-2xl sm:text-3xl font-black text-white flex items-baseline gap-1">
                      {currentCycle.costPerKm > 0 ? formatCurrency(currentCycle.costPerKm) : '--'}
                      <span className="text-xs font-bold text-zinc-500">/km</span>
                    </div>
                    <span className="text-[11px] text-zinc-500 block mt-0.5">
                      {formatCurrency(currentCycle.amount)} ÷ {currentCycle.kmDriven || 1} km
                    </span>
                  </div>
                </div>
              </div>

              {/* Fuel Gauge / Tank Level Progress Bar */}
              <div className="bg-zinc-950/80 p-4 rounded-xl border border-zinc-800/80 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Droplets className="w-4 h-4 text-amber-400" />
                    Nível Estimado do Tanque com Base no Consumo
                  </span>
                  <span className="font-bold text-amber-400">
                    ~{currentCycle.tankPercentEstimated}% restante
                  </span>
                </div>
                <div className="w-full bg-zinc-900 h-3 rounded-full overflow-hidden p-0.5 border border-zinc-800">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      currentCycle.tankPercentEstimated > 40
                        ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                        : currentCycle.tankPercentEstimated > 15
                        ? 'bg-gradient-to-r from-amber-500 to-yellow-400'
                        : 'bg-gradient-to-r from-rose-500 to-red-600 animate-pulse'
                    }`}
                    style={{ width: `${Math.max(5, currentCycle.tankPercentEstimated)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-zinc-500">
                  <span>Reserva / Vazio</span>
                  <span>{currentCycle.kmDriven} km rodados de {currentCycle.expectedRangeKm.toFixed(0)} km projetados</span>
                  <span>Tanque Cheio ({currentCycle.liters.toFixed(1)} L)</span>
                </div>
              </div>

              {/* Contributing Rides for Current Tank (Toggleable) */}
              <div className="bg-zinc-950/60 rounded-xl border border-zinc-800 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowRidesCurrentTank(!showRidesCurrentTank)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-zinc-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-sky-400" />
                    <span className="text-xs font-bold text-white">
                      Corridas Contabilizadas Neste Tanque ({currentCycle.contributingRides.length} lançamentos)
                    </span>
                    <span className="text-[11px] bg-sky-500/20 text-sky-300 px-2 py-0.5 rounded font-bold">
                      {currentCycle.kmDriven} km total
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400">
                    <span>{showRidesCurrentTank ? 'Ocultar corridas' : 'Ver corridas'}</span>
                    {showRidesCurrentTank ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </button>

                {showRidesCurrentTank && (
                  <div className="p-3.5 pt-0 border-t border-zinc-900 space-y-2">
                    {currentCycle.contributingRides.length === 0 ? (
                      <div className="text-center py-4 text-xs text-zinc-500">
                        Nenhuma corrida lançada ainda desde este abastecimento ({formatDateBR(currentCycle.fillDate)}).
                        Lançamentos de corridas nos apps aparecerão aqui automaticamente!
                      </div>
                    ) : (
                      <div className="divide-y divide-zinc-900/90 max-h-64 overflow-y-auto pr-1">
                        {currentCycle.contributingRides.map((ride) => {
                          const plat = getPlatformConfig(ride.platformId);
                          return (
                            <div
                              key={ride.id}
                              className="py-2 flex items-center justify-between gap-2 text-xs hover:bg-zinc-900/40 px-2 rounded-lg"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0"
                                  style={{ backgroundColor: plat.accentColor }}
                                />
                                <span className="font-semibold text-white truncate">{plat.name}</span>
                                <span className="text-[10px] text-zinc-400">{formatDateBR(ride.date)}</span>
                                {ride.notes && (
                                  <span className="text-[10px] text-zinc-500 truncate hidden md:inline">
                                    • "{ride.notes}"
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-3 shrink-0">
                                <span className="font-bold text-sky-400">{ride.kmDriven} km</span>
                                <span className="font-semibold text-emerald-400">
                                  {formatCurrency(ride.grossAmount)}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* SECTION 2: HISTÓRICO DE CICLOS CONCLUÍDOS (DO ABASTECIMENTO ATÉ O PRÓXIMO) */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h2 className="text-base sm:text-lg font-black text-white flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-400" />
                  Histórico de Consumo por Abastecimento
                </h2>
                <p className="text-xs text-zinc-400">
                  Consumo exato calculado entre cada abastecimento e o próximo (distância percorrida ÷ litros)
                </p>
              </div>

              {completedCycles.length > 0 && onUpdateProfile && deltaVsProfile !== 0 && (
                <button
                  type="button"
                  onClick={() => {
                    onUpdateProfile({
                      ...profile,
                      kmPerLiter: averageKmPerLiterCompleted,
                    });
                  }}
                  className="text-xs bg-zinc-950 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 px-3 py-1.5 rounded-xl font-semibold transition-all self-start sm:self-auto cursor-pointer"
                  title="Atualizar consumo padrão do veículo no perfil"
                >
                  Sincronizar {averageKmPerLiterCompleted} km/L no Perfil do Veículo
                </button>
              )}
            </div>

            {completedCycles.length === 0 ? (
              <div className="p-6 bg-zinc-950/60 rounded-xl border border-zinc-800 text-center text-xs text-zinc-400 space-y-2">
                <Info className="w-5 h-5 text-zinc-500 mx-auto" />
                <p>
                  Você possui apenas o abastecimento atual. Quando realizar seu <strong>próximo abastecimento</strong>,
                  o ciclo deste tanque será fechado com a média final exata de km/L e aparecerá aqui no histórico!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {allCycles.map((cycle) => {
                  const isExpanded = expandedCycleId === cycle.id;
                  const isCurrent = cycle.isCurrentTank;

                  // Comparison badge against vehicle standard
                  const diffVsProfile = cycle.kmPerLiter - profileKmPerLiter;
                  const isGoodConsumption = cycle.kmPerLiter >= profileKmPerLiter;

                  return (
                    <div
                      key={cycle.id}
                      className={`rounded-xl border transition-all ${
                        isCurrent
                          ? 'bg-zinc-950/90 border-amber-500/40 shadow-sm'
                          : 'bg-zinc-950/60 border-zinc-800 hover:border-zinc-700'
                      }`}
                    >
                      <div className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
                        {/* Left: Cycle Dates & Fuel Info */}
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-black px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                              Ciclo #{cycle.cycleNumber}
                            </span>
                            {isCurrent ? (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                Tanque Atual (Em Aberto)
                              </span>
                            ) : (
                              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                                <CheckCircle2 className="w-3 h-3" />
                                Ciclo Fechado
                              </span>
                            )}
                            <span className="text-xs font-bold text-white capitalize">
                              {cycle.fuelType}
                            </span>
                          </div>

                          <div className="text-xs text-zinc-300 font-medium flex items-center gap-1.5 flex-wrap">
                            <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                            <span>Abastecido em {formatDateBR(cycle.fillDate)}</span>
                            {cycle.nextFillDate && (
                              <>
                                <ArrowRight className="w-3 h-3 text-zinc-500" />
                                <span>Até {formatDateBR(cycle.nextFillDate)} (próximo abastecimento)</span>
                              </>
                            )}
                          </div>

                          {cycle.notes && (
                            <p className="text-[11px] text-zinc-500 italic">"{cycle.notes}"</p>
                          )}
                        </div>

                        {/* Center: Numeric Breakdown */}
                        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 text-center text-xs shrink-0 bg-zinc-900/60 p-2.5 rounded-xl border border-zinc-800/80">
                          <div>
                            <span className="text-[10px] text-zinc-500 block">Litros</span>
                            <strong className="text-white font-bold">{cycle.liters.toFixed(1)} L</strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-zinc-500 block">Distância</span>
                            <strong className="text-sky-400 font-bold">{cycle.kmDriven} km</strong>
                          </div>

                          <div>
                            <span className="text-[10px] text-zinc-500 block">Consumo</span>
                            <strong
                              className={`font-black text-sm ${
                                cycle.kmPerLiter > 0 ? 'text-emerald-400' : 'text-zinc-500'
                              }`}
                            >
                              {cycle.kmPerLiter > 0 ? `${cycle.kmPerLiter.toFixed(2)}` : '--'}
                            </strong>
                            <span className="text-[9px] text-zinc-500 block">km/L</span>
                          </div>

                          <div className="hidden sm:block">
                            <span className="text-[10px] text-zinc-500 block">Custo / KM</span>
                            <strong className="text-white font-bold">
                              {cycle.costPerKm > 0 ? formatCurrency(cycle.costPerKm) : '--'}
                            </strong>
                          </div>
                        </div>

                        {/* Right: Expand / Actions */}
                        <div className="flex items-center justify-between md:justify-end gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                          {!isCurrent && cycle.kmPerLiter > 0 && (
                            <span
                              className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${
                                isGoodConsumption
                                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                              }`}
                            >
                              {diffVsProfile >= 0
                                ? `+${diffVsProfile.toFixed(1)} km/L vs meta`
                                : `${diffVsProfile.toFixed(1)} km/L vs meta`}
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={() => toggleCycleExpand(cycle.id)}
                            className="p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors text-xs flex items-center gap-1 cursor-pointer"
                          >
                            <span>{isExpanded ? 'Recolher' : 'Corridas'}</span>
                            {isExpanded ? (
                              <ChevronUp className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Contributing Rides List */}
                      {isExpanded && (
                        <div className="p-4 pt-2 border-t border-zinc-800/80 bg-zinc-950/40 space-y-2">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 flex items-center justify-between">
                            <span>Corridas que rodaram com este tanque ({cycle.contributingRides.length})</span>
                            <span className="text-emerald-400 font-bold">
                              Total faturado: {formatCurrency(cycle.contributingRides.reduce((s, r) => s + r.grossAmount, 0))}
                            </span>
                          </div>

                          {cycle.contributingRides.length === 0 ? (
                            <div className="text-xs text-zinc-500 py-2">
                              Nenhuma corrida foi vinculada a este intervalo.
                            </div>
                          ) : (
                            <div className="divide-y divide-zinc-900 max-h-48 overflow-y-auto pr-1">
                              {cycle.contributingRides.map((ride) => {
                                const plat = getPlatformConfig(ride.platformId);
                                return (
                                  <div
                                    key={ride.id}
                                    className="py-1.5 flex items-center justify-between text-xs"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: plat.accentColor }}
                                      />
                                      <span className="text-white font-medium">{plat.name}</span>
                                      <span className="text-zinc-500">{formatDateBR(ride.date)}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                      <span className="font-bold text-sky-400">{ride.kmDriven} km</span>
                                      <span className="font-bold text-emerald-400">
                                        {formatCurrency(ride.grossAmount)}
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* SECTION 3: COMPARATIVO ETANOL VS GASOLINA & REGRA DOS 70% */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Parity Calculator 70% */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Calculadora da Regra dos 70% (Etanol vs Gasolina)</h3>
                  <p className="text-xs text-zinc-400">Descubra qual combustível compensa mais no posto hoje</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Preço do Etanol (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={etanolPriceInput}
                    onChange={(e) => setEtanolPriceInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                    placeholder="3.89"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-400 mb-1">
                    Preço da Gasolina (R$)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={gasolinaPriceInput}
                    onChange={(e) => setGasolinaPriceInput(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-500"
                    placeholder="5.79"
                  />
                </div>
              </div>

              <div className="p-3.5 bg-zinc-950 rounded-xl border border-zinc-800 space-y-2 text-xs">
                <div className="flex justify-between items-center text-zinc-300">
                  <span>Relação de Preço (Etanol ÷ Gasolina):</span>
                  <strong className="text-sm font-black text-white">{parityRatio.toFixed(1)}%</strong>
                </div>

                <div className="border-t border-zinc-800 pt-2 flex items-center justify-between">
                  <span className="font-semibold text-zinc-400">Veredito Econômico:</span>
                  {parityRatio <= 70 ? (
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
                      ⛽ Abasteça com ETANOL
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30">
                      ⛽ Abasteça com GASOLINA
                    </span>
                  )}
                </div>

                <p className="text-[11px] text-zinc-500 pt-1">
                  Para o etanol compensar, seu preço deveria ser de até{' '}
                  <strong className="text-amber-400">{formatCurrency(parityBreakEvenEtanol)}</strong>.
                </p>
              </div>
            </div>

            {/* Records & Diagnostic */}
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Recordes & Eficiência do Veículo</h3>
                  <p className="text-xs text-zinc-400">Comparativo dos melhores e piores tanques</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="bg-zinc-950 p-3.5 rounded-xl border border-emerald-500/30">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                    Melhor Tanque (Recorde)
                  </span>
                  <div className="text-xl font-black text-emerald-300 mt-1">
                    {bestCycle ? `${bestCycle.kmPerLiter.toFixed(2)} km/L` : '--'}
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {bestCycle ? `${bestCycle.kmDriven} km em ${formatDateBR(bestCycle.fillDate)}` : 'Sem histórico suficiente'}
                  </span>
                </div>

                <div className="bg-zinc-950 p-3.5 rounded-xl border border-rose-500/30">
                  <span className="text-[10px] uppercase font-bold text-rose-400 block">
                    Menor Média Registrada
                  </span>
                  <div className="text-xl font-black text-rose-300 mt-1">
                    {worstCycle ? `${worstCycle.kmPerLiter.toFixed(2)} km/L` : '--'}
                  </div>
                  <span className="text-[10px] text-zinc-400 block mt-0.5">
                    {worstCycle ? `${worstCycle.kmDriven} km em ${formatDateBR(worstCycle.fillDate)}` : 'Sem histórico suficiente'}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-zinc-400 space-y-1">
                <div className="font-semibold text-zinc-300 flex items-center gap-1.5">
                  <Car className="w-3.5 h-3.5 text-sky-400" />
                  Dica de Economia para Motoristas de App
                </div>
                <p className="text-[11px] leading-relaxed text-zinc-500">
                  Mantenha a calibragem dos pneus em dia no painel de Tarefas & Manutenções. Rodar com pneus calibrados
                  aumenta a autonomia em até 1,5 km por litro!
                </p>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
