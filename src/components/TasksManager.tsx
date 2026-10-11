import React, { useState } from 'react';
import {
  CheckSquare,
  Plus,
  Wrench,
  FileText,
  Car,
  DollarSign,
  AlertCircle,
  Calendar,
  Gauge,
  Trash2,
  CheckCircle2,
  Clock,
  Sparkles,
  Navigation,
  Settings2,
  Edit3,
  X,
  Check,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Info,
  Layers,
  Fuel,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import {
  DriverTask,
  TaskCategory,
  TaskPriority,
  DriverProfile,
  EarningsEntry,
  ExpenseEntry,
  PlatformConfig,
} from '../types';
import { formatDateBR } from '../utils/helpers';
import { getRelativeDate, PLATFORMS } from '../data/constants';
import { VehicleCostsAndMaintenance } from './VehicleCostsAndMaintenance';

interface TasksManagerProps {
  tasks: DriverTask[];
  profile: DriverProfile;
  earnings?: EarningsEntry[];
  platforms?: PlatformConfig[];
  onAddTask: (task: Omit<DriverTask, 'id' | 'createdAt'>) => void;
  onUpdateTask?: (id: string, task: Partial<DriverTask>) => void;
  onToggleTask: (id: string) => void;
  onDeleteTask: (id: string) => void;
  onUpdateProfile?: (profile: DriverProfile) => void;
  onOpenSettings?: () => void;
  onAddEarnings?: (entry: Omit<EarningsEntry, 'id' | 'createdAt'>) => void;
  onNavigateToFuel?: () => void;
  onOpenAddExpense?: (defaultData?: Partial<ExpenseEntry>) => void;
  onOpenManageFuelTypes?: () => void;
  showToast?: (msg: string) => void;
}

export const TasksManager: React.FC<TasksManagerProps> = ({
  tasks,
  profile,
  earnings = [],
  platforms = PLATFORMS,
  onAddTask,
  onUpdateTask,
  onToggleTask,
  onDeleteTask,
  onUpdateProfile,
  onOpenSettings,
  onAddEarnings,
  onNavigateToFuel,
  onOpenAddExpense,
  onOpenManageFuelTypes,
  showToast,
}) => {
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed'>('pending');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [editingTask, setEditingTask] = useState<DriverTask | null>(null);
  const [isAdjustingOdometer, setIsAdjustingOdometer] = useState(false);
  const [adjustMode, setAdjustMode] = useState<'panel' | 'km'>('panel');

  // Form states
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('manutencao');
  const [priority, setPriority] = useState<TaskPriority>('media');
  const [dueDate, setDueDate] = useState('');
  const [dueKm, setDueKm] = useState('');
  const [relativeKmInput, setRelativeKmInput] = useState('');

  // 1. Total KM driven logged across all earnings records in reports
  const entriesWithKm = earnings.filter(
    (e) => (e.kmDriven || 0) > 0 && e.includeInCalculations !== false
  );
  const totalLoggedKm = entriesWithKm.reduce((sum, e) => sum + (e.kmDriven || 0), 0);

  // 2. Base registered odometer in vehicle profile
  const baseVehicleKm = profile.vehicleCurrentKm || 0;

  // 3. Real effective odometer (Base + all logged km from rides/deliveries)
  const currentEffectiveKm = baseVehicleKm + totalLoggedKm;

  // State for adjusting odometer via a new mileage record with current date, preserving base odometer
  const [odometerDate, setOdometerDate] = useState<string>(() => getRelativeDate(0));
  const [newDashboardKm, setNewDashboardKm] = useState<string>('');
  const [addedKm, setAddedKm] = useState<string>('');
  const [odometerPlatformId, setOdometerPlatformId] = useState<string>('particular');
  const [odometerNotes, setOdometerNotes] = useState<string>('');
  const [odometerError, setOdometerError] = useState<string>('');

  const handleOpenAdjustOdometer = () => {
    const today = getRelativeDate(0);
    setOdometerDate(today);
    setAdjustMode('panel');
    const defaultTarget = currentEffectiveKm > 0 ? currentEffectiveKm + 50 : 50;
    setNewDashboardKm(defaultTarget.toString());
    setAddedKm('50');
    setOdometerPlatformId(platforms[0]?.id || 'particular');
    setOdometerNotes(`Atualização de odômetro (${defaultTarget.toLocaleString('pt-BR')} km)`);
    setOdometerError('');
    setIsAdjustingOdometer(true);
  };

  // Average daily km driven based on active logged days
  const uniqueDatesWithKm = new Set(entriesWithKm.map((e) => e.date));
  const avgKmPerDay =
    uniqueDatesWithKm.size > 0 ? Math.round(totalLoggedKm / uniqueDatesWithKm.size) : 120;

  // Pending tasks with KM limit
  const pendingKmTasks = tasks
    .filter((t) => !t.completed && t.dueKm && t.dueKm > 0)
    .map((t) => ({ ...t, kmRemaining: (t.dueKm || 0) - currentEffectiveKm }))
    .sort((a, b) => a.kmRemaining - b.kmRemaining);

  const nearestKmTask = pendingKmTasks.length > 0 ? pendingKmTasks[0] : null;

  const completedCount = tasks.filter((t) => t.completed).length;
  const pendingCount = tasks.filter((t) => !t.completed).length;
  const totalCount = tasks.length;
  const completionPercentage = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  // Handle open add task
  const handleOpenAdd = () => {
    setEditingTask(null);
    setTitle('');
    setCategory('manutencao');
    setPriority('media');
    setDueDate('');
    setDueKm('');
    setRelativeKmInput('');
    setIsAdding(true);
  };

  // Handle open edit task
  const handleOpenEdit = (task: DriverTask) => {
    setEditingTask(task);
    setTitle(task.title);
    setCategory(task.category);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setDueKm(task.dueKm ? task.dueKm.toString() : '');
    setRelativeKmInput('');
    setIsAdding(true);
  };

  const handleToggle = (id: string, isCurrentlyCompleted: boolean) => {
    if (!isCurrentlyCompleted) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.8 },
        });
      } catch (e) {
        // Safe fallback
      }
    }
    onToggleTask(id);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const parsedDueKm = dueKm ? parseInt(dueKm, 10) : undefined;

    if (editingTask && onUpdateTask) {
      onUpdateTask(editingTask.id, {
        title: title.trim(),
        category,
        priority,
        dueDate: dueDate || undefined,
        dueKm: parsedDueKm,
      });
    } else {
      onAddTask({
        title: title.trim(),
        category,
        priority,
        dueDate: dueDate || undefined,
        dueKm: parsedDueKm,
        completed: false,
      });
    }

    setTitle('');
    setDueDate('');
    setDueKm('');
    setRelativeKmInput('');
    setEditingTask(null);
    setIsAdding(false);
  };

  const handleApplyRelativeKm = (extraKm: number) => {
    const target = currentEffectiveKm + extraKm;
    setDueKm(target.toString());
    setRelativeKmInput('');
  };

  const handleSaveOdometer = (e: React.FormEvent) => {
    e.preventDefault();
    setOdometerError('');

    let kmToRegister = 0;
    let targetOdometer = currentEffectiveKm;

    if (adjustMode === 'panel') {
      const parsedDashboard = parseInt(newDashboardKm, 10);
      if (isNaN(parsedDashboard) || parsedDashboard <= 0) {
        setOdometerError('Informe um valor de odômetro válido.');
        return;
      }
      if (parsedDashboard <= currentEffectiveKm) {
        setOdometerError(
          `O odômetro informado (${parsedDashboard.toLocaleString('pt-BR')} km) deve ser maior que o odômetro atual (${currentEffectiveKm.toLocaleString('pt-BR')} km) para gerar o registro de atualização. Se você precisa corrigir o Odômetro Base inicial cadastrado, utilize o botão abaixo para abrir as Configurações do Veículo.`
        );
        return;
      }
      kmToRegister = parsedDashboard - currentEffectiveKm;
      targetOdometer = parsedDashboard;
    } else {
      const parsedExtra = parseInt(addedKm, 10);
      if (isNaN(parsedExtra) || parsedExtra <= 0) {
        setOdometerError('Informe uma quantidade de quilômetros maior que zero.');
        return;
      }
      kmToRegister = parsedExtra;
      targetOdometer = currentEffectiveKm + parsedExtra;
    }

    if (onAddEarnings) {
      // Cria o registro na data atual sem alterar o odômetro base
      onAddEarnings({
        date: odometerDate || getRelativeDate(0),
        platformId: odometerPlatformId || platforms[0]?.id || 'particular',
        grossAmount: 0,
        ridesCount: 0,
        onlineHours: 0,
        kmDriven: kmToRegister,
        tipsOrBonus: 0,
        shift: 'integral',
        notes:
          odometerNotes.trim() ||
          `Atualização de odômetro: ${targetOdometer.toLocaleString('pt-BR')} km (+${kmToRegister} km)`,
        includeInCalculations: true,
      });
    }

    try {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    } catch {}

    setIsAdjustingOdometer(false);
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === 'pending' && task.completed) return false;
    if (filter === 'completed' && !task.completed) return false;
    if (categoryFilter !== 'all' && task.category !== categoryFilter) return false;
    return true;
  });

  const getCategoryBadge = (cat: TaskCategory) => {
    switch (cat) {
      case 'manutencao':
        return {
          label: 'Manutenção',
          icon: <Wrench className="w-3 h-3 text-orange-400" />,
          color: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
        };
      case 'documentos':
        return {
          label: 'Documentos',
          icon: <FileText className="w-3 h-3 text-sky-400" />,
          color: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
        };
      case 'veiculo':
        return {
          label: 'Veículo',
          icon: <Car className="w-3 h-3 text-emerald-400" />,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'financeiro':
        return {
          label: 'Financeiro',
          icon: <DollarSign className="w-3 h-3 text-amber-400" />,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      default:
        return {
          label: 'Outro',
          icon: <AlertCircle className="w-3 h-3 text-zinc-400" />,
          color: 'text-zinc-400 bg-zinc-800 border-zinc-700',
        };
    }
  };

  const getPriorityBadge = (p: TaskPriority) => {
    switch (p) {
      case 'alta':
        return (
          <span className="text-[10px] font-black uppercase text-rose-400 bg-rose-500/20 px-2 py-0.5 rounded-full border border-rose-500/30">
            Alta
          </span>
        );
      case 'media':
        return (
          <span className="text-[10px] font-bold uppercase text-amber-400 bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
            Média
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-medium uppercase text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded-full">
            Baixa
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner with Stats & Vehicle Km Sync */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center gap-1">
                <CheckSquare className="w-3 h-3" />
                Gerenciador de Tarefas & Manutenção
              </span>
              <span className="text-xs text-zinc-400">
                {profile.vehicleModel || 'Veículo'} • {profile.vehiclePlate || 'Sem placa'}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Checklist, Prazos & Odômetro Inteligente
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 mt-1 max-w-xl">
              Contabilização em tempo real dos quilômetros rodados nos relatórios somados ao odômetro
              do carro para verificar com precisão o momento de cada manutenção preventiva.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-auto">
            <button
              id="btn-adjust-odometer"
              onClick={handleOpenAdjustOdometer}
              className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 hover:border-zinc-700 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              title="Ajustar odômetro do veículo"
            >
              <Edit3 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Ajustar Odômetro</span>
            </button>

            {onNavigateToFuel && (
              <button
                type="button"
                onClick={onNavigateToFuel}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-amber-400 border border-amber-500/30 hover:border-amber-500/50 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Consultar telemetria de consumo de combustível"
              >
                <Fuel className="w-3.5 h-3.5" />
                <span>Consumo Km/L</span>
              </button>
            )}

            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 p-2.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
                title="Configurações do Veículo"
              >
                <Settings2 className="w-4 h-4" />
              </button>
            )}

            <button
              id="btn-add-task-open"
              onClick={handleOpenAdd}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-600 active:scale-95 text-zinc-950 font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm transition-all shadow-md shadow-sky-500/20 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Nova Tarefa</span>
            </button>
          </div>
        </div>

        {/* Live Calculation Formula Card */}
        <div className="mt-5 p-3.5 rounded-xl bg-gradient-to-r from-zinc-950 via-zinc-950 to-emerald-950/20 border border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <span className="p-1 rounded-md bg-emerald-500/20 text-emerald-400 shrink-0">
              <Gauge className="w-4 h-4" />
            </span>
            <div className="flex flex-wrap items-center gap-2 font-medium">
              <span className="text-zinc-400">Cálculo do Odômetro:</span>
              <span className="px-2 py-0.5 rounded-md bg-zinc-900 border border-zinc-700 font-bold text-white">
                Base: {baseVehicleKm.toLocaleString('pt-BR')} km
              </span>
              <span className="text-emerald-400 font-bold">+</span>
              <span className="px-2 py-0.5 rounded-md bg-sky-950/60 border border-sky-500/40 font-bold text-sky-400">
                Relatórios: {totalLoggedKm.toLocaleString('pt-BR')} km rodados
              </span>
              <span className="text-emerald-400 font-bold">=</span>
              <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/20 border border-emerald-500/40 font-black text-emerald-300 text-sm">
                Odômetro Atual: {currentEffectiveKm.toLocaleString('pt-BR')} km
              </span>
            </div>
          </div>

          <div className="text-[11px] text-zinc-400 flex items-center gap-1.5 self-end md:self-auto shrink-0">
            <Clock className="w-3.5 h-3.5 text-zinc-500" />
            <span>{entriesWithKm.length} lançamentos contabilizados no app</span>
          </div>
        </div>

        {/* Telemetry Dashboard: 4 Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
          {/* Card 1: Odômetro Atual Real */}
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-emerald-500/30 flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider">
                  Odômetro Atual
                </span>
                <span className="text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-1.5 py-0.2 rounded font-bold">
                  Real Sincronizado
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-white mt-0.5 flex items-baseline gap-1">
                {currentEffectiveKm.toLocaleString('pt-BR')}
                <span className="text-xs font-bold text-zinc-400">km</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                Base ({baseVehicleKm.toLocaleString('pt-BR')}) + {totalLoggedKm.toLocaleString('pt-BR')} km
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0 text-emerald-400">
              <Gauge className="w-5 h-5" />
            </div>
          </div>

          {/* Card 2: Total KM Registrado nos Relatórios */}
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-sky-500/30 flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0">
              <span className="text-[11px] font-bold text-sky-400 block uppercase tracking-wider">
                KM Rodados no App
              </span>
              <div className="text-xl sm:text-2xl font-black text-sky-400 mt-0.5 flex items-baseline gap-1">
                {totalLoggedKm.toLocaleString('pt-BR')}
                <span className="text-xs font-bold text-zinc-400">km</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                Soma de todos os relatórios de corridas
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400">
              <Navigation className="w-5 h-5" />
            </div>
          </div>

          {/* Card 3: Média Diária de KM */}
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                Ritmo Médio Diário
              </span>
              <div className="text-xl sm:text-2xl font-black text-amber-400 mt-0.5 flex items-baseline gap-1">
                ~{avgKmPerDay.toLocaleString('pt-BR')}
                <span className="text-xs font-bold text-zinc-400">km/dia</span>
              </div>
              <div className="text-[10px] text-zinc-400 mt-0.5 truncate">
                {uniqueDatesWithKm.size} dias com registros com KM
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0 text-amber-400">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>

          {/* Card 4: Próximo Lembrete por KM */}
          <div className="bg-zinc-950/90 p-3.5 rounded-xl border border-zinc-800 flex items-center justify-between gap-3 shadow-sm">
            <div className="min-w-0">
              <span className="text-[11px] font-semibold text-zinc-400 block uppercase tracking-wider">
                Próxima Manutenção
              </span>
              {nearestKmTask ? (
                <>
                  <div
                    className={`text-sm sm:text-base font-black truncate mt-0.5 ${
                      nearestKmTask.kmRemaining <= 0
                        ? 'text-rose-400'
                        : nearestKmTask.kmRemaining <= 1000
                        ? 'text-amber-400'
                        : 'text-white'
                    }`}
                  >
                    {nearestKmTask.title}
                  </div>
                  <div className="text-[10px] font-semibold mt-0.5 truncate">
                    {nearestKmTask.kmRemaining <= 0 ? (
                      <span className="text-rose-400 font-bold">
                        Vencida há {Math.abs(nearestKmTask.kmRemaining).toLocaleString('pt-BR')} km!
                      </span>
                    ) : nearestKmTask.kmRemaining <= 1000 ? (
                      <span className="text-amber-400 font-bold">
                        Atenção: faltam {nearestKmTask.kmRemaining.toLocaleString('pt-BR')} km!
                      </span>
                    ) : (
                      <span className="text-emerald-400">
                        Aos {nearestKmTask.dueKm?.toLocaleString('pt-BR')} km (faltam{' '}
                        {nearestKmTask.kmRemaining.toLocaleString('pt-BR')} km)
                      </span>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-sm font-bold text-zinc-300 mt-0.5">Nenhuma tarefa por KM</div>
                  <div className="text-[10px] text-zinc-500 mt-0.5">Cadastre lembretes de óleo ou revisão</div>
                </>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center shrink-0 text-purple-400">
              <Wrench className="w-5 h-5" />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-zinc-300">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Tarefas Concluídas:</span>
            <strong className="text-white font-bold">
              {completedCount} de {totalCount} concluídas
            </strong>
            <span className="text-zinc-500">({completionPercentage}%)</span>
          </div>
          <div className="w-full sm:w-64 bg-zinc-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Adjust Odometer Modal */}
      {isAdjustingOdometer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg p-5 sm:p-6 shadow-2xl space-y-4 my-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <Gauge className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Ajustar Odômetro do Veículo</h3>
                  <p className="text-xs text-zinc-400">
                    Cria um registro na data informada sem alterar o odômetro base
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustingOdometer(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Base Odometer Protected Info Badge */}
            <div className="bg-emerald-950/30 border border-emerald-500/30 rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                <span>Odômetro Base Inicial Protegido</span>
              </div>
              <p className="text-zinc-300 leading-relaxed text-[11px]">
                O seu odômetro base de cadastro (
                <strong className="text-emerald-300 font-bold">{baseVehicleKm.toLocaleString('pt-BR')} km</strong>
                ) permanecerá <strong>intacto e preservado</strong>. A atualização será feita através de um novo
                registro de quilometragem na data indicada, mantendo todo o seu histórico protegido.
              </p>
            </div>

            {/* Current Breakdown Cards */}
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">Base Inicial</span>
                <strong className="text-xs sm:text-sm text-white font-bold">
                  {baseVehicleKm.toLocaleString('pt-BR')} km
                </strong>
                <span className="text-[9px] text-emerald-400 block font-medium">Intacto</span>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                <span className="text-[10px] text-zinc-500 block uppercase font-bold">KM nos Relatórios</span>
                <strong className="text-xs sm:text-sm text-sky-400 font-bold">
                  +{totalLoggedKm.toLocaleString('pt-BR')} km
                </strong>
                <span className="text-[9px] text-zinc-400 block font-medium">Lançados</span>
              </div>
              <div className="bg-zinc-950/80 p-2.5 rounded-xl border border-emerald-500/40">
                <span className="text-[10px] text-emerald-400 block uppercase font-bold">Odômetro Atual</span>
                <strong className="text-xs sm:text-sm text-emerald-300 font-bold">
                  {currentEffectiveKm.toLocaleString('pt-BR')} km
                </strong>
                <span className="text-[9px] text-zinc-400 block font-medium">Efetivo</span>
              </div>
            </div>

            {/* Mode Switcher */}
            <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1 rounded-xl border border-zinc-800 text-xs font-semibold">
              <button
                type="button"
                onClick={() => {
                  setAdjustMode('panel');
                  setOdometerError('');
                }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer text-center ${
                  adjustMode === 'panel'
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                1. Pelo Odômetro do Painel
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdjustMode('km');
                  setOdometerError('');
                }}
                className={`py-2 px-3 rounded-lg transition-all cursor-pointer text-center ${
                  adjustMode === 'km'
                    ? 'bg-emerald-500 text-zinc-950 font-bold shadow'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                2. Pelos KM Rodados Hoje
              </button>
            </div>

            <form onSubmit={handleSaveOdometer} className="space-y-3.5">
              {/* Mileage Input */}
              {adjustMode === 'panel' ? (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Qual quilometragem está marcando agora no painel do carro?
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={currentEffectiveKm + 1}
                      step="1"
                      value={newDashboardKm}
                      onChange={(e) => {
                        setNewDashboardKm(e.target.value);
                        setOdometerError('');
                      }}
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                      placeholder={`Ex: ${currentEffectiveKm + 80}`}
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      km
                    </span>
                  </div>

                  {/* Dynamic calculation result */}
                  {(() => {
                    const parsed = parseInt(newDashboardKm, 10);
                    const diff = !isNaN(parsed) && parsed > currentEffectiveKm ? parsed - currentEffectiveKm : 0;
                    return (
                      <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl mt-2 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-300">
                          <span>Odômetro atual do app:</span>
                          <span className="font-bold">{currentEffectiveKm.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold border-t border-zinc-800/80 pt-1">
                          <span>KM a lançar no novo registro:</span>
                          <span>+{diff.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 pt-0.5">
                          Novo odômetro efetivo após salvar:{' '}
                          <strong className="text-white">
                            {(isNaN(parsed) ? currentEffectiveKm : parsed).toLocaleString('pt-BR')} km
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Quantos KM você rodou hoje para somar ao odômetro?
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min="1"
                      step="1"
                      value={addedKm}
                      onChange={(e) => {
                        setAddedKm(e.target.value);
                        setOdometerError('');
                      }}
                      required
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-base focus:outline-none focus:border-emerald-500"
                      placeholder="Ex: 85"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      km
                    </span>
                  </div>

                  {/* Dynamic calculation result */}
                  {(() => {
                    const parsed = parseInt(addedKm, 10);
                    const extra = !isNaN(parsed) && parsed > 0 ? parsed : 0;
                    return (
                      <div className="p-3 bg-zinc-950/70 border border-zinc-800 rounded-xl mt-2 text-xs space-y-1">
                        <div className="flex justify-between text-zinc-300">
                          <span>Odômetro atual do app:</span>
                          <span className="font-bold">{currentEffectiveKm.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div className="flex justify-between text-emerald-400 font-bold border-t border-zinc-800/80 pt-1">
                          <span>KM a lançar no novo registro:</span>
                          <span>+{extra.toLocaleString('pt-BR')} km</span>
                        </div>
                        <div className="text-[11px] text-zinc-400 pt-0.5">
                          Novo odômetro efetivo após salvar:{' '}
                          <strong className="text-white">
                            {(currentEffectiveKm + extra).toLocaleString('pt-BR')} km
                          </strong>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Record Date (Defaults to current date) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-sky-400" />
                    Data do Registro
                  </label>
                  <input
                    type="date"
                    value={odometerDate}
                    onChange={(e) => setOdometerDate(e.target.value)}
                    required
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-emerald-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-0.5 block">
                    {odometerDate === getRelativeDate(0) ? 'Hoje (Data Atual)' : formatDateBR(odometerDate)}
                  </span>
                </div>

                {/* Platform */}
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Car className="w-3.5 h-3.5 text-amber-400" />
                    Plataforma / Finalidade
                  </label>
                  <select
                    value={odometerPlatformId}
                    onChange={(e) => setOdometerPlatformId(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs font-medium focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="particular">Particular / Geral / Fora de App</option>
                    {platforms.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Observações do Registro (Opcional)
                </label>
                <input
                  type="text"
                  value={odometerNotes}
                  onChange={(e) => setOdometerNotes(e.target.value)}
                  placeholder="Ex: Atualização do odômetro no painel"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs placeholder-zinc-600 focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Error Message */}
              {odometerError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{odometerError}</span>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                {onOpenSettings ? (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAdjustingOdometer(false);
                      onOpenSettings();
                    }}
                    className="text-[11px] text-zinc-400 hover:text-emerald-400 underline underline-offset-2 transition-colors cursor-pointer"
                  >
                    Editar Odômetro Base Inicial
                  </button>
                ) : (
                  <div />
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAdjustingOdometer(false)}
                    className="px-3.5 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 text-xs font-bold rounded-xl shadow-md shadow-emerald-500/20 cursor-pointer transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <Check className="w-4 h-4 stroke-[3]" />
                    <span>Salvar e Criar Registro</span>
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Consumo, Custos por KM & Plano de Manutenções (Preventiva, Corretiva, Preditiva) */}
      <VehicleCostsAndMaintenance
        profile={profile}
        onUpdateProfile={onUpdateProfile || (() => {})}
        currentEffectiveKm={currentEffectiveKm}
        onOpenAddExpense={onOpenAddExpense}
        onAddTask={onAddTask}
        onOpenManageFuelTypes={onOpenManageFuelTypes}
        onNavigateToFuel={onNavigateToFuel}
        showToast={showToast}
      />

      {/* Add / Edit Task Drawer / Form */}
      {isAdding && (
        <form
          onSubmit={handleSubmit}
          className="bg-zinc-900 border border-sky-500/40 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-4 animate-in fade-in slide-in-from-top-4 duration-200"
        >
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="font-bold text-white text-base flex items-center gap-2">
              <Plus className="w-4 h-4 text-sky-400" />
              {editingTask ? 'Editar Tarefa ou Lembrete' : 'Cadastrar Nova Tarefa ou Lembrete'}
            </h3>
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingTask(null);
              }}
              className="text-zinc-400 hover:text-white text-xs cursor-pointer"
            >
              Cancelar
            </button>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Descrição da Tarefa *
            </label>
            <input
              id="input-task-title"
              type="text"
              placeholder="ex: Troca de óleo 5W30 e filtro de combustível"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-sky-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Categoria</label>
              <select
                id="select-task-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as TaskCategory)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="manutencao">🔧 Manutenção</option>
                <option value="documentos">📄 Documentos / Seguro</option>
                <option value="veiculo">🚗 Cuidados com o Carro</option>
                <option value="financeiro">💵 Financeiro</option>
                <option value="outro">📌 Outro</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">Prioridade</label>
              <select
                id="select-task-priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
              >
                <option value="alta">🔴 Alta (Urgente)</option>
                <option value="media">🟡 Média</option>
                <option value="baixa">🟢 Baixa</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Data Limite (opcional)
              </label>
              <input
                id="input-task-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-sky-500"
              />
            </div>
          </div>

          {/* KM Limite Section with Live Telemetry Reference */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/90 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-zinc-800 pb-2">
              <label className="block text-xs font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-4 h-4 text-emerald-400" />
                Odômetro Alvo para Execução (KM Limite)
              </label>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-zinc-400">Odômetro Atual Real:</span>
                <span className="font-black text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  {currentEffectiveKm.toLocaleString('pt-BR')} km
                </span>
              </div>
            </div>

            {/* Breakdown summary */}
            <div className="text-[11px] text-zinc-400 flex flex-wrap items-center gap-2">
              <span>Odômetro Base: <strong className="text-white">{baseVehicleKm.toLocaleString('pt-BR')} km</strong></span>
              <span>•</span>
              <span>KM Rodados nos Relatórios: <strong className="text-sky-400">+{totalLoggedKm.toLocaleString('pt-BR')} km</strong></span>
              <span>•</span>
              <span>Soma Atual: <strong className="text-emerald-400">{currentEffectiveKm.toLocaleString('pt-BR')} km</strong></span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-end">
              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  1. Digite a quilometragem alvo do odômetro:
                </label>
                <div className="relative">
                  <input
                    id="input-task-km"
                    type="number"
                    min="0"
                    placeholder={`Ex: ${(currentEffectiveKm + 10000).toString()}`}
                    value={dueKm}
                    onChange={(e) => setDueKm(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-sky-500"
                  />
                  <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                    km
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  2. Ou defina daqui a quantos KM rodados:
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="number"
                      min="1"
                      step="any"
                      placeholder="Ex: 5000"
                      value={relativeKmInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setRelativeKmInput(val);
                        const num = parseInt(val, 10);
                        if (!isNaN(num) && num > 0) {
                          setDueKm((currentEffectiveKm + num).toString());
                        }
                      }}
                      className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-sky-500"
                    />
                    <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400">
                      + km
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Suggestions calculated from current effective odometer */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] text-zinc-400 font-medium block">
                Atalhos rápidos a partir do odômetro atual ({currentEffectiveKm.toLocaleString('pt-BR')} km):
              </span>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleApplyRelativeKm(3000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +3.000 km ({(currentEffectiveKm + 3000).toLocaleString('pt-BR')})
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRelativeKm(5000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +5.000 km (Filtros / Pneus)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRelativeKm(10000)}
                  className="px-2.5 py-1 rounded-lg bg-sky-950/60 hover:bg-sky-900/60 text-sky-400 border border-sky-500/40 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  +10.000 km (Troca de Óleo)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRelativeKm(20000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +20.000 km (Velas e Pastilhas)
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyRelativeKm(40000)}
                  className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  +40.000 km (Revisão Geral)
                </button>
              </div>
            </div>

            {/* Dynamic Validation & Forecast */}
            {dueKm && (
              <div className="pt-1">
                {parseInt(dueKm, 10) <= currentEffectiveKm ? (
                  <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 p-3 rounded-xl flex items-start gap-2.5">
                    <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                    <div>
                      <strong className="block text-rose-400 font-bold">Tarefa já vencida pelo odômetro atual!</strong>
                      <span>
                        O odômetro atual do carro ({currentEffectiveKm.toLocaleString('pt-BR')} km) já ultrapassou
                        o KM alvo ({parseInt(dueKm, 10).toLocaleString('pt-BR')} km) por{' '}
                        <strong>{(currentEffectiveKm - parseInt(dueKm, 10)).toLocaleString('pt-BR')} km</strong>.
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400 mt-0.5" />
                    <div>
                      <strong className="block text-emerald-400 font-bold">Quilometragem Futura Válida</strong>
                      <span>
                        Faltam <strong>{(parseInt(dueKm, 10) - currentEffectiveKm).toLocaleString('pt-BR')} km</strong>{' '}
                        a serem rodados no app para a execução (~
                        {Math.max(1, Math.round((parseInt(dueKm, 10) - currentEffectiveKm) / avgKmPerDay))} dias
                        no seu ritmo diário médio de {avgKmPerDay} km/dia).
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => {
                setIsAdding(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
            >
              Cancelar
            </button>
            <button
              id="btn-save-task"
              type="submit"
              className="px-5 py-2 bg-sky-500 hover:bg-sky-600 text-zinc-950 text-xs font-bold rounded-xl shadow-md shadow-sky-500/20 cursor-pointer"
            >
              {editingTask ? 'Atualizar Tarefa' : 'Adicionar Tarefa'}
            </button>
          </div>
        </form>
      )}

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl text-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto">
          <button
            onClick={() => setFilter('pending')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'pending'
                ? 'bg-sky-500/20 text-sky-400 border border-sky-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Pendentes ({pendingCount})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'completed'
                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Concluídas ({completedCount})
          </button>
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Todas ({totalCount})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-zinc-500 hidden sm:inline">Categoria:</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-lg px-2.5 py-1.5 text-zinc-300 text-xs focus:outline-none"
          >
            <option value="all">Todas as Categorias</option>
            <option value="manutencao">Manutenção</option>
            <option value="documentos">Documentos</option>
            <option value="veiculo">Veículo</option>
            <option value="financeiro">Financeiro</option>
            <option value="outro">Outro</option>
          </select>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-3">
        {filteredTasks.length === 0 ? (
          <div className="text-center py-12 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl">
            <CheckCircle2 className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
            <p className="text-zinc-400 font-semibold text-sm">Nenhuma tarefa encontrada neste filtro.</p>
            <p className="text-zinc-600 text-xs mt-1">Parabéns! Todas as pendências estão em dia.</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const catBadge = getCategoryBadge(task.category);
            const kmRemaining = task.dueKm ? task.dueKm - currentEffectiveKm : null;
            const isKmClose = kmRemaining !== null && kmRemaining <= 1000 && kmRemaining > 0;
            const isKmOverdue = kmRemaining !== null && kmRemaining <= 0;

            // Progress bar towards target KM
            let progressPercent = 0;
            if (task.dueKm && task.dueKm > 0) {
              // Calculate progress considering a standard interval (e.g. 10.000 km prior to target)
              const interval = 10000;
              const startKm = Math.max(0, task.dueKm - interval);
              if (currentEffectiveKm >= task.dueKm) {
                progressPercent = 100;
              } else if (currentEffectiveKm > startKm) {
                progressPercent = Math.min(100, Math.round(((currentEffectiveKm - startKm) / interval) * 100));
              } else {
                progressPercent = Math.min(100, Math.round((currentEffectiveKm / task.dueKm) * 100));
              }
            }

            return (
              <div
                key={task.id}
                className={`p-4 sm:p-5 rounded-2xl border transition-all ${
                  task.completed
                    ? 'bg-zinc-950/40 border-zinc-900 opacity-60'
                    : isKmOverdue
                    ? 'bg-rose-950/20 border-rose-500/40 shadow-sm'
                    : isKmClose
                    ? 'bg-amber-950/20 border-amber-500/40 shadow-sm'
                    : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start sm:items-center justify-between gap-3">
                  {/* Left check and info */}
                  <div className="flex items-start sm:items-center gap-3.5 flex-1 min-w-0">
                    <button
                      onClick={() => handleToggle(task.id, task.completed)}
                      className={`mt-0.5 sm:mt-0 w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer shrink-0 ${
                        task.completed
                          ? 'bg-emerald-500 border-emerald-400 text-zinc-950 shadow-sm shadow-emerald-500/30'
                          : 'border-zinc-700 hover:border-sky-400 bg-zinc-950 text-transparent'
                      }`}
                      title={task.completed ? 'Marcar como pendente' : 'Marcar como concluída'}
                    >
                      <CheckSquare className="w-4 h-4 stroke-[3]" />
                    </button>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span
                          className={`text-sm sm:text-base font-bold truncate ${
                            task.completed ? 'line-through text-zinc-500' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      {/* Metadata tags */}
                      <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-zinc-400">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md border text-[11px] font-medium ${catBadge.color}`}
                        >
                          {catBadge.icon}
                          {catBadge.label}
                        </span>

                        {task.dueDate && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 bg-zinc-950 px-2 py-0.5 rounded-md border border-zinc-800">
                            <Calendar className="w-3 h-3 text-zinc-500" />
                            {formatDateBR(task.dueDate)}
                          </span>
                        )}

                        {task.completed && task.completedAt && (
                          <span className="text-[10px] text-emerald-400 flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                            <Clock className="w-3 h-3" /> Concluído em {formatDateBR(task.completedAt.split('T')[0])}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions: Edit and Delete */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(task)}
                      className="p-1.5 text-zinc-400 hover:text-sky-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Editar tarefa"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => onDeleteTask(task.id)}
                      className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                      title="Excluir tarefa"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Prominent KM Telemetry Box for tasks with dueKm */}
                {task.dueKm && (
                  <div className="mt-3 pt-3 border-t border-zinc-800/80 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="p-1 rounded-md bg-zinc-950 border border-zinc-800 text-emerald-400">
                          <Gauge className="w-3.5 h-3.5" />
                        </span>
                        <span className="font-bold text-white">
                          Odômetro Alvo: {task.dueKm.toLocaleString('pt-BR')} km
                        </span>
                        <span className="text-zinc-500 hidden sm:inline">•</span>
                        <span className="text-zinc-400 hidden sm:inline text-[11px]">
                          Odômetro atual: <strong className="text-emerald-400">{currentEffectiveKm.toLocaleString('pt-BR')} km</strong>
                        </span>
                      </div>

                      <div>
                        {task.completed ? (
                          <span className="text-[11px] font-semibold text-zinc-500">
                            Manutenção finalizada aos {task.dueKm.toLocaleString('pt-BR')} km
                          </span>
                        ) : isKmOverdue ? (
                          <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 border border-rose-500/40 text-[11px] font-black flex items-center gap-1">
                            <AlertTriangle className="w-3 h-3" />
                            Vencida há {Math.abs(kmRemaining!).toLocaleString('pt-BR')} km!
                          </span>
                        ) : isKmClose ? (
                          <span className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[11px] font-bold flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            Atenção: faltam só {kmRemaining!.toLocaleString('pt-BR')} km!
                          </span>
                        ) : (
                          <span className="text-emerald-400 font-bold text-[11px] flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Faltam {kmRemaining!.toLocaleString('pt-BR')} km rodados (~{Math.max(1, Math.round(kmRemaining! / avgKmPerDay))} dias)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Progress Bar towards target KM */}
                    {!task.completed && (
                      <div className="space-y-1">
                        <div className="w-full bg-zinc-950 border border-zinc-800 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              isKmOverdue
                                ? 'bg-rose-500'
                                : isKmClose
                                ? 'bg-amber-400'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-zinc-500">
                          <span>Painel: {currentEffectiveKm.toLocaleString('pt-BR')} km</span>
                          <span>Alvo: {task.dueKm.toLocaleString('pt-BR')} km</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
