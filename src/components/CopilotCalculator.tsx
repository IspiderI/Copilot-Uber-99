import React, { useState } from 'react';
import {
  Zap,
  Gauge,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ArrowRight,
  PlusCircle,
  RotateCcw,
  Sparkles,
  ShieldCheck,
  Fuel,
  Wrench,
  TrendingUp,
} from 'lucide-react';
import { PlatformId, DriverProfile, CopilotCalculation } from '../types';
import { PLATFORMS } from '../data/constants';
import { formatCurrency, calculateCopilotRide, parseBRLDecimal } from '../utils/helpers';
import { CurrencyInput } from './CurrencyInput';

interface CopilotCalculatorProps {
  profile: DriverProfile;
  onAcceptAndLogRide: (calc: CopilotCalculation) => void;
  onOpenSettings?: () => void;
}

export const CopilotCalculator: React.FC<CopilotCalculatorProps> = ({
  profile,
  onAcceptAndLogRide,
  onOpenSettings,
}) => {
  const [platform, setPlatform] = useState<PlatformId>('uber');
  const [offeredValue, setOfferedValue] = useState<string>('28.50');
  const [pickupDistanceKm, setPickupDistanceKm] = useState<string>('2.5');
  const [tripDistanceKm, setTripDistanceKm] = useState<string>('9.0');
  const [estimatedMinutes, setEstimatedMinutes] = useState<string>('20');

  // Histórico de simulações da sessão
  const [history, setHistory] = useState<CopilotCalculation[]>([
    {
      id: 'mock-calc-1',
      platform: 'uber',
      offeredValue: 34.0,
      pickupDistanceKm: 1.5,
      tripDistanceKm: 11.0,
      estimatedMinutes: 24,
      totalDistanceKm: 12.5,
      ratePerKm: 2.72,
      ratePerHour: 85.0,
      operationalCost: 6.75,
      netProfit: 27.25,
      verdict: 'green',
      verdictLabel: '🟢 EXCELENTE - Aceitar!',
      verdictReason: 'Excelente rentabilidade! R$ 2,72/km e R$ 85,00/hora.',
      timestamp: '14:20',
    },
    {
      id: 'mock-calc-2',
      platform: '99',
      offeredValue: 12.0,
      pickupDistanceKm: 4.8,
      tripDistanceKm: 4.2,
      estimatedMinutes: 22,
      totalDistanceKm: 9.0,
      ratePerKm: 1.33,
      ratePerHour: 32.73,
      operationalCost: 4.95,
      netProfit: 7.05,
      verdict: 'red',
      verdictLabel: '🔴 RECUSAR - Risco de Prejuízo!',
      verdictReason: 'Km de busca alto (4.8km) para viagem curta. Paga apenas R$ 1,33/km.',
      timestamp: '13:45',
    },
  ]);

  // Current calculation
  const currentCalc = calculateCopilotRide(
    parseBRLDecimal(offeredValue),
    parseFloat(pickupDistanceKm) || 0,
    parseFloat(tripDistanceKm) || 0,
    parseFloat(estimatedMinutes) || 1,
    platform,
    profile
  );

  const handleSimulate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!offeredValue || parseFloat(offeredValue) <= 0) return;

    setHistory((prev) => [currentCalc, ...prev.slice(0, 9)]);
  };

  const handleReset = () => {
    setOfferedValue('');
    setPickupDistanceKm('1.5');
    setTripDistanceKm('6.0');
    setEstimatedMinutes('15');
  };

  return (
    <div className="space-y-6">
      {/* Banner Copiloto Zeca */}
      <div className="bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-950 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-400" />
                Semáforo Zeca
              </span>
              <span className="text-xs text-zinc-400 font-medium">Calculadora de Viabilidade em Tempo Real</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Vale a pena aceitar a corrida?
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-2xl">
              Insira o valor e as distâncias da oferta para o copiloto calcular instantaneamente
              o semáforo de lucro, descontando combustível e desgaste real do veículo.
            </p>
          </div>

          {onOpenSettings ? (
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-2.5 bg-zinc-950/80 hover:bg-zinc-800 border border-zinc-800 hover:border-emerald-500/50 px-4 py-2.5 rounded-xl text-xs text-zinc-300 transition-all text-left group cursor-pointer"
              title="Clique para ajustar consumo e veículo"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
              <div>
                <div className="font-bold text-white flex items-center gap-1.5">
                  <span>{profile.vehicleModel}</span>
                  <span className="text-[10px] text-emerald-400 underline font-normal">ajustar</span>
                </div>
                <div className="text-[11px] text-zinc-400">
                  {profile.kmPerLiter} km/L • {formatCurrency(profile.fuelPricePerLiter)}/L
                </div>
              </div>
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-zinc-950/80 border border-zinc-800 px-4 py-2.5 rounded-xl text-xs text-zinc-300">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <div>
                <div className="font-bold text-white">{profile.vehicleModel}</div>
                <div className="text-[11px] text-zinc-400">
                  {profile.kmPerLiter} km/L • {formatCurrency(profile.fuelPricePerLiter)}/L
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Grid: Form Inputs + Live Traffic Light Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Side: Input Controls (5 cols) */}
        <div className="lg:col-span-5 bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg space-y-4">
          <form onSubmit={handleSimulate} className="space-y-4">
            {/* Platform Selector Buttons */}
            <div>
              <label className="block text-xs font-bold text-zinc-400 mb-2">
                Aplicativo que enviou a corrida
              </label>
              <div className="grid grid-cols-4 gap-1.5">
                {PLATFORMS.slice(0, 4).map((p) => {
                  const isSelected = platform === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setPlatform(p.id)}
                      className={`p-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                        isSelected
                          ? `${p.bgColor} ${p.borderColor} ${p.textColor} ring-1 ring-emerald-500 shadow-sm`
                          : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {p.name}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Offered Value (Big Input) */}
            <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
              <label className="block text-xs font-bold text-zinc-300 mb-1">
                Valor da Corrida na Tela (R$)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-2xl font-bold text-zinc-500 z-10">
                  R$
                </span>
                <CurrencyInput
                  id="input-copilot-offered"
                  placeholder="28,50"
                  value={offeredValue}
                  showQuickBadge={true}
                  onChange={(_num, formatted) => setOfferedValue(formatted)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-2xl font-black text-amber-400 placeholder-zinc-700 focus:outline-none focus:border-amber-400"
                />
              </div>
            </div>

            {/* Distances and Time */}
            <div className="grid grid-cols-3 gap-2.5">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Até o passageiro
                </label>
                <div className="relative">
                  <input
                    id="input-copilot-pickup"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="2.0"
                    value={pickupDistanceKm}
                    onChange={(e) => setPickupDistanceKm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                    km
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Distância Viagem
                </label>
                <div className="relative">
                  <input
                    id="input-copilot-trip"
                    type="number"
                    step="0.1"
                    min="0"
                    placeholder="8.0"
                    value={tripDistanceKm}
                    onChange={(e) => setTripDistanceKm(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                    km
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Tempo Estimado
                </label>
                <div className="relative">
                  <input
                    id="input-copilot-time"
                    type="number"
                    step="1"
                    min="1"
                    placeholder="18"
                    value={estimatedMinutes}
                    onChange={(e) => setEstimatedMinutes(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-2 text-white font-bold text-sm focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold">
                    min
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Distance Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-zinc-400 pt-1">
              <span className="shrink-0 text-zinc-500">Exemplos:</span>
              <button
                type="button"
                onClick={() => {
                  setOfferedValue('14.00');
                  setPickupDistanceKm('1.2');
                  setTripDistanceKm('3.8');
                  setEstimatedMinutes('12');
                }}
                className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer shrink-0"
              >
                Curta (R$14)
              </button>
              <button
                type="button"
                onClick={() => {
                  setOfferedValue('38.50');
                  setPickupDistanceKm('2.5');
                  setTripDistanceKm('14.0');
                  setEstimatedMinutes('28');
                }}
                className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer shrink-0"
              >
                Média (R$38)
              </button>
              <button
                type="button"
                onClick={() => {
                  setOfferedValue('85.00');
                  setPickupDistanceKm('4.0');
                  setTripDistanceKm('38.0');
                  setEstimatedMinutes('55');
                }}
                className="px-2 py-1 bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 rounded-lg cursor-pointer shrink-0"
              >
                Aeroporto (R$85)
              </button>
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={handleReset}
                className="p-2.5 border border-zinc-800 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Limpar campos"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                id="btn-simulate-ride"
                type="submit"
                className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 active:scale-95 text-zinc-950 font-extrabold py-3 px-4 rounded-xl text-sm shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
              >
                <Zap className="w-4 h-4 fill-zinc-950" />
                <span>Calcular Semáforo Zeca</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Side: Semáforo Zeca Result & Economic Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Big Traffic Light Card */}
          <div
            className={`border rounded-2xl p-6 transition-all shadow-xl relative overflow-hidden ${
              currentCalc.verdict === 'green'
                ? 'bg-emerald-950/40 border-emerald-500/60 shadow-emerald-500/10'
                : currentCalc.verdict === 'yellow'
                ? 'bg-amber-950/40 border-amber-500/60 shadow-amber-500/10'
                : 'bg-rose-950/40 border-rose-500/60 shadow-rose-500/10'
            }`}
          >
            {/* Top Verdict Row */}
            <div className="flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    currentCalc.verdict === 'green'
                      ? 'bg-emerald-500 text-zinc-950 border-emerald-400 shadow-lg shadow-emerald-500/30'
                      : currentCalc.verdict === 'yellow'
                      ? 'bg-amber-500 text-zinc-950 border-amber-400 shadow-lg shadow-amber-500/30'
                      : 'bg-rose-500 text-white border-rose-400 shadow-lg shadow-rose-500/30'
                  }`}
                >
                  {currentCalc.verdict === 'green' && <CheckCircle2 className="w-7 h-7 stroke-[2.5]" />}
                  {currentCalc.verdict === 'yellow' && <AlertTriangle className="w-7 h-7 stroke-[2.5]" />}
                  {currentCalc.verdict === 'red' && <XCircle className="w-7 h-7 stroke-[2.5]" />}
                </div>

                <div>
                  <div className="text-xs uppercase font-extrabold tracking-wider text-zinc-400">
                    Veredito do Copiloto
                  </div>
                  <h2
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      currentCalc.verdict === 'green'
                        ? 'text-emerald-400'
                        : currentCalc.verdict === 'yellow'
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {currentCalc.verdictLabel}
                  </h2>
                </div>
              </div>

              {/* 3-Dot Traffic Light Indicator */}
              <div className="flex flex-col gap-1.5 p-2 bg-zinc-950/80 rounded-xl border border-zinc-800">
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    currentCalc.verdict === 'red'
                      ? 'bg-rose-500 shadow-md shadow-rose-500/80 scale-110'
                      : 'bg-rose-950/60 opacity-30'
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    currentCalc.verdict === 'yellow'
                      ? 'bg-amber-400 shadow-md shadow-amber-400/80 scale-110'
                      : 'bg-amber-950/60 opacity-30'
                  }`}
                />
                <span
                  className={`w-3.5 h-3.5 rounded-full transition-all ${
                    currentCalc.verdict === 'green'
                      ? 'bg-emerald-400 shadow-md shadow-emerald-400/80 scale-110'
                      : 'bg-emerald-950/60 opacity-30'
                  }`}
                />
              </div>
            </div>

            {/* Explanation Reason */}
            <p className="text-xs sm:text-sm text-zinc-300 mt-3 bg-zinc-950/50 p-3 rounded-xl border border-zinc-800/80">
              {currentCalc.verdictReason}
            </p>

            {/* Primary Metrics 4-Box Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
              <div className="bg-zinc-950/90 border border-zinc-800/80 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Gauge className="w-3 h-3 text-zinc-400" />
                  R$ por KM Total
                </span>
                <div
                  className={`text-lg font-black mt-0.5 ${
                    currentCalc.ratePerKm >= (profile.minAcceptableRatePerKm || 2.2)
                      ? 'text-emerald-400'
                      : currentCalc.ratePerKm >= 1.6
                      ? 'text-amber-400'
                      : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(currentCalc.ratePerKm)}
                  <span className="text-xs font-normal text-zinc-500">/km</span>
                </div>
                <div className="text-[10px] text-zinc-500">
                  {currentCalc.totalDistanceKm} km totais
                </div>
              </div>

              <div className="bg-zinc-950/90 border border-zinc-800/80 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3 text-zinc-400" />
                  Ritmo por Hora
                </span>
                <div
                  className={`text-lg font-black mt-0.5 ${
                    currentCalc.ratePerHour >= (profile.minAcceptableRatePerHour || 40)
                      ? 'text-emerald-400'
                      : 'text-amber-400'
                  }`}
                >
                  {formatCurrency(currentCalc.ratePerHour)}
                  <span className="text-xs font-normal text-zinc-500">/h</span>
                </div>
                <div className="text-[10px] text-zinc-500">{currentCalc.estimatedMinutes} min viagem</div>
              </div>

              <div className="bg-zinc-950/90 border border-zinc-800/80 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Fuel className="w-3 h-3 text-rose-400" />
                  Custo Operacional
                </span>
                <div className="text-lg font-black mt-0.5 text-rose-400">
                  -{formatCurrency(currentCalc.operationalCost)}
                </div>
                <div className="text-[10px] text-zinc-500">Gasolina + Desgaste</div>
              </div>

              <div className="bg-zinc-950/90 border border-zinc-800/80 p-3 rounded-xl">
                <span className="text-[11px] text-zinc-400 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  Lucro Líquido
                </span>
                <div
                  className={`text-lg font-black mt-0.5 ${
                    currentCalc.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {formatCurrency(currentCalc.netProfit)}
                </div>
                <div className="text-[10px] text-zinc-500">Livre no bolso</div>
              </div>
            </div>

            {/* Quick Action: "Fiz essa corrida! Lançar nos Ganhos" */}
            <div className="mt-4 pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-zinc-400">
                Aceitou esta viagem? Lance direto no extrato diário:
              </span>
              <button
                id="btn-log-copilot-ride"
                type="button"
                onClick={() => onAcceptAndLogRide(currentCalc)}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 active:scale-95 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer border border-zinc-700"
              >
                <PlusCircle className="w-4 h-4 text-emerald-400" />
                <span>Lançar nos Ganhos de Hoje</span>
              </button>
            </div>
          </div>

          {/* Detailed Math Transparency Card */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 text-xs space-y-2">
            <div className="flex items-center justify-between text-zinc-400 font-bold border-b border-zinc-800 pb-2">
              <span className="flex items-center gap-1.5 text-white">
                <Wrench className="w-3.5 h-3.5 text-zinc-400" />
                Memória de Cálculo Real
              </span>
              <span>Parâmetros: {profile.vehicleModel}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-zinc-400 pt-1">
              <div className="flex justify-between">
                <span>Distância Busca (embarque):</span>
                <span className="text-zinc-200 font-semibold">{currentCalc.pickupDistanceKm} km</span>
              </div>
              <div className="flex justify-between">
                <span>Distância Viagem:</span>
                <span className="text-zinc-200 font-semibold">{currentCalc.tripDistanceKm} km</span>
              </div>
              <div className="flex justify-between">
                <span>Consumo Estimado:</span>
                <span className="text-zinc-200 font-semibold">
                  {(currentCalc.totalDistanceKm / (profile.kmPerLiter || 10)).toFixed(2)} Litros
                </span>
              </div>
              <div className="flex justify-between">
                <span>Gasto Combustível ({formatCurrency(profile.fuelPricePerLiter)}/L):</span>
                <span className="text-rose-400 font-semibold">
                  {formatCurrency((currentCalc.totalDistanceKm / (profile.kmPerLiter || 10)) * profile.fuelPricePerLiter)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Desgaste Pneu/Óleo ({formatCurrency(profile.maintenanceCostPerKm)}/km):</span>
                <span className="text-rose-400 font-semibold">
                  {formatCurrency(currentCalc.totalDistanceKm * profile.maintenanceCostPerKm)}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Sua Meta Mínima Cadastrada:</span>
                <span className="text-emerald-400 font-semibold">
                  {formatCurrency(profile.minAcceptableRatePerKm || 2.2)}/km
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* History of Simulated Rides in this session */}
      {history.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <RotateCcw className="w-4 h-4 text-emerald-400" />
              Últimas Corridas Simuladas no Copiloto
            </h3>
            <span className="text-xs text-zinc-500">{history.length} cotações</span>
          </div>

          <div className="space-y-2">
            {history.map((item) => (
              <div
                key={item.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl bg-zinc-950/70 border border-zinc-800/80 hover:border-zinc-700 transition-all text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-3 h-3 rounded-full shrink-0 ${
                      item.verdict === 'green'
                        ? 'bg-emerald-400'
                        : item.verdict === 'yellow'
                        ? 'bg-amber-400'
                        : 'bg-rose-400'
                    }`}
                  />
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span>{formatCurrency(item.offeredValue)}</span>
                      <span className="text-zinc-500">•</span>
                      <span className="uppercase text-[10px] font-black text-zinc-400">
                        {item.platform}
                      </span>
                      <span className="text-zinc-500">•</span>
                      <span className="text-zinc-400">{item.timestamp}</span>
                    </div>
                    <div className="text-zinc-400 text-[11px] mt-0.5">
                      {item.totalDistanceKm} km ({item.pickupDistanceKm}km busca + {item.tripDistanceKm}km viagem) • {item.estimatedMinutes} min
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4">
                  <div className="text-right">
                    <div className="font-bold text-zinc-200">{formatCurrency(item.ratePerKm)}/km</div>
                    <div className="text-[10px] text-zinc-500">{formatCurrency(item.ratePerHour)}/h</div>
                  </div>

                  <div className="text-right">
                    <div
                      className={`font-black ${
                        item.netProfit > 0 ? 'text-emerald-400' : 'text-rose-400'
                      }`}
                    >
                      {formatCurrency(item.netProfit)}
                    </div>
                    <div className="text-[10px] text-zinc-500">Lucro Líquido</div>
                  </div>

                  <button
                    onClick={() => onAcceptAndLogRide(item)}
                    className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                    title="Lançar nos ganhos do dia"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
