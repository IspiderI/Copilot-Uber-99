import React, { useState, useEffect } from 'react';
import {
  Fuel,
  Wrench,
  TrendingDown,
  TrendingUp,
  Search,
  Check,
  AlertTriangle,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  DollarSign,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  Gauge,
  Clock,
  Car,
  Layers,
  CheckCircle2,
  Calendar,
} from 'lucide-react';
import {
  DriverProfile,
  MaintenanceItemConfig,
  MaintenanceCategoryType,
  ExpenseEntry,
  DriverTask,
} from '../types';
import { CurrencyInput } from './CurrencyInput';
import { formatCurrency, formatBRLDecimal } from '../utils/helpers';
import {
  fetchFipeBrands,
  fetchFipeModels,
  fetchFipeYears,
  fetchFipeVehicleValue,
  searchFipeAuto,
  calculateVehicleDepreciation,
  POPULAR_BRANDS,
  FipeBrand,
  FipeModel,
  FipeYear,
  FipeVehicleDetails,
} from '../utils/fipeService';
import { DEFAULT_MAINTENANCE_ITEMS } from '../data/constants';

interface VehicleCostsAndMaintenanceProps {
  profile: DriverProfile;
  onUpdateProfile: (updatedProfile: DriverProfile) => void;
  currentEffectiveKm: number;
  onOpenAddExpense?: (defaultData?: Partial<ExpenseEntry>) => void;
  onAddTask?: (task: Omit<DriverTask, 'id' | 'createdAt'>) => void;
  onOpenManageFuelTypes?: () => void;
  onNavigateToFuel?: () => void;
  showToast?: (msg: string) => void;
}

export const VehicleCostsAndMaintenance: React.FC<VehicleCostsAndMaintenanceProps> = ({
  profile,
  onUpdateProfile,
  currentEffectiveKm,
  onOpenAddExpense,
  onAddTask,
  onOpenManageFuelTypes,
  onNavigateToFuel,
  showToast,
}) => {
  const [formData, setFormData] = useState<DriverProfile>(() => ({
    ...profile,
    maintenanceItems:
      profile.maintenanceItems && profile.maintenanceItems.length > 0
        ? profile.maintenanceItems
        : DEFAULT_MAINTENANCE_ITEMS,
    syncMaintenanceCostFromItems:
      profile.syncMaintenanceCostFromItems !== undefined
        ? profile.syncMaintenanceCostFromItems
        : true,
  }));

  const [activeSubSection, setActiveSubSection] = useState<'all' | 'costs' | 'maintenance'>('all');
  const [activeMaintCategory, setActiveMaintCategory] = useState<'all' | MaintenanceCategoryType>('all');
  const [isEditingItem, setIsEditingItem] = useState<MaintenanceItemConfig | null>(null);

  // FIPE online search state
  const [fipeSearchBrand, setFipeSearchBrand] = useState<string>(formData.vehicleBrand || 'GM - Chevrolet');
  const [fipeSearchModel, setFipeSearchModel] = useState<string>(formData.vehicleModel || 'Onix');
  const [fipeSearchYear, setFipeSearchYear] = useState<string>(
    formData.vehicleYear ? formData.vehicleYear.toString() : '2022'
  );
  const [isSearchingFipe, setIsSearchingFipe] = useState<boolean>(false);
  const [fipeSearchResult, setFipeSearchResult] = useState<FipeVehicleDetails | null>(null);
  const [fipeSearchError, setFipeSearchError] = useState<string | null>(null);
  const [showManualFipeModal, setShowManualFipeModal] = useState<boolean>(false);
  const [manualFipeInput, setManualFipeInput] = useState<string>('');

  // Dropdown FIPE state
  const [useDropdownMode, setUseDropdownMode] = useState<boolean>(false);
  const [brandsList, setBrandsList] = useState<FipeBrand[]>(POPULAR_BRANDS);
  const [modelsList, setModelsList] = useState<FipeModel[]>([]);
  const [yearsList, setYearsList] = useState<FipeYear[]>([]);
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>('23');
  const [selectedModelCode, setSelectedModelCode] = useState<string>('');
  const [selectedYearCode, setSelectedYearCode] = useState<string>('');
  const [isLoadingDropdowns, setIsLoadingDropdowns] = useState<boolean>(false);

  // Sync with profile prop if changed externally
  useEffect(() => {
    setFormData((prev) => ({
      ...profile,
      maintenanceItems:
        profile.maintenanceItems && profile.maintenanceItems.length > 0
          ? profile.maintenanceItems
          : prev.maintenanceItems || DEFAULT_MAINTENANCE_ITEMS,
      syncMaintenanceCostFromItems:
        profile.syncMaintenanceCostFromItems !== undefined
          ? profile.syncMaintenanceCostFromItems
          : prev.syncMaintenanceCostFromItems ?? true,
    }));
  }, [profile]);

  // Load brands for dropdown mode
  useEffect(() => {
    if (useDropdownMode && brandsList.length <= POPULAR_BRANDS.length) {
      fetchFipeBrands()
        .then((b) => {
          if (b && b.length > 0) setBrandsList(b);
        })
        .catch(() => {});
    }
  }, [useDropdownMode, brandsList.length]);

  // Load models when brand changes
  useEffect(() => {
    if (useDropdownMode && selectedBrandCode) {
      setIsLoadingDropdowns(true);
      fetchFipeModels(selectedBrandCode)
        .then((m) => {
          setModelsList(m);
          setSelectedModelCode('');
          setYearsList([]);
          setSelectedYearCode('');
        })
        .catch(() => {})
        .finally(() => setIsLoadingDropdowns(false));
    }
  }, [useDropdownMode, selectedBrandCode]);

  // Load years when model changes
  useEffect(() => {
    if (useDropdownMode && selectedBrandCode && selectedModelCode) {
      setIsLoadingDropdowns(true);
      fetchFipeYears(selectedBrandCode, selectedModelCode)
        .then((y) => {
          setYearsList(y);
          setSelectedYearCode('');
        })
        .catch(() => {})
        .finally(() => setIsLoadingDropdowns(false));
    }
  }, [useDropdownMode, selectedBrandCode, selectedModelCode]);

  // 1. Calculations: Fuel Cost per KM
  const estimatedFuelCostPerKm =
    formData.kmPerLiter && formData.kmPerLiter > 0
      ? (formData.fuelPricePerLiter || 0) / formData.kmPerLiter
      : 0;

  // 2. Calculations: Maintenance Cost per KM from Detailed Items
  const maintenanceItemsList = formData.maintenanceItems || DEFAULT_MAINTENANCE_ITEMS;
  const activeMaintenanceItems = maintenanceItemsList.filter((item) => item.isActive !== false);

  const calculatedItemsMaintenanceCostPerKm = Number(
    activeMaintenanceItems.reduce((acc, curr) => acc + (curr.costPerKm || 0), 0).toFixed(3)
  );

  const effectiveMaintenanceCostPerKm = formData.syncMaintenanceCostFromItems
    ? calculatedItemsMaintenanceCostPerKm
    : formData.maintenanceCostPerKm !== undefined
    ? formData.maintenanceCostPerKm
    : 0.18;

  // 3. Calculations: FIPE Depreciation
  const workingDaysPerYear = 312; // 6 days/week * 52 weeks
  const currentFipeValue = formData.vehicleFipeValue || 61129;
  const currentBaseAnnualRate =
    formData.annualDepreciationRate !== undefined ? formData.annualDepreciationRate : 10;
  const currentProjectedKm = formData.projectedAnnualKm || 36000;

  const depreciationCalc = calculateVehicleDepreciation({
    fipeValue: currentFipeValue,
    baseAnnualRate: currentBaseAnnualRate,
    projectedAnnualKm: currentProjectedKm,
    workingDaysPerYear,
  });

  const estimatedDepreciationCostPerKm =
    formData.depreciationCostPerKm !== undefined
      ? formData.depreciationCostPerKm
      : depreciationCalc.depreciationCostPerKm;

  // Total Real Cost per KM (3 Pillars: Fuel + Maintenance + FIPE Depreciation)
  const estimatedTotalCostPerKm = Number(
    (estimatedFuelCostPerKm + effectiveMaintenanceCostPerKm + estimatedDepreciationCostPerKm).toFixed(3)
  );

  // Handlers for form changes
  const handleChange = <K extends keyof DriverProfile>(field: K, value: DriverProfile[K]) => {
    setFormData((prev) => {
      const next = { ...prev, [field]: value };
      onUpdateProfile(next);
      return next;
    });
  };

  // Toggle sync from maintenance items
  const handleToggleSyncMaintenanceCost = (sync: boolean) => {
    setFormData((prev) => {
      const next: DriverProfile = {
        ...prev,
        syncMaintenanceCostFromItems: sync,
        maintenanceCostPerKm: sync ? calculatedItemsMaintenanceCostPerKm : prev.maintenanceCostPerKm,
      };
      onUpdateProfile(next);
      return next;
    });
    if (showToast) {
      showToast(
        sync
          ? `Custo sincronizado para ${formatCurrency(calculatedItemsMaintenanceCostPerKm)}/km!`
          : 'Custo de manutenção definido manualmente.'
      );
    }
  };

  // Toggle active item
  const handleToggleItemActive = (itemId: string) => {
    const updated = maintenanceItemsList.map((item) =>
      item.id === itemId ? { ...item, isActive: !item.isActive } : item
    );
    const newSum = Number(
      updated
        .filter((i) => i.isActive !== false)
        .reduce((sum, i) => sum + (i.costPerKm || 0), 0)
        .toFixed(3)
    );

    setFormData((prev) => {
      const next: DriverProfile = {
        ...prev,
        maintenanceItems: updated,
        maintenanceCostPerKm: prev.syncMaintenanceCostFromItems ? newSum : prev.maintenanceCostPerKm,
      };
      onUpdateProfile(next);
      return next;
    });
  };

  // Save edited item
  const handleSaveItemEdit = (updatedItem: MaintenanceItemConfig) => {
    // Recalculate costPerKm if estimatedCost and intervalKm changed
    let costPerKm = updatedItem.costPerKm;
    if (updatedItem.intervalKm && updatedItem.intervalKm > 0 && updatedItem.estimatedCost > 0) {
      costPerKm = Number((updatedItem.estimatedCost / updatedItem.intervalKm).toFixed(3));
    }
    const finalItem: MaintenanceItemConfig = {
      ...updatedItem,
      costPerKm,
    };

    const updated = maintenanceItemsList.map((item) =>
      item.id === finalItem.id ? finalItem : item
    );
    const newSum = Number(
      updated
        .filter((i) => i.isActive !== false)
        .reduce((sum, i) => sum + (i.costPerKm || 0), 0)
        .toFixed(3)
    );

    setFormData((prev) => {
      const next: DriverProfile = {
        ...prev,
        maintenanceItems: updated,
        maintenanceCostPerKm: prev.syncMaintenanceCostFromItems ? newSum : prev.maintenanceCostPerKm,
      };
      onUpdateProfile(next);
      return next;
    });
    setIsEditingItem(null);
    if (showToast) showToast(`Item "${finalItem.name}" atualizado!`);
  };

  // Quick Action: Add expense from item
  const handleCreateExpenseFromItem = (item: MaintenanceItemConfig) => {
    if (onOpenAddExpense) {
      onOpenAddExpense({
        category: 'manutencao',
        amount: item.estimatedCost || 0,
        notes: `Manutenção: ${item.name}`,
      });
    }
  };

  // Quick Action: Add task from item
  const handleCreateTaskFromItem = (item: MaintenanceItemConfig) => {
    if (onAddTask) {
      const targetKm = item.intervalKm ? currentEffectiveKm + item.intervalKm : undefined;
      onAddTask({
        title: item.name,
        category: 'manutencao',
        priority: item.category === 'corretiva' ? 'alta' : 'media',
        dueKm: targetKm,
        completed: false,
      });
      if (showToast) {
        showToast(
          `Tarefa "${item.name}" adicionada ao checklist${
            targetKm ? ` aos ${targetKm.toLocaleString('pt-BR')} km` : ''
          }!`
        );
      }
    }
  };

  // Handler for FIPE consultation
  const handleConsultFipe = async () => {
    setIsSearchingFipe(true);
    setFipeSearchError(null);
    setFipeSearchResult(null);

    try {
      let result: FipeVehicleDetails | null = null;

      if (useDropdownMode && selectedBrandCode && selectedModelCode && selectedYearCode) {
        result = await fetchFipeVehicleValue(selectedBrandCode, selectedModelCode, selectedYearCode);
      } else {
        const yearNum = parseInt(fipeSearchYear, 10) || undefined;
        result = await searchFipeAuto(fipeSearchBrand, fipeSearchModel, yearNum);
      }

      if (result && result.numericValue > 0) {
        setFipeSearchResult(result);
        const newDeprec = calculateVehicleDepreciation({
          fipeValue: result.numericValue,
          baseAnnualRate: currentBaseAnnualRate,
          projectedAnnualKm: currentProjectedKm,
          workingDaysPerYear,
        });

        const next: DriverProfile = {
          ...formData,
          vehicleBrand: result.Marca || formData.vehicleBrand,
          vehicleModel: result.Modelo || formData.vehicleModel,
          vehicleYear: result.AnoModelo || formData.vehicleYear,
          vehicleFipeValue: result.numericValue,
          vehicleFipeCode: result.CodigoFipe,
          vehicleFipeReference: result.MesReferencia,
          depreciationCostPerKm: newDeprec.depreciationCostPerKm,
        };
        setFormData(next);
        onUpdateProfile(next);
        if (showToast) showToast(`Valor FIPE atualizado: ${formatCurrency(result.numericValue)}`);
      } else {
        setFipeSearchError(
          'Não localizamos o veículo automaticamente na Tabela FIPE. Insira o valor manualmente.'
        );
        setManualFipeInput(formData.vehicleFipeValue ? formData.vehicleFipeValue.toString() : '');
        setShowManualFipeModal(true);
      }
    } catch {
      setFipeSearchError('Falha ao conectar com a FIPE. Você pode inserir o valor manualmente abaixo.');
      setManualFipeInput(formData.vehicleFipeValue ? formData.vehicleFipeValue.toString() : '');
      setShowManualFipeModal(true);
    } finally {
      setIsSearchingFipe(false);
    }
  };

  // Save manual FIPE value
  const handleSaveManualFipe = (val: number) => {
    if (val > 0) {
      const newDeprec = calculateVehicleDepreciation({
        fipeValue: val,
        baseAnnualRate: currentBaseAnnualRate,
        projectedAnnualKm: currentProjectedKm,
        workingDaysPerYear,
      });

      const next: DriverProfile = {
        ...formData,
        vehicleFipeValue: val,
        depreciationCostPerKm: newDeprec.depreciationCostPerKm,
      };
      setFormData(next);
      onUpdateProfile(next);
      if (showToast) showToast(`Valor FIPE salvo: ${formatCurrency(val)}`);
    }
    setShowManualFipeModal(false);
  };

  // Grouped items
  const preventivaItems = maintenanceItemsList.filter((i) => i.category === 'preventiva');
  const corretivaItems = maintenanceItemsList.filter((i) => i.category === 'corretiva');
  const preditivaItems = maintenanceItemsList.filter((i) => i.category === 'preditiva');

  const sumPreventiva = Number(
    preventivaItems
      .filter((i) => i.isActive !== false)
      .reduce((sum, i) => sum + (i.costPerKm || 0), 0)
      .toFixed(3)
  );

  const sumCorretiva = Number(
    corretivaItems
      .filter((i) => i.isActive !== false)
      .reduce((sum, i) => sum + (i.costPerKm || 0), 0)
      .toFixed(3)
  );

  const sumPreditiva = Number(
    preditivaItems
      .filter((i) => i.isActive !== false)
      .reduce((sum, i) => sum + (i.costPerKm || 0), 0)
      .toFixed(3)
  );

  return (
    <div className="space-y-6">
      {/* Top Section Header */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black uppercase tracking-wider bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1.5">
                <Fuel className="w-3.5 h-3.5" />
                Custos Operacionais & Manutenções
              </span>
              <span className="text-xs text-zinc-400">
                {formData.vehicleModel || 'Veículo'} • {formData.vehiclePlate || 'Sem placa'}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
              Consumo, Custos por KM e Plano de Manutenção
            </h2>
            <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
              Cálculo do Custo Real Operacional por KM dividido nos 3 pilares essenciais:
              <strong> Combustível</strong>, <strong>Manutenção (Preventiva, Corretiva e Preditiva)</strong> e{' '}
              <strong>Depreciação FIPE Oficial</strong>.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {onNavigateToFuel && (
              <button
                type="button"
                onClick={onNavigateToFuel}
                className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 px-3 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <Fuel className="w-3.5 h-3.5" />
                <span>Telemetria Km/L</span>
              </button>
            )}

            {onOpenManageFuelTypes && (
              <button
                type="button"
                onClick={onOpenManageFuelTypes}
                className="flex items-center gap-1.5 bg-zinc-950 hover:bg-zinc-800 text-zinc-300 border border-zinc-800 px-3 py-2 rounded-xl text-xs font-semibold transition-all cursor-pointer"
              >
                <span>Preços de Posto</span>
              </button>
            )}
          </div>
        </div>

        {/* Dynamic Real Cost Highlight Card: 3 Pillars */}
        <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-zinc-950 via-zinc-900 to-amber-950/20 border border-amber-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold text-amber-400 uppercase tracking-wider">
                  Custo Real Operacional por KM
                </span>
                <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-black">
                  3 Pilares
                </span>
              </div>
              <div className="text-2xl sm:text-3xl font-black text-white mt-0.5 flex items-baseline gap-1">
                {formatCurrency(estimatedTotalCostPerKm)}
                <span className="text-xs font-normal text-zinc-400">/ km rodado</span>
              </div>
            </div>

            <div className="text-right sm:border-l sm:border-zinc-800 sm:pl-4">
              <div className="text-xs text-zinc-400">Custo a cada 100 km:</div>
              <div className="text-lg font-black text-amber-300">
                {formatCurrency(estimatedTotalCostPerKm * 100)}
              </div>
              <div className="text-[10px] text-zinc-500">
                {formatCurrency(estimatedTotalCostPerKm * 1000)} a cada 1.000 km
              </div>
            </div>
          </div>

          {/* 3 Pillars Breakdown Chips */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2 border-t border-zinc-800 text-xs">
            {/* Pillar 1: Combustível */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-amber-500/30">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold flex items-center gap-1 text-amber-400">
                  <Fuel className="w-3.5 h-3.5" />
                  1. Combustível
                </span>
                <span className="text-[10px] text-zinc-500">
                  {formData.kmPerLiter || 10} km/L • {formatCurrency(formData.fuelPricePerLiter || 3.89)}/L
                </span>
              </div>
              <div className="text-base font-black text-amber-400 mt-1">
                {formatCurrency(estimatedFuelCostPerKm)}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">/ km</span>
              </div>
            </div>

            {/* Pillar 2: Manutenção */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-orange-500/30">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold flex items-center gap-1 text-orange-400">
                  <Wrench className="w-3.5 h-3.5" />
                  2. Manutenções
                </span>
                <span className="text-[10px] text-zinc-500">
                  {formData.syncMaintenanceCostFromItems ? 'Soma detalhada dos itens' : 'Manual'}
                </span>
              </div>
              <div className="text-base font-black text-orange-400 mt-1">
                {formatCurrency(effectiveMaintenanceCostPerKm)}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">/ km</span>
              </div>
            </div>

            {/* Pillar 3: Depreciação FIPE */}
            <div className="p-3 rounded-xl bg-zinc-950 border border-rose-500/30">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold flex items-center gap-1 text-rose-400">
                  <TrendingDown className="w-3.5 h-3.5" />
                  3. Depreciação FIPE
                </span>
                <span className="text-[10px] text-zinc-500">
                  FIPE: {formatCurrency(currentFipeValue)}
                </span>
              </div>
              <div className="text-base font-black text-rose-400 mt-1">
                {formatCurrency(estimatedDepreciationCostPerKm)}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">/ km</span>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Filter Buttons */}
        <div className="flex items-center gap-2 pt-1 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveSubSection('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
              activeSubSection === 'all'
                ? 'bg-zinc-800 text-white border border-zinc-700'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            Visão Completa
          </button>
          <button
            type="button"
            onClick={() => setActiveSubSection('costs')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'costs'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Fuel className="w-3.5 h-3.5" />
            <span>Combustível & FIPE</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveSubSection('maintenance')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeSubSection === 'maintenance'
                ? 'bg-orange-500/20 text-orange-300 border border-orange-500/40'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-800'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" />
            <span>Plano de Manutenções (Preventiva, Corretiva, Preditiva)</span>
          </button>
        </div>
      </div>

      {/* SECTION A: COMBUSTÍVEL & DEPRECIAÇÃO FIPE */}
      {(activeSubSection === 'all' || activeSubSection === 'costs') && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
            <h3 className="text-sm font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Fuel className="w-4 h-4" />
              Parâmetros de Combustível & Depreciação Tabela FIPE
            </h3>
            <span className="text-[11px] text-zinc-500">Editável em tempo real</span>
          </div>

          {/* Fuel and Base Cost Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Combustível Principal
              </label>
              <select
                id="select-fuel-type"
                value={formData.fuelType}
                onChange={(e) => handleChange('fuelType', e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-amber-400 transition-colors"
              >
                <option value="etanol">🌱 Etanol (Álcool)</option>
                <option value="gasolina">⛽ Gasolina Comum / Aditivada</option>
                <option value="gnv">💨 GNV (Gás Natural Veicular)</option>
                <option value="diesel">🚚 Diesel</option>
                <option value="eletrico">⚡ 100% Elétrico / Híbrido</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Média de Consumo (km/L ou km/m³)
              </label>
              <input
                id="input-km-per-liter"
                type="number"
                step="0.1"
                min="1"
                max="60"
                placeholder="Ex: 10.2"
                value={formData.kmPerLiter || ''}
                onChange={(e) => handleChange('kmPerLiter', parseFloat(e.target.value) || 0)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold text-emerald-400 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Quantos KM seu veículo faz por litro na cidade
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1">
                Preço Pago por Litro (R$)
              </label>
              <CurrencyInput
                id="input-fuel-price-per-liter"
                placeholder="Ex: 3,89"
                value={formData.fuelPricePerLiter}
                onChange={(val) => handleChange('fuelPricePerLiter', val)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold text-amber-400 focus:outline-none focus:border-amber-400 transition-colors"
              />
              <span className="text-[10px] text-zinc-500 mt-1 block">
                Custo de combustível: <strong>{formatCurrency(estimatedFuelCostPerKm)}/km</strong>
              </span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center justify-between">
                <span>Custo de Manutenção / KM (R$)</span>
                <span className="text-[10px] text-orange-400 font-bold">
                  {formData.syncMaintenanceCostFromItems ? 'Automático' : 'Manual'}
                </span>
              </label>
              <CurrencyInput
                id="input-maintenance-cost-per-km"
                placeholder="Ex: 0,18"
                value={effectiveMaintenanceCostPerKm}
                disabled={formData.syncMaintenanceCostFromItems}
                onChange={(val) => {
                  handleChange('maintenanceCostPerKm', val);
                  handleChange('syncMaintenanceCostFromItems', false);
                }}
                className={`w-full border rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none transition-colors ${
                  formData.syncMaintenanceCostFromItems
                    ? 'bg-zinc-950/60 border-zinc-800 text-orange-300 cursor-not-allowed'
                    : 'bg-zinc-950 border-orange-500/50 text-white focus:border-orange-400'
                }`}
              />
              <div className="flex items-center justify-between mt-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => handleToggleSyncMaintenanceCost(!formData.syncMaintenanceCostFromItems)}
                  className="text-orange-400 hover:text-orange-300 underline font-semibold cursor-pointer"
                >
                  {formData.syncMaintenanceCostFromItems
                    ? 'Editar manualmente'
                    : `Sincronizar soma dos itens (${formatCurrency(calculatedItemsMaintenanceCostPerKm)})`}
                </button>
              </div>
            </div>
          </div>

          {/* DEDICATED SECTION: Depreciação do Veículo & Tabela FIPE Oficial */}
          <div className="bg-zinc-950/80 border border-rose-500/30 rounded-2xl p-4 sm:p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400 border border-rose-500/30">
                  <TrendingDown className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    Depreciação do Veículo (Tabela FIPE Oficial)
                  </h4>
                  <p className="text-[11px] text-zinc-400">
                    Cálculo baseado no valor FIPE com taxa de desvalorização e KM anual projetado
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <a
                  href="http://veiculos.fipe.org.br/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-sky-400 hover:text-sky-300 font-semibold flex items-center gap-1 bg-zinc-900 px-2.5 py-1 rounded-lg border border-zinc-800"
                >
                  <span>veiculos.fipe.org.br</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            {/* FIPE Online Search Bar */}
            <div className="p-3.5 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Search className="w-3.5 h-3.5 text-rose-400" />
                  Consultar Tabela FIPE em Tempo Real
                </span>
                <button
                  type="button"
                  onClick={() => setUseDropdownMode(!useDropdownMode)}
                  className="text-[11px] text-rose-400 hover:text-rose-300 underline cursor-pointer"
                >
                  {useDropdownMode ? 'Mudar para busca rápida por texto' : 'Mudar para seleção por listas'}
                </button>
              </div>

              {useDropdownMode ? (
                /* Mode 1: Cascading Dropdowns */
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Marca</label>
                    <select
                      value={selectedBrandCode}
                      onChange={(e) => setSelectedBrandCode(e.target.value)}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
                    >
                      {brandsList.map((b) => (
                        <option key={b.codigo} value={b.codigo}>
                          {b.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Modelo</label>
                    <select
                      value={selectedModelCode}
                      onChange={(e) => setSelectedModelCode(e.target.value)}
                      disabled={isLoadingDropdowns || modelsList.length === 0}
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-rose-500 disabled:opacity-50"
                    >
                      <option value="">Selecione o Modelo...</option>
                      {modelsList.map((m) => (
                        <option key={m.codigo} value={m.codigo}>
                          {m.nome}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Ano / Combustível</label>
                    <div className="flex gap-1.5">
                      <select
                        value={selectedYearCode}
                        onChange={(e) => setSelectedYearCode(e.target.value)}
                        disabled={isLoadingDropdowns || yearsList.length === 0}
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-rose-500 disabled:opacity-50"
                      >
                        <option value="">Selecione o Ano...</option>
                        {yearsList.map((y) => (
                          <option key={y.codigo} value={y.codigo}>
                            {y.nome}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        onClick={handleConsultFipe}
                        disabled={isSearchingFipe || !selectedYearCode}
                        className="px-3 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
                      >
                        {isSearchingFipe ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Consultar'}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Quick Search Inputs */
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Marca</label>
                    <input
                      type="text"
                      value={fipeSearchBrand}
                      onChange={(e) => setFipeSearchBrand(e.target.value)}
                      placeholder="Ex: Chevrolet"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-[11px] text-zinc-400 mb-1">Modelo do Carro</label>
                    <input
                      type="text"
                      value={fipeSearchModel}
                      onChange={(e) => setFipeSearchModel(e.target.value)}
                      placeholder="Ex: Onix 1.0 Flex"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-zinc-400 mb-1">Ano Modelo</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        value={fipeSearchYear}
                        onChange={(e) => setFipeSearchYear(e.target.value)}
                        placeholder="2022"
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-2.5 py-2 text-white text-xs focus:outline-none focus:border-rose-500"
                      />
                      <button
                        type="button"
                        onClick={handleConsultFipe}
                        disabled={isSearchingFipe}
                        className="px-3.5 py-2 bg-rose-600 hover:bg-rose-500 disabled:bg-zinc-800 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer transition-colors"
                      >
                        {isSearchingFipe ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : 'Buscar'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Consultation Results / Errors */}
              {fipeSearchResult && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-xl flex items-center justify-between text-xs animate-in fade-in">
                  <div>
                    <span className="font-bold text-rose-300 block">
                      {fipeSearchResult.Marca} {fipeSearchResult.Modelo} ({fipeSearchResult.AnoModelo})
                    </span>
                    <span className="text-[11px] text-zinc-400">
                      Código FIPE: {fipeSearchResult.CodigoFipe} • Ref: {fipeSearchResult.MesReferencia}
                    </span>
                  </div>
                  <strong className="text-base font-black text-rose-400">
                    {fipeSearchResult.Valor}
                  </strong>
                </div>
              )}

              {fipeSearchError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-xl text-xs text-amber-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{fipeSearchError}</span>
                </div>
              )}
            </div>

            {/* Current FIPE Value Input & Influence Factors */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Valor FIPE Oficial (R$)
                </label>
                <CurrencyInput
                  id="input-vehicle-fipe-value"
                  placeholder="Ex: 61.129,00"
                  value={formData.vehicleFipeValue}
                  onChange={(val) => {
                    const newDeprec = calculateVehicleDepreciation({
                      fipeValue: val,
                      baseAnnualRate: currentBaseAnnualRate,
                      projectedAnnualKm: currentProjectedKm,
                      workingDaysPerYear,
                    });
                    const next: DriverProfile = {
                      ...formData,
                      vehicleFipeValue: val,
                      depreciationCostPerKm: newDeprec.depreciationCostPerKm,
                    };
                    setFormData(next);
                    onUpdateProfile(next);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Taxa Base de Depreciação Anual
                </label>
                <select
                  value={currentBaseAnnualRate}
                  onChange={(e) => {
                    const rate = parseFloat(e.target.value) || 10;
                    const newDeprec = calculateVehicleDepreciation({
                      fipeValue: currentFipeValue,
                      baseAnnualRate: rate,
                      projectedAnnualKm: currentProjectedKm,
                      workingDaysPerYear,
                    });
                    const next: DriverProfile = {
                      ...formData,
                      annualDepreciationRate: rate,
                      depreciationCostPerKm: newDeprec.depreciationCostPerKm,
                    };
                    setFormData(next);
                    onUpdateProfile(next);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-rose-500"
                >
                  <option value={8}>8% a.a. (Baixa desvalorização)</option>
                  <option value={10}>10% a.a. (Média do mercado)</option>
                  <option value={12}>12% a.a. (Alta desvalorização)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  KM Anual Projetado
                </label>
                <input
                  type="number"
                  step="1000"
                  value={formData.projectedAnnualKm || 36000}
                  onChange={(e) => {
                    const km = parseInt(e.target.value, 10) || 36000;
                    const newDeprec = calculateVehicleDepreciation({
                      fipeValue: currentFipeValue,
                      baseAnnualRate: currentBaseAnnualRate,
                      projectedAnnualKm: km,
                      workingDaysPerYear,
                    });
                    const next: DriverProfile = {
                      ...formData,
                      projectedAnnualKm: km,
                      depreciationCostPerKm: newDeprec.depreciationCostPerKm,
                    };
                    setFormData(next);
                    onUpdateProfile(next);
                  }}
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>

            {/* Calculated Results Summary Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-zinc-800 text-xs">
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-rose-500/30">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Depreciação / KM</span>
                <strong className="text-sm sm:text-base font-black text-rose-400">
                  {formatCurrency(estimatedDepreciationCostPerKm)}
                </strong>
                <span className="text-[9px] text-zinc-500 block">por km rodado</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Perda Anual FIPE</span>
                <strong className="text-sm sm:text-base font-black text-white">
                  {formatCurrency(depreciationCalc.annualLoss)}
                </strong>
                <span className="text-[9px] text-zinc-500 block">por ano</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Perda Mensal</span>
                <strong className="text-sm sm:text-base font-black text-white">
                  {formatCurrency(depreciationCalc.monthlyLoss)}
                </strong>
                <span className="text-[9px] text-zinc-500 block">por mês</span>
              </div>

              <div className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase font-bold">Taxa Efetiva</span>
                <strong className="text-sm sm:text-base font-black text-amber-300">
                  {depreciationCalc.effectiveAnnualRate.toFixed(2)}%
                </strong>
                <span className="text-[9px] text-zinc-500 block">com aceleração por KM</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION B: DETALHAMENTO DAS MANUTENÇÕES (PREVENTIVA, CORRETIVA E PREDITIVA) */}
      {(activeSubSection === 'all' || activeSubSection === 'maintenance') && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-xl space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-zinc-800 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-orange-500/20 text-orange-400">
                  <Wrench className="w-4 h-4" />
                </span>
                <h3 className="text-base sm:text-lg font-black text-white tracking-tight">
                  Plano & Campos de Manutenção do Veículo
                </h3>
              </div>
              <p className="text-xs text-zinc-400 mt-1">
                Configure os valores e intervalos para que entrem diretamente nos custos operacionais (R$/km) e
                possam gerar despesas e tarefas no checklist.
              </p>
            </div>

            {/* Category Filter Tabs */}
            <div className="flex items-center gap-1.5 bg-zinc-950 p-1 rounded-xl border border-zinc-800 overflow-x-auto text-xs shrink-0">
              <button
                type="button"
                onClick={() => setActiveMaintCategory('all')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMaintCategory === 'all'
                    ? 'bg-zinc-800 text-white'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Todas ({maintenanceItemsList.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveMaintCategory('preventiva')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMaintCategory === 'preventiva'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Preventiva ({preventivaItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveMaintCategory('corretiva')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMaintCategory === 'corretiva'
                    ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Corretiva ({corretivaItems.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveMaintCategory('preditiva')}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                  activeMaintCategory === 'preditiva'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                Preditiva ({preditivaItems.length})
              </button>
            </div>
          </div>

          {/* Maintenance Groups Total Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-emerald-500/30">
              <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                1. Preventiva (Óleo, Filtros, Freios, etc.)
              </span>
              <div className="text-lg font-black text-white mt-1">
                {formatCurrency(sumPreventiva)}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">/ km</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">5 itens cadastrados</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-amber-500/30">
              <span className="text-[10px] uppercase font-bold text-amber-400 block">
                2. Corretiva (Ruídos, Vazamentos, etc.)
              </span>
              <div className="text-lg font-black text-white mt-1">
                {formatCurrency(sumCorretiva)}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">/ km</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">7 itens cadastrados</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-sky-500/30">
              <span className="text-[10px] uppercase font-bold text-sky-400 block">
                3. Preditiva (Pneus, Correia, Bateria)
              </span>
              <div className="text-lg font-black text-white mt-1">
                {formatCurrency(sumPreditiva)}
                <span className="text-[10px] text-zinc-500 font-normal ml-1">/ km</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">3 itens cadastrados</span>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-orange-500/40 bg-gradient-to-br from-zinc-950 to-orange-950/20">
              <span className="text-[10px] uppercase font-bold text-orange-400 block">
                Custo Total de Manutenção
              </span>
              <div className="text-xl font-black text-orange-400 mt-1">
                {formatCurrency(calculatedItemsMaintenanceCostPerKm)}
                <span className="text-xs text-zinc-400 font-normal ml-1">/ km</span>
              </div>
              <span className="text-[10px] text-zinc-400 block mt-0.5">
                {formData.syncMaintenanceCostFromItems ? '✓ Ativo no custo do veículo' : 'Definição manual ativa'}
              </span>
            </div>
          </div>

          {/* Detailed Items List */}
          <div className="space-y-3">
            {/* GROUP 1: MANUTENÇÃO PREVENTIVA */}
            {(activeMaintCategory === 'all' || activeMaintCategory === 'preventiva') && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 pt-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                    Manutenção Preventiva
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    • Itens programados para prevenir falhas e manter a garantia
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {preventivaItems.map((item) => (
                    <MaintenanceItemCard
                      key={item.id}
                      item={item}
                      currentEffectiveKm={currentEffectiveKm}
                      onToggleActive={() => handleToggleItemActive(item.id)}
                      onEdit={() => setIsEditingItem(item)}
                      onCreateExpense={() => handleCreateExpenseFromItem(item)}
                      onCreateTask={() => handleCreateTaskFromItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* GROUP 2: MANUTENÇÃO CORRETIVA */}
            {(activeMaintCategory === 'all' || activeMaintCategory === 'corretiva') && (
              <div className="space-y-2 pt-3">
                <div className="flex items-center gap-2 pt-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400">
                    Manutenção Corretiva
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    • Reparo de problemas visíveis, ruídos inesperados e falhas mecânicas
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {corretivaItems.map((item) => (
                    <MaintenanceItemCard
                      key={item.id}
                      item={item}
                      currentEffectiveKm={currentEffectiveKm}
                      onToggleActive={() => handleToggleItemActive(item.id)}
                      onEdit={() => setIsEditingItem(item)}
                      onCreateExpense={() => handleCreateExpenseFromItem(item)}
                      onCreateTask={() => handleCreateTaskFromItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* GROUP 3: MANUTENÇÃO PREDITIVA */}
            {(activeMaintCategory === 'all' || activeMaintCategory === 'preditiva') && (
              <div className="space-y-2 pt-3">
                <div className="flex items-center gap-2 pt-2">
                  <Sparkles className="w-4 h-4 text-sky-400" />
                  <h4 className="text-xs font-bold uppercase tracking-wider text-sky-400">
                    Manutenção Preditiva
                  </h4>
                  <span className="text-[11px] text-zinc-500">
                    • Acompanhamento do desgaste de peças vitais antes da quebra
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                  {preditivaItems.map((item) => (
                    <MaintenanceItemCard
                      key={item.id}
                      item={item}
                      currentEffectiveKm={currentEffectiveKm}
                      onToggleActive={() => handleToggleItemActive(item.id)}
                      onEdit={() => setIsEditingItem(item)}
                      onCreateExpense={() => handleCreateExpenseFromItem(item)}
                      onCreateTask={() => handleCreateTaskFromItem(item)}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Item Modal */}
      {isEditingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h4 className="font-bold text-white text-sm flex items-center gap-2">
                <Wrench className="w-4 h-4 text-orange-400" />
                Ajustar Item de Manutenção
              </h4>
              <button
                type="button"
                onClick={() => setIsEditingItem(null)}
                className="text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Fechar
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Item / Manutenção
                </label>
                <input
                  type="text"
                  value={isEditingItem.name}
                  onChange={(e) => setIsEditingItem({ ...isEditingItem, name: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Descrição / Especificação
                </label>
                <input
                  type="text"
                  value={isEditingItem.description}
                  onChange={(e) => setIsEditingItem({ ...isEditingItem, description: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Custo Estimado (R$)
                  </label>
                  <CurrencyInput
                    value={isEditingItem.estimatedCost}
                    onChange={(val) => setIsEditingItem({ ...isEditingItem, estimatedCost: val })}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Intervalo em KM
                  </label>
                  <input
                    type="number"
                    step="1000"
                    value={isEditingItem.intervalKm || ''}
                    placeholder="Ex: 10000"
                    onChange={(e) =>
                      setIsEditingItem({
                        ...isEditingItem,
                        intervalKm: parseInt(e.target.value, 10) || undefined,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-xs font-bold focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Custo Resultante por KM (R$/km)
                </label>
                <div className="p-2.5 bg-zinc-950 rounded-xl border border-zinc-800 text-xs text-orange-400 font-bold flex justify-between items-center">
                  <span>Contribuição por km:</span>
                  <span>
                    {isEditingItem.intervalKm && isEditingItem.intervalKm > 0
                      ? formatCurrency(isEditingItem.estimatedCost / isEditingItem.intervalKm)
                      : formatCurrency(isEditingItem.costPerKm)}
                    /km
                  </span>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-zinc-800">
              <button
                type="button"
                onClick={() => setIsEditingItem(null)}
                className="px-3 py-1.5 text-zinc-400 hover:text-white text-xs cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveItemEdit(isEditingItem)}
                className="px-4 py-1.5 bg-orange-500 hover:bg-orange-600 text-zinc-950 font-bold text-xs rounded-xl cursor-pointer"
              >
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Manual FIPE Modal */}
      {showManualFipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/85 backdrop-blur-sm animate-in fade-in">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-sm p-5 space-y-3 shadow-2xl">
            <h4 className="font-bold text-white text-sm">Inserir Valor FIPE Manualmente</h4>
            <p className="text-xs text-zinc-400">
              Informe o valor de mercado do seu carro conforme a Tabela FIPE ou apólice do seguro.
            </p>
            <input
              type="number"
              step="100"
              value={manualFipeInput}
              onChange={(e) => setManualFipeInput(e.target.value)}
              placeholder="Ex: 61129"
              className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-white font-bold text-sm focus:outline-none focus:border-rose-500"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowManualFipeModal(false)}
                className="px-3 py-1.5 text-zinc-400 text-xs"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleSaveManualFipe(parseFloat(manualFipeInput) || 0)}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                Salvar Valor FIPE
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface MaintenanceItemCardProps {
  item: MaintenanceItemConfig;
  currentEffectiveKm: number;
  onToggleActive: () => void;
  onEdit: () => void;
  onCreateExpense: () => void;
  onCreateTask: () => void;
}

const MaintenanceItemCard: React.FC<MaintenanceItemCardProps> = ({
  item,
  currentEffectiveKm,
  onToggleActive,
  onEdit,
  onCreateExpense,
  onCreateTask,
}) => {
  const isKmBased = item.intervalKm !== undefined && item.intervalKm > 0;

  return (
    <div
      className={`p-3.5 rounded-xl border transition-all ${
        item.isActive
          ? 'bg-zinc-950/80 border-zinc-800 hover:border-zinc-700'
          : 'bg-zinc-950/40 border-zinc-900 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5 min-w-0">
          <input
            type="checkbox"
            checked={item.isActive !== false}
            onChange={onToggleActive}
            title="Incluir/remover da composição de custo operacional por KM"
            className="mt-0.5 rounded border-zinc-700 text-orange-500 focus:ring-0 cursor-pointer"
          />
          <div>
            <h5 className="text-xs font-bold text-white truncate">{item.name}</h5>
            <p className="text-[11px] text-zinc-400 line-clamp-1">{item.description}</p>
          </div>
        </div>

        <div className="text-right shrink-0">
          <span className="text-xs font-black text-orange-400 block">
            {formatCurrency(item.costPerKm)}
            <span className="text-[9px] text-zinc-500 font-normal">/km</span>
          </span>
          <span className="text-[10px] text-zinc-400">
            {formatCurrency(item.estimatedCost)}
            {isKmBased ? ` / ${item.intervalKm?.toLocaleString('pt-BR')} km` : ' provisão'}
          </span>
        </div>
      </div>

      {/* Action shortcuts */}
      <div className="flex items-center justify-between gap-1.5 mt-3 pt-2 border-t border-zinc-900 text-[11px]">
        <button
          type="button"
          onClick={onEdit}
          className="text-zinc-500 hover:text-zinc-300 underline cursor-pointer"
        >
          Editar valores
        </button>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={onCreateTask}
            className="px-2 py-1 bg-zinc-900 hover:bg-zinc-800 text-sky-400 border border-zinc-800 rounded-lg font-medium cursor-pointer transition-colors"
            title="Adicionar ao Checklist de Tarefas"
          >
            + Checklist
          </button>
          <button
            type="button"
            onClick={onCreateExpense}
            className="px-2 py-1 bg-orange-500/10 hover:bg-orange-500/20 text-orange-300 border border-orange-500/30 rounded-lg font-bold cursor-pointer transition-colors"
            title="Lançar como despesa de manutenção"
          >
            Lançar Despesa
          </button>
        </div>
      </div>
    </div>
  );
};
