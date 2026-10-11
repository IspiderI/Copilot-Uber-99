import React, { useState, useEffect } from 'react';
import { Header, AppNavTab } from './components/Header';
import { DayOverview } from './components/DayOverview';
import { ExpensesView } from './components/ExpensesView';
import { TasksManager } from './components/TasksManager';
import { ReportsView } from './components/ReportsView';
import { FuelConsumptionView } from './components/FuelConsumptionView';
import { QuickAddEarningsModal } from './components/QuickAddEarningsModal';
import { QuickAddExpenseModal } from './components/QuickAddExpenseModal';
import { VehicleSettingsModal } from './components/VehicleSettingsModal';
import { ManagePlatformsModal } from './components/ManagePlatformsModal';
import { ManageExpenseCategoriesModal } from './components/ManageExpenseCategoriesModal';
import { ManageFuelTypesModal } from './components/ManageFuelTypesModal';
import { ConfirmModal } from './components/ConfirmModal';
import {
  EarningsEntry,
  ExpenseEntry,
  DriverTask,
  DriverProfile,
  PlatformConfig,
  ExpenseCategoryConfig,
  FuelTypeConfig,
} from './types';
import {
  DEFAULT_PROFILE,
  INITIAL_EARNINGS,
  INITIAL_EXPENSES,
  INITIAL_TASKS,
  PLATFORMS,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_FUEL_TYPES,
  getRelativeDate,
} from './data/constants';
import { formatLocalDate, parseBRLDecimal } from './utils/helpers';
import { Plus, Check } from 'lucide-react';

export default function App() {
  // Navigation & Date
  const [activeTab, setActiveTab] = useState<AppNavTab>('overview');
  const [selectedDate, setSelectedDate] = useState<string>(getRelativeDate(0));
  const [customStartDate, setCustomStartDate] = useState<string>(() => getRelativeDate(7));
  const [customEndDate, setCustomEndDate] = useState<string>(() => getRelativeDate(0));

  // Shared platform filter across all views (defaults to all platforms)
  const [selectedPlatformIds, setSelectedPlatformIds] = useState<string[]>(() =>
    PLATFORMS.map((p) => p.id)
  );

  // Persistence State
  const [profile, setProfile] = useState<DriverProfile>(() => {
    try {
      const saved = localStorage.getItem('rosida_profile') || localStorage.getItem('zeca_profile');
      return saved ? JSON.parse(saved) : DEFAULT_PROFILE;
    } catch {
      return DEFAULT_PROFILE;
    }
  });

  const [platforms, setPlatforms] = useState<PlatformConfig[]>(() => {
    try {
      const saved = localStorage.getItem('rosida_platforms');
      return saved ? JSON.parse(saved) : PLATFORMS;
    } catch {
      return PLATFORMS;
    }
  });

  const [expenseCategories, setExpenseCategories] = useState<ExpenseCategoryConfig[]>(() => {
    try {
      const saved = localStorage.getItem('rosida_expense_categories');
      return saved ? JSON.parse(saved) : DEFAULT_EXPENSE_CATEGORIES;
    } catch {
      return DEFAULT_EXPENSE_CATEGORIES;
    }
  });

  const [fuelTypes, setFuelTypes] = useState<FuelTypeConfig[]>(() => {
    try {
      const saved = localStorage.getItem('rosida_fuel_types');
      return saved ? JSON.parse(saved) : DEFAULT_FUEL_TYPES;
    } catch {
      return DEFAULT_FUEL_TYPES;
    }
  });

  const [earnings, setEarnings] = useState<EarningsEntry[]>(() => {
    try {
      const saved = localStorage.getItem('rosida_earnings') || localStorage.getItem('zeca_earnings');
      return saved ? JSON.parse(saved) : INITIAL_EARNINGS;
    } catch {
      return INITIAL_EARNINGS;
    }
  });

  const [expenses, setExpenses] = useState<ExpenseEntry[]>(() => {
    try {
      const saved = localStorage.getItem('rosida_expenses') || localStorage.getItem('zeca_expenses');
      return saved ? JSON.parse(saved) : INITIAL_EXPENSES;
    } catch {
      return INITIAL_EXPENSES;
    }
  });

  const [tasks, setTasks] = useState<DriverTask[]>(() => {
    try {
      const saved = localStorage.getItem('rosida_tasks') || localStorage.getItem('zeca_tasks');
      return saved ? JSON.parse(saved) : INITIAL_TASKS;
    } catch {
      return INITIAL_TASKS;
    }
  });

  // Modal Controls
  const [isAddEarningsOpen, setIsAddEarningsOpen] = useState(false);
  const [editingEarnings, setEditingEarnings] = useState<EarningsEntry | null>(null);

  const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState<ExpenseEntry | null>(null);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isManagePlatformsOpen, setIsManagePlatformsOpen] = useState(false);
  const [isManageCategoriesOpen, setIsManageCategoriesOpen] = useState(false);
  const [isManageFuelTypesOpen, setIsManageFuelTypesOpen] = useState(false);

  // Custom Confirmation Modal state
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
  } | null>(null);

  // Toast notification
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Auto-migration: if entries were saved with premature UTC next-day date, realign them to today
  useEffect(() => {
    const todayStr = getRelativeDate(0);
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const tomorrowStr = formatLocalDate(d);

    setEarnings((prev) => {
      const hasTomorrow = prev.some((e) => e.date === tomorrowStr);
      if (!hasTomorrow) return prev;
      return prev.map((e) => (e.date === tomorrowStr ? { ...e, date: todayStr } : e));
    });

    setExpenses((prev) => {
      const hasTomorrow = prev.some((e) => e.date === tomorrowStr);
      if (!hasTomorrow) return prev;
      return prev.map((e) => (e.date === tomorrowStr ? { ...e, date: todayStr } : e));
    });
  }, []);

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem('rosida_profile', JSON.stringify(profile));
  }, [profile]);

  useEffect(() => {
    localStorage.setItem('rosida_platforms', JSON.stringify(platforms));
  }, [platforms]);

  useEffect(() => {
    localStorage.setItem('rosida_expense_categories', JSON.stringify(expenseCategories));
  }, [expenseCategories]);

  useEffect(() => {
    localStorage.setItem('rosida_fuel_types', JSON.stringify(fuelTypes));
  }, [fuelTypes]);

  useEffect(() => {
    localStorage.setItem('rosida_earnings', JSON.stringify(earnings));
  }, [earnings]);

  useEffect(() => {
    localStorage.setItem('rosida_expenses', JSON.stringify(expenses));
  }, [expenses]);

  useEffect(() => {
    localStorage.setItem('rosida_tasks', JSON.stringify(tasks));
  }, [tasks]);

  // Today Gross for top badge (only included in calculations)
  const todayGross = earnings
    .filter((e) => e.date === getRelativeDate(0) && e.includeInCalculations !== false)
    .reduce((acc, curr) => acc + curr.grossAmount, 0);

  // Earnings Handlers
  const handleSaveEarnings = (entryData: Omit<EarningsEntry, 'id' | 'createdAt'>, editId?: string) => {
    if (editId) {
      setEarnings((prev) =>
        prev.map((e) => (e.id === editId ? { ...e, ...entryData } : e))
      );
    } else {
      const newEntry: EarningsEntry = {
        ...entryData,
        id: `earn-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setEarnings((prev) => [newEntry, ...prev]);
    }
    setSelectedDate(entryData.date);
    if (entryData.kmDriven > 0 && entryData.grossAmount === 0) {
      showToast(`Registro de ${entryData.kmDriven} km criado! Odômetro atualizado.`);
    } else {
      showToast('Ganhos salvos com sucesso!');
    }
  };

  const handleDeleteEarnings = (id: string) => {
    const entry = earnings.find((e) => e.id === id);
    setDeleteConfirmation({
      isOpen: true,
      title: 'Excluir Lançamento de Ganhos',
      description: entry
        ? `Tem certeza que deseja apagar o faturamento de R$ ${entry.grossAmount.toFixed(2)}?`
        : 'Tem certeza que deseja apagar este lançamento?',
      onConfirm: () => {
        setEarnings((prev) => prev.filter((e) => e.id !== id));
        showToast('Lançamento de ganho excluído.');
      },
    });
  };

  const handleToggleEarningsCalculation = (id: string) => {
    const current = earnings.find((e) => e.id === id);
    const willBeIncluded = current?.includeInCalculations === false;
    setEarnings((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, includeInCalculations: willBeIncluded } : e
      )
    );
    showToast(
      willBeIncluded
        ? 'Lançamento ativado nos cálculos e relatórios!'
        : 'Lançamento desativado dos cálculos financeiros.'
    );
  };

  // Expense Handlers
  const handleSaveExpense = (expenseData: Omit<ExpenseEntry, 'id' | 'createdAt'>, editId?: string) => {
    if (editId) {
      setExpenses((prev) =>
        prev.map((e) => (e.id === editId ? { ...e, ...expenseData } : e))
      );
    } else {
      const newExpense: ExpenseEntry = {
        ...expenseData,
        id: `exp-${Date.now()}`,
        createdAt: new Date().toISOString(),
      };
      setExpenses((prev) => [newExpense, ...prev]);
    }
    showToast('Despesa registrada com sucesso!');
  };

  const handleDeleteExpense = (id: string) => {
    const expense = expenses.find((e) => e.id === id);
    setDeleteConfirmation({
      isOpen: true,
      title: 'Excluir Despesa',
      description: expense
        ? `Tem certeza que deseja excluir a despesa no valor de R$ ${expense.amount.toFixed(2)}?`
        : 'Tem certeza que deseja apagar esta despesa?',
      onConfirm: () => {
        setExpenses((prev) => prev.filter((e) => e.id !== id));
        showToast('Despesa excluída com sucesso.');
      },
    });
  };

  const handleToggleExpenseCalculation = (id: string) => {
    const current = expenses.find((e) => e.id === id);
    const willBeIncluded = current?.includeInCalculations === false;
    setExpenses((prev) =>
      prev.map((e) =>
        e.id === id ? { ...e, includeInCalculations: willBeIncluded } : e
      )
    );
    showToast(
      willBeIncluded
        ? 'Despesa ativada nos cálculos de custos e lucro!'
        : 'Despesa desativada dos cálculos (mantida apenas no histórico).'
    );
  };

  // Category CRUD Handlers
  const handleAddCategory = (newCat: ExpenseCategoryConfig) => {
    setExpenseCategories((prev) => [...prev, newCat]);
    showToast(`Categoria "${newCat.name}" criada com sucesso!`);
  };

  const handleUpdateCategory = (updCat: ExpenseCategoryConfig) => {
    setExpenseCategories((prev) =>
      prev.map((c) => (c.id === updCat.id ? updCat : c))
    );
    showToast(`Categoria "${updCat.name}" atualizada!`);
  };

  const handleDeleteCategory = (catId: string) => {
    if (expenseCategories.length <= 1) {
      showToast('É necessário ter ao menos uma categoria.');
      return;
    }
    setExpenseCategories((prev) => prev.filter((c) => c.id !== catId));
    showToast('Categoria removida.');
  };

  // Fuel Type CRUD Handlers
  const handleAddFuelType = (newFuel: FuelTypeConfig) => {
    setFuelTypes((prev) => [...prev, newFuel]);
    showToast(`Combustível "${newFuel.name}" adicionado!`);
  };

  const handleUpdateFuelType = (updFuel: FuelTypeConfig) => {
    setFuelTypes((prev) =>
      prev.map((f) => (f.id === updFuel.id ? updFuel : f))
    );
    showToast(`Combustível "${updFuel.name}" atualizado!`);
  };

  const handleDeleteFuelType = (fuelId: string) => {
    if (fuelTypes.length <= 1) {
      showToast('É necessário manter ao menos um tipo de combustível.');
      return;
    }
    setFuelTypes((prev) => prev.filter((f) => f.id !== fuelId));
    showToast('Combustível removido.');
  };

  const handleAddTask = (taskData: Omit<DriverTask, 'id' | 'createdAt'>) => {
    const newTask: DriverTask = {
      ...taskData,
      id: `task-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [newTask, ...prev]);
    showToast('Lembrete adicionado!');
  };

  const handleUpdateTask = (id: string, updatedData: Partial<DriverTask>) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, ...updatedData } : t))
    );
    showToast('Tarefa atualizada com sucesso!');
  };

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t))
    );
  };

  const handleDeleteTask = (id: string) => {
    const task = tasks.find((t) => t.id === id);
    setDeleteConfirmation({
      isOpen: true,
      title: 'Excluir Tarefa',
      description: task
        ? `Tem certeza que deseja excluir a tarefa "${task.title}"?`
        : 'Tem certeza que deseja excluir esta tarefa?',
      onConfirm: () => {
        setTasks((prev) => prev.filter((t) => t.id !== id));
        showToast('Tarefa excluída.');
      },
    });
  };

  // Platform CRUD Handlers
  const handleAddPlatform = (newPlat: PlatformConfig) => {
    setPlatforms((prev) => [...prev, newPlat]);
    showToast(`Aplicativo ${newPlat.name} adicionado!`);
  };

  const handleUpdatePlatform = (updated: PlatformConfig) => {
    setPlatforms((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
    showToast(`Aplicativo ${updated.name} atualizado!`);
  };

  const handleDeletePlatform = (id: string) => {
    setPlatforms((prev) => prev.filter((p) => p.id !== id));
    showToast('Aplicativo removido.');
  };

  // Reset to default sample data
  const handleResetData = () => {
    setProfile(DEFAULT_PROFILE);
    setPlatforms(PLATFORMS);
    setExpenseCategories(DEFAULT_EXPENSE_CATEGORIES);
    setFuelTypes(DEFAULT_FUEL_TYPES);
    setEarnings(INITIAL_EARNINGS);
    setExpenses(INITIAL_EXPENSES);
    setTasks(INITIAL_TASKS);
    showToast('Dados restaurados para o padrão.');
  };

  // Export full JSON backup with 100% of all data across all tables and settings
  const handleExportData = (currentFormProfile?: DriverProfile) => {
    const exportProfile = currentFormProfile ? { ...profile, ...currentFormProfile } : profile;
    const fullBackup = {
      appName: 'Rosida - Gestão Financeira para Motoristas e Entregadores',
      version: '2.2.0',
      exportedAt: new Date().toISOString(),
      metadata: {
        totalEarningsRecords: earnings.length,
        totalExpensesRecords: expenses.length,
        totalTasksRecords: tasks.length,
        totalPlatforms: platforms.length,
        totalExpenseCategories: expenseCategories.length,
        totalFuelTypes: fuelTypes.length,
        systemDate: getRelativeDate(0),
      },
      profile: exportProfile,
      platforms,
      expenseCategories,
      fuelTypes,
      earnings,
      expenses,
      tasks,
    };

    const blob = new Blob([JSON.stringify(fullBackup, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `rosida-backup-completo-${getRelativeDate(0)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast(
      `Backup completo baixado: ${earnings.length} ganhos, ${expenses.length} despesas e todas as configurações preservadas!`
    );
  };

  // Import JSON backup with comprehensive validation, sanitization, and fallback compatibility
  const handleImportData = (
    jsonData: string
  ): { success: boolean; message: string; count?: { earnings: number; expenses: number; tasks: number } } => {
    try {
      const data = JSON.parse(jsonData);

      // 1. Profile / Settings
      const importedProfile = data.profile || data.perfil;
      if (importedProfile && typeof importedProfile === 'object') {
        const mergedProfile = { ...profile, ...importedProfile };
        setProfile(mergedProfile);
        try {
          localStorage.setItem('rosida_profile', JSON.stringify(mergedProfile));
        } catch {}
      }

      // 2. Platforms
      const importedPlatforms = data.platforms || data.aplicativos;
      if (Array.isArray(importedPlatforms) && importedPlatforms.length > 0) {
        setPlatforms(importedPlatforms);
        try {
          localStorage.setItem('rosida_platforms', JSON.stringify(importedPlatforms));
        } catch {}
      }

      // 3. Expense Categories
      const importedCategories = data.expenseCategories || data.categorias;
      if (Array.isArray(importedCategories) && importedCategories.length > 0) {
        setExpenseCategories(importedCategories);
        try {
          localStorage.setItem('rosida_expense_categories', JSON.stringify(importedCategories));
        } catch {}
      }

      // 4. Fuel Types
      const importedFuels = data.fuelTypes || data.combustiveis;
      if (Array.isArray(importedFuels) && importedFuels.length > 0) {
        setFuelTypes(importedFuels);
        try {
          localStorage.setItem('rosida_fuel_types', JSON.stringify(importedFuels));
        } catch {}
      }

      // 5. Earnings (preserves 100% of all record fields)
      let earningsCount = 0;
      const rawEarnings =
        data.earnings ||
        data.ganhos ||
        (Array.isArray(data.records)
          ? data.records.filter((r: any) => r.grossAmount !== undefined)
          : null);

      if (Array.isArray(rawEarnings)) {
        const sanitizedEarnings: EarningsEntry[] = rawEarnings.map((e: any, idx: number) => ({
          id: e.id ? String(e.id) : `earn-${Date.now()}-${idx}`,
          date: e.date || getRelativeDate(0),
          platformId: e.platformId || 'uber',
          grossAmount:
            typeof e.grossAmount === 'number' ? e.grossAmount : parseBRLDecimal(e.grossAmount),
          ridesCount:
            typeof e.ridesCount === 'number' ? e.ridesCount : parseInt(e.ridesCount, 10) || 0,
          onlineHours:
            typeof e.onlineHours === 'number' ? e.onlineHours : parseFloat(e.onlineHours) || 0,
          kmDriven:
            typeof e.kmDriven === 'number' ? e.kmDriven : parseFloat(e.kmDriven) || 0,
          tipsOrBonus:
            typeof e.tipsOrBonus === 'number' ? e.tipsOrBonus : parseBRLDecimal(e.tipsOrBonus) || 0,
          shift: e.shift || 'manha',
          notes: e.notes ? String(e.notes) : undefined,
          createdAt: e.createdAt || new Date().toISOString(),
          includeInCalculations: e.includeInCalculations !== false,
        }));
        setEarnings(sanitizedEarnings);
        earningsCount = sanitizedEarnings.length;
        try {
          localStorage.setItem('rosida_earnings', JSON.stringify(sanitizedEarnings));
        } catch {}
      }

      // 6. Expenses (preserves 100% of all record fields)
      let expensesCount = 0;
      const rawExpenses =
        data.expenses ||
        data.despesas ||
        (Array.isArray(data.records)
          ? data.records.filter((r: any) => r.category !== undefined && r.amount !== undefined)
          : null);

      if (Array.isArray(rawExpenses)) {
        const sanitizedExpenses: ExpenseEntry[] = rawExpenses.map((exp: any, idx: number) => ({
          id: exp.id ? String(exp.id) : `exp-${Date.now()}-${idx}`,
          date: exp.date || getRelativeDate(0),
          category: exp.category || 'combustivel',
          amount:
            typeof exp.amount === 'number' ? exp.amount : parseBRLDecimal(exp.amount),
          notes: exp.notes ? String(exp.notes) : undefined,
          liters:
            exp.liters !== undefined && exp.liters !== null
              ? typeof exp.liters === 'number'
                ? exp.liters
                : parseFloat(exp.liters) || undefined
              : undefined,
          pricePerLiter:
            exp.pricePerLiter !== undefined && exp.pricePerLiter !== null
              ? typeof exp.pricePerLiter === 'number'
                ? exp.pricePerLiter
                : parseBRLDecimal(exp.pricePerLiter) || undefined
              : undefined,
          fuelType: exp.fuelType ? String(exp.fuelType) : undefined,
          platformId: exp.platformId ? String(exp.platformId) : undefined,
          createdAt: exp.createdAt || new Date().toISOString(),
          includeInCalculations: exp.includeInCalculations !== false,
        }));
        setExpenses(sanitizedExpenses);
        expensesCount = sanitizedExpenses.length;
        try {
          localStorage.setItem('rosida_expenses', JSON.stringify(sanitizedExpenses));
        } catch {}
      }

      // 7. Tasks (preserves 100% of all maintenance records)
      let tasksCount = 0;
      const rawTasks = data.tasks || data.tarefas || data.manutencoes;
      if (Array.isArray(rawTasks)) {
        const sanitizedTasks: DriverTask[] = rawTasks.map((t: any, idx: number) => ({
          id: t.id ? String(t.id) : `task-${Date.now()}-${idx}`,
          title: t.title || 'Manutenção',
          category: t.category || 'preventiva',
          dueKm:
            typeof t.dueKm === 'number' ? t.dueKm : parseFloat(t.dueKm) || undefined,
          dueDate: t.dueDate || undefined,
          currentKm:
            typeof t.currentKm === 'number' ? t.currentKm : parseFloat(t.currentKm) || undefined,
          completed: Boolean(t.completed),
          completedAt: t.completedAt || undefined,
          completedKm:
            typeof t.completedKm === 'number'
              ? t.completedKm
              : parseFloat(t.completedKm) || undefined,
          estimatedCost:
            typeof t.estimatedCost === 'number'
              ? t.estimatedCost
              : parseBRLDecimal(t.estimatedCost) || undefined,
          notes: t.notes ? String(t.notes) : undefined,
          createdAt: t.createdAt || new Date().toISOString(),
          priority: t.priority || 'media',
        }));
        setTasks(sanitizedTasks);
        tasksCount = sanitizedTasks.length;
        try {
          localStorage.setItem('rosida_tasks', JSON.stringify(sanitizedTasks));
        } catch {}
      }

      const successMsg = `Backup restaurado com sucesso! ${earningsCount} ganhos, ${expensesCount} despesas e ${tasksCount} tarefas carregados sem perdas.`;
      showToast(successMsg);
      return {
        success: true,
        message: successMsg,
        count: { earnings: earningsCount, expenses: expensesCount, tasks: tasksCount },
      };
    } catch {
      const errorMsg = 'Erro ao ler ou processar arquivo JSON. Verifique a formatação do arquivo.';
      showToast(errorMsg);
      return { success: false, message: errorMsg };
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-zinc-950">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-zinc-900 border border-emerald-500/50 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 animate-in fade-in slide-in-from-bottom-5">
          <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400">
            <Check className="w-4 h-4 stroke-[3]" />
          </div>
          <span className="text-xs sm:text-sm font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main App Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        profile={profile}
        todayGross={todayGross}
        onOpenAddEarnings={() => {
          setEditingEarnings(null);
          setIsAddEarningsOpen(true);
        }}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'overview' && (
          <DayOverview
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            earnings={earnings}
            expenses={expenses}
            profile={profile}
            platforms={platforms}
            selectedPlatformIds={selectedPlatformIds}
            setSelectedPlatformIds={setSelectedPlatformIds}
            onOpenManagePlatforms={() => setIsManagePlatformsOpen(true)}
            onOpenAddEarnings={() => {
              setEditingEarnings(null);
              setIsAddEarningsOpen(true);
            }}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onEditEarnings={(entry) => {
              setEditingEarnings(entry);
              setIsAddEarningsOpen(true);
            }}
            onDeleteEarnings={handleDeleteEarnings}
            onDeleteExpense={handleDeleteExpense}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsAddExpenseOpen(true);
            }}
            onToggleEarningsCalculation={handleToggleEarningsCalculation}
            onToggleExpenseCalculation={handleToggleExpenseCalculation}
            onNavigateToFuel={() => setActiveTab('fuel')}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
            expenses={expenses}
            earnings={earnings}
            platforms={platforms}
            selectedPlatformIds={selectedPlatformIds}
            setSelectedPlatformIds={setSelectedPlatformIds}
            profile={profile}
            categories={expenseCategories}
            fuelTypes={fuelTypes}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onEditExpense={(exp) => {
              setEditingExpense(exp);
              setIsAddExpenseOpen(true);
            }}
            onDeleteExpense={handleDeleteExpense}
            onToggleExpenseCalculation={handleToggleExpenseCalculation}
            onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
            onOpenManageFuelTypes={() => setIsManageFuelTypesOpen(true)}
            onNavigateToFuel={() => setActiveTab('fuel')}
          />
        )}

        {activeTab === 'fuel' && (
          <FuelConsumptionView
            expenses={expenses}
            earnings={earnings}
            profile={profile}
            platforms={platforms}
            fuelTypes={fuelTypes}
            onOpenAddExpense={() => {
              setEditingExpense(null);
              setIsAddExpenseOpen(true);
            }}
            onOpenAddEarnings={() => {
              setEditingEarnings(null);
              setIsAddEarningsOpen(true);
            }}
            onOpenManageFuelTypes={() => setIsManageFuelTypesOpen(true)}
            onUpdateProfile={(newProf) => {
              setProfile(newProf);
              showToast('Perfil do veículo atualizado!');
            }}
          />
        )}

        {activeTab === 'tasks' && (
          <TasksManager
            tasks={tasks}
            profile={profile}
            earnings={earnings}
            platforms={platforms}
            onAddTask={handleAddTask}
            onUpdateTask={handleUpdateTask}
            onToggleTask={handleToggleTask}
            onDeleteTask={handleDeleteTask}
            onAddEarnings={handleSaveEarnings}
            onUpdateProfile={(newProf) => {
              setProfile(newProf);
              showToast('Perfil do veículo atualizado!');
            }}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onNavigateToFuel={() => setActiveTab('fuel')}
            onOpenAddExpense={(defaultData) => {
              if (defaultData) {
                setEditingExpense({
                  id: '',
                  date: defaultData.date || selectedDate,
                  category: defaultData.category || 'manutencao',
                  amount: defaultData.amount || 0,
                  notes: defaultData.notes || '',
                  createdAt: new Date().toISOString(),
                });
              } else {
                setEditingExpense(null);
              }
              setIsAddExpenseOpen(true);
            }}
            onOpenManageFuelTypes={() => setIsManageFuelTypesOpen(true)}
            showToast={showToast}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            earnings={earnings}
            expenses={expenses}
            profile={profile}
            platforms={platforms}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            selectedPlatformIds={selectedPlatformIds}
            setSelectedPlatformIds={setSelectedPlatformIds}
            customStartDate={customStartDate}
            setCustomStartDate={setCustomStartDate}
            customEndDate={customEndDate}
            setCustomEndDate={setCustomEndDate}
          />
        )}
      </main>

      {/* Bottom Floating Action on Mobile for Quick Entry */}
      <div className="sm:hidden fixed bottom-5 right-5 z-30">
        <button
          onClick={() => {
            setEditingEarnings(null);
            setIsAddEarningsOpen(true);
          }}
          className="w-14 h-14 rounded-full bg-emerald-500 text-zinc-950 font-black shadow-2xl shadow-emerald-500/40 flex items-center justify-center active:scale-90 transition-transform cursor-pointer"
          title="Lançar Ganho"
        >
          <Plus className="w-7 h-7 stroke-[3]" />
        </button>
      </div>

      {/* Modals */}
      <QuickAddEarningsModal
        key={editingEarnings ? `modal-earn-${editingEarnings.id}` : `modal-earn-new-${isAddEarningsOpen}`}
        isOpen={isAddEarningsOpen}
        onClose={() => {
          setIsAddEarningsOpen(false);
          setEditingEarnings(null);
        }}
        onSave={handleSaveEarnings}
        initialEntry={editingEarnings}
        selectedDate={selectedDate}
        profile={profile}
        platforms={platforms}
        onOpenManagePlatforms={() => setIsManagePlatformsOpen(true)}
      />

      <QuickAddExpenseModal
        key={editingExpense ? `modal-exp-${editingExpense.id}` : `modal-exp-new-${isAddExpenseOpen}`}
        isOpen={isAddExpenseOpen}
        onClose={() => {
          setIsAddExpenseOpen(false);
          setEditingExpense(null);
        }}
        onSave={handleSaveExpense}
        onDelete={handleDeleteExpense}
        initialExpense={editingExpense}
        selectedDate={selectedDate}
        profile={profile}
        platforms={platforms}
        categories={expenseCategories}
        fuelTypes={fuelTypes}
        onOpenManageCategories={() => setIsManageCategoriesOpen(true)}
        onOpenManageFuelTypes={() => setIsManageFuelTypesOpen(true)}
      />

      <ManageExpenseCategoriesModal
        isOpen={isManageCategoriesOpen}
        onClose={() => setIsManageCategoriesOpen(false)}
        categories={expenseCategories}
        onAddCategory={handleAddCategory}
        onUpdateCategory={handleUpdateCategory}
        onDeleteCategory={handleDeleteCategory}
      />

      <ManageFuelTypesModal
        isOpen={isManageFuelTypesOpen}
        onClose={() => setIsManageFuelTypesOpen(false)}
        fuelTypes={fuelTypes}
        onAddFuelType={handleAddFuelType}
        onUpdateFuelType={handleUpdateFuelType}
        onDeleteFuelType={handleDeleteFuelType}
      />

      <VehicleSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        profile={profile}
        earnings={earnings}
        expenses={expenses}
        tasks={tasks}
        onSaveProfile={(newProf) => {
          setProfile(newProf);
          showToast('Configurações do veículo salvas!');
        }}
        onResetData={handleResetData}
        onExportData={handleExportData}
        onImportData={handleImportData}
      />

      <ManagePlatformsModal
        isOpen={isManagePlatformsOpen}
        onClose={() => setIsManagePlatformsOpen(false)}
        platforms={platforms}
        onAddPlatform={handleAddPlatform}
        onUpdatePlatform={handleUpdatePlatform}
        onDeletePlatform={handleDeletePlatform}
      />

      {/* Confirmation Modal */}
      {deleteConfirmation && (
        <ConfirmModal
          isOpen={deleteConfirmation.isOpen}
          title={deleteConfirmation.title}
          description={deleteConfirmation.description}
          confirmLabel="Sim, Excluir"
          cancelLabel="Cancelar"
          isDanger={true}
          onConfirm={deleteConfirmation.onConfirm}
          onClose={() => setDeleteConfirmation(null)}
        />
      )}

      {/* App Footer */}
      <footer className="border-t border-zinc-900 bg-zinc-950 py-6 mt-12 text-center text-xs text-zinc-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            <strong className="text-zinc-400">Rosida - Motorista</strong> • Gestão Financeira e Operacional para Motoristas
          </p>
          <p className="text-[11px] text-zinc-600">
            Controle de ganhos, despesas, veículo e metas mensais
          </p>
        </div>
      </footer>
    </div>
  );
}
