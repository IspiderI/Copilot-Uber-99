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
} from 'lucide-react';
import {
  ExpenseEntry,
  EarningsEntry,
  DriverProfile,
  PlatformConfig,
  FuelTypeConfig,
} from '../types';
import { calculateFuelCycles, FuelCycle } from '../utils/fuelTracking';
import { formatCurrency, formatDateBR, getPlatformConfig } from '../utils/helpers';
import { PLATFORMS } from '../data/constants';

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
}) => {
  const [expandedCycleId, setExpandedCycleId] = useState<string | null>(null);
  const [showRidesCurrentTank, setShowRidesCurrentTank] = useState<boolean>(true);
  const [etanolPriceInput, setEtanolPriceInput] = useState<string>('3.89');
  const [gasolinaPriceInput, setGasolinaPriceInput] = useState<string>('5.79');

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
