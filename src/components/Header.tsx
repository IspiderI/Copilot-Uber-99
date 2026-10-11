import React from 'react';
import { Gauge, DollarSign, CheckSquare, BarChart3, Settings, Plus, Flame, Car, Fuel } from 'lucide-react';
import { DriverProfile } from '../types';
import { formatCurrency } from '../utils/helpers';

export type AppNavTab = 'overview' | 'expenses' | 'fuel' | 'tasks' | 'reports';

interface HeaderProps {
  activeTab: AppNavTab;
  setActiveTab: (tab: AppNavTab) => void;
  profile: DriverProfile;
  todayGross: number;
  onOpenAddEarnings: () => void;
  onOpenSettings: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  profile,
  todayGross,
  onOpenAddEarnings,
  onOpenSettings,
}) => {
  const goalProgress = Math.min(100, Math.round((todayGross / (profile.targetDailyGross || 1)) * 100));

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/95 backdrop-blur-md border-b border-zinc-800/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand: Rosida - Motorista */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-extrabold text-xl tracking-tighter">
              <Car className="w-5 h-5 fill-white text-zinc-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                  Rosida
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  Motorista
                </span>
              </div>
              <p className="text-xs text-zinc-400 hidden sm:block">Gestão de Ganhos & Veículo</p>
            </div>
          </div>

          {/* Center: Daily Goal Quick Gauge (Desktop/Tablet) */}
          <div className="hidden md:flex items-center gap-4 bg-zinc-900/80 border border-zinc-800 rounded-xl px-4 py-2">
            <div className="flex items-center gap-2 text-zinc-300 text-xs">
              <Flame className={`w-4 h-4 ${goalProgress >= 100 ? 'text-amber-400 fill-amber-400' : 'text-emerald-400'}`} />
              <span>Meta Hoje:</span>
              <strong className="text-white font-semibold">{formatCurrency(todayGross)}</strong>
              <span className="text-zinc-500">/ {formatCurrency(profile.targetDailyGross)}</span>
            </div>
            <div className="w-28 bg-zinc-800 rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 rounded-full ${
                  goalProgress >= 100 ? 'bg-gradient-to-r from-emerald-500 to-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-emerald-400">{goalProgress}%</span>
          </div>

          {/* Right Action buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              id="btn-quick-add-earnings"
              onClick={onOpenAddEarnings}
              className="flex items-center gap-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-zinc-950 font-bold px-3.5 py-2 rounded-xl text-sm transition-all shadow-md shadow-emerald-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span className="hidden xs:inline sm:inline">Lançar Ganhos</span>
              <span className="xs:hidden sm:hidden">Lançar</span>
            </button>

            <button
              id="btn-open-settings"
              onClick={onOpenSettings}
              className="p-2.5 text-zinc-300 hover:text-white bg-zinc-900 sm:bg-transparent hover:bg-zinc-800 border border-zinc-800 sm:border-transparent rounded-xl transition-all cursor-pointer flex items-center justify-center"
              title="Configurações e Veículo"
              aria-label="Abrir configurações e detalhes do veículo"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs (Calculadora / Semáforo removed) */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto py-2 border-t border-zinc-800/50 no-scrollbar text-sm">
          <button
            id="tab-overview"
            onClick={() => setActiveTab('overview')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Gauge className="w-4 h-4 text-emerald-400" />
            <span>Ganhos do Dia</span>
          </button>

          <button
            id="tab-expenses"
            onClick={() => setActiveTab('expenses')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'expenses'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <DollarSign className="w-4 h-4 text-rose-400" />
            <span>Despesas</span>
          </button>

          <button
            id="tab-fuel"
            onClick={() => setActiveTab('fuel')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'fuel'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <Fuel className="w-4 h-4 text-amber-400" />
            <span>Consumo Km/L</span>
          </button>

          <button
            id="tab-tasks"
            onClick={() => setActiveTab('tasks')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'tasks'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <CheckSquare className="w-4 h-4 text-sky-400" />
            <span>Tarefas & Manutenções</span>
          </button>

          <button
            id="tab-reports"
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium whitespace-nowrap transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-zinc-800 text-white shadow-sm border border-zinc-700'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-900'
            }`}
          >
            <BarChart3 className="w-4 h-4 text-purple-400" />
            <span>Relatórios Automáticos</span>
          </button>
        </nav>
      </div>
    </header>
  );
};
