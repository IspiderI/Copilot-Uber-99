import React, { useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight, Check, X, CalendarDays, Sparkles } from 'lucide-react';
import { formatDateBR, calculateDateDiffDays, formatLocalDate } from '../utils/helpers';
import { getRelativeDate } from '../data/constants';

interface DateRangePickerProps {
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  onChangeStartDate: (date: string) => void;
  onChangeEndDate: (date: string) => void;
  accentColor?: 'emerald' | 'rose' | 'purple';
  className?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onChangeStartDate,
  onChangeEndDate,
  accentColor = 'purple',
  className = '',
}) => {
  const [isVisualModalOpen, setIsVisualModalOpen] = useState(false);

  // Month navigation for visual calendar
  const initialDateObj = startDate ? new Date(startDate + 'T00:00:00') : new Date();
  const [calYear, setCalYear] = useState(initialDateObj.getFullYear());
  const [calMonth, setCalMonth] = useState(initialDateObj.getMonth());

  // Temporary selection inside modal
  const [tempStart, setTempStart] = useState(startDate);
  const [tempEnd, setTempEnd] = useState(endDate);

  const daysCount = calculateDateDiffDays(startDate, endDate);

  const accentStyles = {
    emerald: {
      borderFocus: 'focus-within:border-emerald-500',
      activeText: 'text-emerald-400',
      badgeBg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
      buttonBg: 'bg-emerald-600 hover:bg-emerald-500 text-white',
      btnSecondary: 'hover:bg-emerald-500/10 text-emerald-400 hover:text-emerald-300',
      highlightRange: 'bg-emerald-500/20 text-emerald-200',
      highlightSelected: 'bg-emerald-500 text-zinc-950 font-black',
    },
    rose: {
      borderFocus: 'focus-within:border-rose-500',
      activeText: 'text-rose-400',
      badgeBg: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
      buttonBg: 'bg-rose-600 hover:bg-rose-500 text-white',
      btnSecondary: 'hover:bg-rose-500/10 text-rose-400 hover:text-rose-300',
      highlightRange: 'bg-rose-500/20 text-rose-200',
      highlightSelected: 'bg-rose-500 text-white font-black',
    },
    purple: {
      borderFocus: 'focus-within:border-purple-500',
      activeText: 'text-purple-400',
      badgeBg: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
      buttonBg: 'bg-purple-600 hover:bg-purple-500 text-white',
      btnSecondary: 'hover:bg-purple-500/10 text-purple-400 hover:text-purple-300',
      highlightRange: 'bg-purple-500/20 text-purple-200',
      highlightSelected: 'bg-purple-600 text-white font-black',
    },
  }[accentColor];

  const handleStartChange = (val: string) => {
    if (!val) return;
    onChangeStartDate(val);
    if (endDate && val > endDate) {
      onChangeEndDate(val);
    }
  };

  const handleEndChange = (val: string) => {
    if (!val) return;
    onChangeEndDate(val);
    if (startDate && val < startDate) {
      onChangeStartDate(val);
    }
  };

  // Quick preset handlers
  const applyPreset = (days: number) => {
    const end = getRelativeDate(0);
    const start = getRelativeDate(days - 1);
    onChangeStartDate(start);
    onChangeEndDate(end);
    setTempStart(start);
    setTempEnd(end);
  };

  const applyThisMonth = () => {
    const now = new Date();
    const start = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 1));
    const end = formatLocalDate(new Date(now.getFullYear(), now.getMonth() + 1, 0));
    onChangeStartDate(start);
    onChangeEndDate(end);
    setTempStart(start);
    setTempEnd(end);
  };

  const applyLastMonth = () => {
    const now = new Date();
    const start = formatLocalDate(new Date(now.getFullYear(), now.getMonth() - 1, 1));
    const end = formatLocalDate(new Date(now.getFullYear(), now.getMonth(), 0));
    onChangeStartDate(start);
    onChangeEndDate(end);
    setTempStart(start);
    setTempEnd(end);
  };

  // Open visual modal
  const openVisualModal = () => {
    setTempStart(startDate);
    setTempEnd(endDate);
    if (startDate) {
      const d = new Date(startDate + 'T00:00:00');
      setCalYear(d.getFullYear());
      setCalMonth(d.getMonth());
    }
    setIsVisualModalOpen(true);
  };

  // Visual calendar calculation
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calYear, calMonth, 1).getDay(); // 0 is Sun
  const paddingDays = Array.from({ length: firstDayOfWeek });
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const monthName = new Date(calYear, calMonth, 1).toLocaleDateString('pt-BR', {
    month: 'long',
    year: 'numeric',
  });
  const formattedMonthName = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  const handleDayClickInModal = (dayNum: number) => {
    const clickedStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    
    if (!tempStart || (tempStart && tempEnd)) {
      // Start a new selection
      setTempStart(clickedStr);
      setTempEnd('');
    } else {
      // We have tempStart and no tempEnd
      if (clickedStr < tempStart) {
        setTempEnd(tempStart);
        setTempStart(clickedStr);
      } else {
        setTempEnd(clickedStr);
      }
    }
  };

  const handleConfirmVisualModal = () => {
    if (tempStart) {
      onChangeStartDate(tempStart);
      onChangeEndDate(tempEnd || tempStart);
    }
    setIsVisualModalOpen(false);
  };

  return (
    <div
      className={`bg-zinc-950/90 border border-zinc-800/90 rounded-2xl p-4 sm:p-5 flex flex-col items-center justify-center transition-all ${className}`}
    >
      {/* Date Pickers Container: matches reference screenshot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6 w-full max-w-md">
        {/* 'De' block */}
        <div
          className={`flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 ${accentStyles.borderFocus} hover:border-zinc-700 transition-all`}
        >
          <button
            type="button"
            onClick={openVisualModal}
            className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Abrir calendário visual"
          >
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </button>
          
          <div className="flex-1 min-w-0">
            <label htmlFor="range-start-date" className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              De
            </label>
            <input
              id="range-start-date"
              type="date"
              value={startDate}
              onChange={(e) => handleStartChange(e.target.value)}
              className="w-full bg-transparent text-white font-black text-sm sm:text-base focus:outline-none cursor-pointer [color-scheme:dark]"
              title="Data de início do período"
            />
          </div>
        </div>

        {/* 'Até' block */}
        <div
          className={`flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 ${accentStyles.borderFocus} hover:border-zinc-700 transition-all`}
        >
          <button
            type="button"
            onClick={openVisualModal}
            className="p-2 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 hover:text-white transition-colors cursor-pointer shrink-0"
            title="Abrir calendário visual"
          >
            <Calendar className="w-5 h-5 stroke-[2.2]" />
          </button>

          <div className="flex-1 min-w-0">
            <label htmlFor="range-end-date" className="text-xs text-zinc-400 font-bold uppercase tracking-wider block">
              Até
            </label>
            <input
              id="range-end-date"
              type="date"
              value={endDate}
              onChange={(e) => handleEndChange(e.target.value)}
              className="w-full bg-transparent text-white font-black text-sm sm:text-base focus:outline-none cursor-pointer [color-scheme:dark]"
              title="Data de término do período"
            />
          </div>
        </div>
      </div>

      {/* Days count underneath, centered: matches screenshot "8 dias" */}
      <div className="flex items-center gap-2 mt-2.5">
        <span className="text-xs sm:text-sm font-extrabold text-zinc-300">
          {daysCount} {daysCount === 1 ? 'dia' : 'dias'}
        </span>
        <span className="text-zinc-600">•</span>
        <button
          type="button"
          onClick={openVisualModal}
          className="text-xs font-semibold text-zinc-400 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
        >
          <CalendarDays className="w-3.5 h-3.5" />
          <span>Escolher no Calendário</span>
        </button>
      </div>

      {/* Quick Presets Pills */}
      <div className="flex flex-wrap items-center justify-center gap-1.5 mt-3 pt-3 border-t border-zinc-800/80 w-full max-w-md">
        <span className="text-[11px] text-zinc-500 font-medium mr-1 hidden sm:inline">
          Atalhos:
        </span>
        <button
          type="button"
          onClick={() => applyPreset(1)}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          Hoje
        </button>
        <button
          type="button"
          onClick={() => applyPreset(7)}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          7 dias
        </button>
        <button
          type="button"
          onClick={() => applyPreset(15)}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          15 dias
        </button>
        <button
          type="button"
          onClick={() => applyPreset(30)}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          30 dias
        </button>
        <button
          type="button"
          onClick={applyThisMonth}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          Este Mês
        </button>
        <button
          type="button"
          onClick={applyLastMonth}
          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
        >
          Mês Anterior
        </button>
      </div>

      {/* Visual Interactive Calendar Modal */}
      {isVisualModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-sm w-full p-4 sm:p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div>
                <h4 className="font-extrabold text-white text-base flex items-center gap-1.5">
                  <CalendarDays className="w-4 h-4 text-purple-400" />
                  <span>Selecionar Período</span>
                </h4>
                <p className="text-[11px] text-zinc-400">
                  Clique na data inicial e depois na data final
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsVisualModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current Selection Badges */}
            <div className="flex items-center justify-between gap-2 p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Início (De)</span>
                <strong className="text-white font-extrabold">
                  {tempStart ? formatDateBR(tempStart) : 'Escolha o dia'}
                </strong>
              </div>
              <div className="text-zinc-600 font-bold">→</div>
              <div>
                <span className="text-[10px] text-zinc-500 uppercase block font-bold">Término (Até)</span>
                <strong className="text-white font-extrabold">
                  {tempEnd ? formatDateBR(tempEnd) : tempStart ? formatDateBR(tempStart) : 'Escolha o dia'}
                </strong>
              </div>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center justify-between px-1">
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 0) {
                    setCalMonth(11);
                    setCalYear((prev) => prev - 1);
                  } else {
                    setCalMonth((prev) => prev - 1);
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Mês anterior"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-xs font-bold text-white capitalize">
                {formattedMonthName}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (calMonth === 11) {
                    setCalMonth(0);
                    setCalYear((prev) => prev + 1);
                  } else {
                    setCalMonth((prev) => prev + 1);
                  }
                }}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                title="Próximo mês"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Calendar Days Grid */}
            <div className="space-y-1">
              <div className="grid grid-cols-7 gap-1 text-center">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map((d, i) => (
                  <div key={i} className="text-[10px] font-bold text-zinc-500 py-0.5">
                    {d}
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-1">
                {paddingDays.map((_, i) => (
                  <div key={`pad-${i}`} className="h-8" />
                ))}

                {monthDays.map((dayNum) => {
                  const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                  const isStart = tempStart === dateStr;
                  const isEnd = tempEnd === dateStr;
                  const effectiveEnd = tempEnd || tempStart;
                  const isInRange = tempStart && effectiveEnd && dateStr > tempStart && dateStr < effectiveEnd;
                  const isToday = dateStr === getRelativeDate(0);

                  return (
                    <button
                      key={dateStr}
                      type="button"
                      onClick={() => handleDayClickInModal(dayNum)}
                      className={`h-8 rounded-lg text-xs font-bold transition-all flex items-center justify-center cursor-pointer relative ${
                        isStart || isEnd
                          ? accentStyles.highlightSelected
                          : isInRange
                          ? accentStyles.highlightRange
                          : 'text-zinc-300 hover:bg-zinc-800 hover:text-white'
                      }`}
                    >
                      {dayNum}
                      {isToday && !isStart && !isEnd && (
                        <span className="absolute bottom-1 w-1 h-1 rounded-full bg-emerald-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsVisualModalOpen(false)}
                className="px-3 py-1.5 rounded-lg text-xs font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmVisualModal}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold ${accentStyles.buttonBg} transition-colors cursor-pointer flex items-center gap-1.5`}
              >
                <Check className="w-3.5 h-3.5" />
                <span>Aplicar Período</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
