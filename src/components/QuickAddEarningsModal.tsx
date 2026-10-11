import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Check,
  DollarSign,
  Clock,
  Navigation,
  Gift,
  Car,
  Package,
  Sparkles,
  Settings2,
  CheckCircle2,
  XCircle,
  Fuel,
} from 'lucide-react';
import { PlatformId, ShiftType, EarningsEntry, ExpenseEntry, DriverProfile, PlatformConfig } from '../types';
import { PLATFORMS, getRelativeDate } from '../data/constants';
import { formatCurrency, formatBRLDecimal, parseBRLDecimal, formatDateBR } from '../utils/helpers';
import { CurrencyInput } from './CurrencyInput';

interface QuickAddEarningsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (entry: Omit<EarningsEntry, 'id' | 'createdAt'>, editId?: string) => void;
  initialEntry?: EarningsEntry | null;
  selectedDate: string;
  profile: DriverProfile;
  platforms?: PlatformConfig[];
  expenses?: ExpenseEntry[];
  earnings?: EarningsEntry[];
  onOpenManagePlatforms?: () => void;
}

export const QuickAddEarningsModal: React.FC<QuickAddEarningsModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialEntry,
  selectedDate,
  profile,
  platforms = PLATFORMS,
  expenses = [],
  earnings = [],
  onOpenManagePlatforms,
}) => {
  // Helper to calculate initial base gross for editing
  const getInitialBaseGross = (entry?: EarningsEntry | null): string => {
    if (!entry) return '';
    const base =
      entry.tipsOrBonus && entry.grossAmount >= entry.tipsOrBonus
        ? entry.grossAmount - entry.tipsOrBonus
        : entry.grossAmount;
    return formatBRLDecimal(base, 2);
  };

  const getInitialTips = (entry?: EarningsEntry | null): string => {
    if (!entry || !entry.tipsOrBonus) return '';
    return formatBRLDecimal(entry.tipsOrBonus, 2);
  };

  const [date, setDate] = useState<string>(() => initialEntry?.date || selectedDate || getRelativeDate(0));
  const [platformId, setPlatformId] = useState<PlatformId>(
    () => initialEntry?.platformId || platforms[0]?.id || 'uber'
  );
  const [grossAmount, setGrossAmount] = useState<string>(() => getInitialBaseGross(initialEntry));
  const [ridesCount, setRidesCount] = useState<string>(() =>
    initialEntry && initialEntry.ridesCount ? initialEntry.ridesCount.toString() : ''
  );
  const [hoursOnline, setHoursOnline] = useState<string>(() => {
    if (!initialEntry || !initialEntry.onlineHours) return '';
    const h = Math.floor(initialEntry.onlineHours);
    return h > 0 ? h.toString() : '';
  });
  const [minutesOnline, setMinutesOnline] = useState<string>(() => {
    if (!initialEntry || !initialEntry.onlineHours) return '';
    const h = Math.floor(initialEntry.onlineHours);
    const m = Math.round((initialEntry.onlineHours - h) * 60);
    return m > 0 ? m.toString() : '';
  });
  const [kmDriven, setKmDriven] = useState<string>(() =>
    initialEntry && initialEntry.kmDriven ? initialEntry.kmDriven.toString() : ''
  );
  const [tipsOrBonus, setTipsOrBonus] = useState<string>(() => getInitialTips(initialEntry));
  const [shift, setShift] = useState<ShiftType>(() => initialEntry?.shift || 'manha');
  const [notes, setNotes] = useState<string>(() => initialEntry?.notes || '');
  const [includeInCalculations, setIncludeInCalculations] = useState<boolean>(
    () => initialEntry?.includeInCalculations !== false
  );

  // Synchronize state when modal is opened or when switching between new and edit
  useEffect(() => {
    if (initialEntry) {
      setDate(initialEntry.date);
      setPlatformId(initialEntry.platformId);
      setGrossAmount(getInitialBaseGross(initialEntry));
      setRidesCount(initialEntry.ridesCount ? initialEntry.ridesCount.toString() : '');
      const totalHours = initialEntry.onlineHours || 0;
      const h = Math.floor(totalHours);
      const m = Math.round((totalHours - h) * 60);
      setHoursOnline(h > 0 ? h.toString() : '');
      setMinutesOnline(m > 0 ? m.toString() : '');
      setKmDriven(initialEntry.kmDriven ? initialEntry.kmDriven.toString() : '');
      setTipsOrBonus(getInitialTips(initialEntry));
      setShift(initialEntry.shift);
      setNotes(initialEntry.notes || '');
      setIncludeInCalculations(initialEntry.includeInCalculations !== false);
    } else {
      setDate(selectedDate || getRelativeDate(0));
      setPlatformId(platforms[0]?.id || 'uber');
      setGrossAmount('');
      // Clean, unpopulated fields for new entries
      setRidesCount('');
      setHoursOnline('');
      setMinutesOnline('');
      setKmDriven('');
      setTipsOrBonus('');
      setNotes('');
      setShift('manha');
      setIncludeInCalculations(true);
    }
  }, [initialEntry, selectedDate, isOpen]);

  if (!isOpen) return null;

  // Real-time calculations with universal BRL parser
  const numGross = parseBRLDecimal(grossAmount);
  const numHours = (parseFloat(hoursOnline) || 0) + (parseFloat(minutesOnline) || 0) / 60;
  const numKm = parseFloat(kmDriven) || 0;
  const numTips = parseBRLDecimal(tipsOrBonus);
  const totalReceived = numGross + numTips;

  // Estimar custo combustível + manutenção dessa quilometragem
  const estimatedFuelCost = (numKm / (profile.kmPerLiter || 10)) * (profile.fuelPricePerLiter || 4);
  const estimatedWearCost = numKm * (profile.maintenanceCostPerKm || 0.18);
  const estimatedExpenses = estimatedFuelCost + estimatedWearCost;
  const estimatedNet = totalReceived - estimatedExpenses;

  const ratePerHour = numHours > 0 ? totalReceived / numHours : 0;
  const ratePerKm = numKm > 0 ? totalReceived / numKm : 0;
  const parsedRides = parseInt(ridesCount, 10) || 0;

  // Correlate with latest fuel expense for real-time telemetry
  const latestFuel = useMemo(() => {
    if (!expenses || expenses.length === 0) return null;
    const fuels = expenses
      .filter((e) => e.category === 'combustivel' && e.amount > 0 && e.includeInCalculations !== false)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    return fuels.length > 0 ? fuels[fuels.length - 1] : null;
  }, [expenses]);

  const latestFuelLiters = useMemo(() => {
    if (!latestFuel) return 0;
    if (latestFuel.liters && latestFuel.liters > 0) return latestFuel.liters;
    if (latestFuel.pricePerLiter && latestFuel.pricePerLiter > 0) {
      return latestFuel.amount / latestFuel.pricePerLiter;
    }
    return latestFuel.amount / (profile.fuelPricePerLiter || 4);
  }, [latestFuel, profile]);

  const priorKmInCycle = useMemo(() => {
    if (!latestFuel || !earnings || earnings.length === 0) return 0;
    const fuelDate = latestFuel.date;
    return earnings
      .filter(
        (e) =>
          e.date >= fuelDate &&
          e.includeInCalculations !== false &&
          (!initialEntry || e.id !== initialEntry.id)
      )
      .reduce((sum, e) => sum + (e.kmDriven || 0), 0);
  }, [latestFuel, earnings, initialEntry]);

  const totalCycleKmWithCurrent = priorKmInCycle + numKm;
  const estimatedCycleKmL =
    latestFuel && latestFuelLiters > 0 && totalCycleKmWithCurrent > 0
      ? Number((totalCycleKmWithCurrent / latestFuelLiters).toFixed(2))
      : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (numGross <= 0) return;

    onSave(
      {
        date,
        platformId,
        grossAmount: totalReceived,
        ridesCount: parsedRides,
        onlineHours: Number(numHours.toFixed(2)),
        kmDriven: numKm,
        tipsOrBonus: numTips,
        shift,
        notes: notes.trim() || undefined,
        includeInCalculations,
      },
      initialEntry ? initialEntry.id : undefined
    );
    onClose();
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg h-[92dvh] sm:h-auto max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950/95 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
              <DollarSign className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {initialEntry ? 'Editar Lançamento' : 'Registrar Ganhos do Dia'}
              </h2>
              <p className="text-xs text-zinc-400">
                {initialEntry
                  ? 'Altere os dados registrados do lançamento selecionado'
                  : 'Lançamento de corrida ou entregas por aplicativo'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-1.5 rounded-lg hover:bg-zinc-800 transition-colors cursor-pointer"
            aria-label="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form
          key={initialEntry ? `edit-earn-${initialEntry.id}` : `new-earn-${isOpen}`}
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 overscroll-contain"
        >
          {/* Include in Calculations Toggle */}
          <div
            className={`p-3 rounded-xl border transition-all ${
              includeInCalculations
                ? 'bg-emerald-500/10 border-emerald-500/30'
                : 'bg-amber-500/10 border-amber-500/30'
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {includeInCalculations ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>
                      {includeInCalculations
                        ? 'Incluído nos cálculos e relatórios'
                        : 'Ignorado nos cálculos (apenas histórico)'}
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                    {includeInCalculations
                      ? 'O valor soma no faturamento bruto, cálculo de metas, médias por hora e relatórios.'
                      : 'Não soma no faturamento bruto, metas e relatórios financeiros.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIncludeInCalculations(!includeInCalculations)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  includeInCalculations ? 'bg-emerald-500' : 'bg-zinc-700'
                }`}
                role="switch"
                aria-checked={includeInCalculations}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    includeInCalculations ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Date & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Data da Produção</label>
              <input
                id="input-earnings-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-zinc-400 mb-1">Turno de Trabalho</label>
              <select
                id="select-earnings-shift"
                value={shift}
                onChange={(e) => setShift(e.target.value as ShiftType)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
              >
                <option value="manha">🌅 Manhã (06h - 12h)</option>
                <option value="tarde">☀️ Tarde (12h - 18h)</option>
                <option value="noite">🌙 Noite (18h - 00h)</option>
                <option value="madrugada">🌌 Madrugada (00h - 06h)</option>
                <option value="integral">⚡ Integral / O dia todo</option>
              </select>
            </div>
          </div>

          {/* Select Platform */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-zinc-300">
                Selecione o Aplicativo
              </label>
              {onOpenManagePlatforms && (
                <button
                  type="button"
                  onClick={onOpenManagePlatforms}
                  className="flex items-center gap-1 text-[11px] text-emerald-400 hover:text-emerald-300 font-bold hover:underline cursor-pointer bg-emerald-500/10 hover:bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/30 transition-colors"
                >
                  <Settings2 className="w-3 h-3" />
                  <span>Adicionar / Editar Apps</span>
                </button>
              )}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {platforms.map((platform) => {
                const isSelected = platformId === platform.id;
                return (
                  <button
                    key={platform.id}
                    id={`btn-select-platform-${platform.id}`}
                    type="button"
                    onClick={() => setPlatformId(platform.id)}
                    className={`flex flex-col items-center justify-center p-2.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? `${platform.bgColor} ${platform.borderColor} ring-2 ring-emerald-500 shadow-md`
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      {platform.category === 'entrega' ? (
                        <Package className="w-3.5 h-3.5 text-zinc-400" />
                      ) : (
                        <Car className="w-3.5 h-3.5 text-zinc-400" />
                      )}
                      <span className={isSelected ? platform.textColor : 'text-zinc-300 font-bold'}>
                        {platform.name}
                      </span>
                    </div>
                    <span className="text-[10px] text-zinc-500 truncate w-full text-center">
                      {platform.tag}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Gross Amount Input (Big & Prominent) */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-zinc-300 flex items-center gap-1">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Valor Bruto no App (R$)
              </label>
              <span className="text-[11px] text-zinc-500">Valor exibido no extrato</span>
            </div>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-500 z-10">
                R$
              </span>
              <CurrencyInput
                id="input-earnings-gross"
                placeholder="0,00"
                value={grossAmount}
                showQuickBadge={true}
                onChange={(_num, formatted) => setGrossAmount(formatted)}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-2xl font-black text-emerald-400 placeholder-zinc-700 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>
          </div>

          {/* Operational Metrics (Rides, Hours, Km) - Not pre-filled when adding! */}
          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Corridas / Pacotes
              </label>
              <input
                id="input-earnings-rides"
                type="number"
                min="0"
                placeholder="0"
                value={ridesCount}
                onChange={(e) => setRidesCount(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-400" />
                Tempo Online
              </label>
              <div className="flex items-center gap-1">
                <input
                  id="input-earnings-hours"
                  type="number"
                  min="0"
                  max="24"
                  placeholder="0h"
                  value={hoursOnline}
                  onChange={(e) => setHoursOnline(e.target.value)}
                  className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white text-sm font-semibold text-center focus:outline-none focus:border-emerald-500"
                />
                <span className="text-zinc-500 text-xs">:</span>
                <input
                  id="input-earnings-minutes"
                  type="number"
                  min="0"
                  max="59"
                  step="1"
                  placeholder="0m"
                  value={minutesOnline}
                  onChange={(e) => setMinutesOnline(e.target.value)}
                  className="w-1/2 bg-zinc-950 border border-zinc-800 rounded-xl px-2 py-2 text-white text-sm font-semibold text-center focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <Navigation className="w-3 h-3 text-zinc-400" />
                Km Rodados
              </label>
              <input
                id="input-earnings-km"
                type="number"
                min="0"
                step="0.1"
                placeholder="0"
                value={kmDriven}
                onChange={(e) => setKmDriven(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Real-time Fuel Telemetry Insight */}
          {latestFuel && (
            <div className="bg-amber-950/20 border border-amber-500/20 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center justify-between text-amber-400 font-bold flex-wrap gap-1">
                <span className="flex items-center gap-1.5">
                  <Fuel className="w-3.5 h-3.5" />
                  <span>Consumo no Ciclo do Último Abastecimento</span>
                </span>
                <span className="text-[10px] text-zinc-400 font-normal">
                  Abastecido em {formatDateBR(latestFuel.date)} ({latestFuelLiters.toFixed(1)} L)
                </span>
              </div>
              <p className="text-zinc-300 text-[11px] leading-relaxed">
                Com este lançamento ({numKm > 0 ? `+${numKm} km` : '0 km'}), o ciclo totaliza{' '}
                <strong className="text-white">{totalCycleKmWithCurrent} km rodados</strong> ÷{' '}
                {latestFuelLiters.toFixed(1)} L ={' '}
                <strong className="text-emerald-400 font-bold">
                  {estimatedCycleKmL > 0 ? `${estimatedCycleKmL} km/L acumulado` : 'Aguardando km'}
                </strong>.
              </p>
            </div>
          )}

          {/* Optional: Tips/Bonus and Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1 flex items-center gap-1">
                <Gift className="w-3 h-3 text-amber-400" />
                Gorjetas / Bônus Extra (R$)
              </label>
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 z-10">
                  R$
                </span>
                <CurrencyInput
                  id="input-earnings-tips"
                  placeholder="0,00"
                  value={tipsOrBonus}
                  onChange={(_num, formatted) => setTipsOrBonus(formatted)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-8 pr-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                Anotações (opcional)
              </label>
              <input
                id="input-earnings-notes"
                type="text"
                placeholder="ex: Dinâmico bom, chuva"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          {/* Live Performance Preview Card */}
          {numGross > 0 && (
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  Performance Projetada do Turno
                </span>
                <span>Lucro Est.: {formatCurrency(estimatedNet)}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center pt-1">
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">Total Faturado</div>
                  <div className="text-xs font-bold text-white">{formatCurrency(totalReceived)}</div>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">R$ por Hora</div>
                  <div
                    className={`text-xs font-bold ${
                      ratePerHour >= (profile.minAcceptableRatePerHour || 40)
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {numHours > 0 ? `${formatCurrency(ratePerHour)}/h` : '-'}
                  </div>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">R$ por KM</div>
                  <div
                    className={`text-xs font-bold ${
                      ratePerKm >= (profile.minAcceptableRatePerKm || 2.2)
                        ? 'text-emerald-400'
                        : 'text-amber-400'
                    }`}
                  >
                    {numKm > 0 ? `${formatCurrency(ratePerKm)}/km` : '-'}
                  </div>
                </div>
                <div className="bg-zinc-950/70 p-2 rounded-lg border border-zinc-800">
                  <div className="text-[10px] text-zinc-400">Ticket Médio</div>
                  <div className="text-xs font-bold text-white">
                    {parsedRides > 0 ? formatCurrency(totalReceived / parsedRides) : '-'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-submit-earnings"
              type="submit"
              disabled={numGross <= 0}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-zinc-950 text-sm font-bold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>{initialEntry ? 'Atualizar Lançamento' : 'Salvar no Diário'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
