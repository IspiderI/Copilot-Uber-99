import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Car,
  Fuel,
  Wrench,
  Target,
  Gauge,
  RotateCcw,
  Download,
  Upload,
  ShieldCheck,
  Database,
  DollarSign,
  Calendar,
  Clock,
  Sparkles,
  Info,
  TrendingDown,
  Search,
  ExternalLink,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
} from 'lucide-react';
import { DriverProfile, VehicleOwnershipType, EarningsEntry, ExpenseEntry, DriverTask } from '../types';
import {
  formatCurrency,
  formatBRLDecimal,
  parseBRLDecimal,
  countWorkingDaysInMonth,
  WORKDAY_OPTIONS,
} from '../utils/helpers';
import {
  fetchFipeBrands,
  fetchFipeModels,
  fetchFipeYears,
  fetchFipeVehicleValue,
  searchFipeAuto,
  calculateVehicleDepreciation,
  FipeBrand,
  FipeModel,
  FipeYear,
  FipeVehicleDetails,
  POPULAR_BRANDS,
} from '../utils/fipeService';
import { ConfirmModal } from './ConfirmModal';
import { CurrencyInput } from './CurrencyInput';

interface VehicleSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: DriverProfile;
  earnings?: EarningsEntry[];
  expenses?: ExpenseEntry[];
  tasks?: DriverTask[];
  onSaveProfile: (profile: DriverProfile) => void;
  onResetData: () => void;
  onExportData: (currentProfile?: DriverProfile) => void;
  onImportData: (jsonData: string) => {
    success: boolean;
    message: string;
    count?: { earnings: number; expenses: number; tasks: number };
  };
}

export const VehicleSettingsModal: React.FC<VehicleSettingsModalProps> = ({
  isOpen,
  onClose,
  profile,
  earnings = [],
  expenses = [],
  tasks = [],
  onSaveProfile,
  onResetData,
  onExportData,
  onImportData,
}) => {
  const [formData, setFormData] = useState<DriverProfile>(() => ({
    ...profile,
    vehicleOwnershipType: profile.vehicleOwnershipType || 'proprio',
    vehicleMonthlyPayment: profile.vehicleMonthlyPayment !== undefined ? profile.vehicleMonthlyPayment : 0,
    vehicleBrand: profile.vehicleBrand || 'GM - Chevrolet',
    vehicleYear: profile.vehicleYear || 2022,
    vehicleFipeValue: profile.vehicleFipeValue !== undefined ? profile.vehicleFipeValue : 61129,
    vehicleFipeCode: profile.vehicleFipeCode || '004519-5',
    vehicleFipeReference: profile.vehicleFipeReference || 'setembro de 2026',
    annualDepreciationRate: profile.annualDepreciationRate !== undefined ? profile.annualDepreciationRate : 10,
    projectedAnnualKm: profile.projectedAnnualKm || 36000,
    depreciationCostPerKm: profile.depreciationCostPerKm !== undefined ? profile.depreciationCostPerKm : 0.223,
    workdaysOfWeek:
      profile.workdaysOfWeek && profile.workdaysOfWeek.length > 0
        ? profile.workdaysOfWeek
        : [1, 2, 3, 4, 5, 6], // default 6 dias (Seg a Sáb)
  }));

  const [importStatus, setImportStatus] = useState<string>('');
  const [showResetConfirm, setShowResetConfirm] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'all' | 'vehicle' | 'targets' | 'backup'>('all');

  // FIPE online search state
  const [fipeSearchBrand, setFipeSearchBrand] = useState<string>(formData.vehicleBrand || 'GM - Chevrolet');
  const [fipeSearchModel, setFipeSearchModel] = useState<string>(formData.vehicleModel || 'Onix');
  const [fipeSearchYear, setFipeSearchYear] = useState<string>(
    formData.vehicleYear ? formData.vehicleYear.toString() : '2022'
  );
  const [isSearchingFipe, setIsSearchingFipe] = useState<boolean>(false);
  const [fipeSearchResult, setFipeSearchResult] = useState<FipeVehicleDetails | null>(null);
  const [fipeSearchError, setFipeSearchError] = useState<string | null>(null);

  // Manual modal prompt
  const [showManualFipeModal, setShowManualFipeModal] = useState<boolean>(false);
  const [manualFipeInput, setManualFipeInput] = useState<string>(
    formData.vehicleFipeValue ? formData.vehicleFipeValue.toString() : ''
  );

  // Dynamic FIPE lists for dropdown selection
  const [brandList, setBrandList] = useState<FipeBrand[]>(POPULAR_BRANDS);
  const [selectedBrandCode, setSelectedBrandCode] = useState<string>('23');
  const [modelList, setModelList] = useState<FipeModel[]>([]);
  const [selectedModelCode, setSelectedModelCode] = useState<string>('');
  const [yearList, setYearList] = useState<FipeYear[]>([]);
  const [selectedYearCode, setSelectedYearCode] = useState<string>('');
  const [useDropdownMode, setUseDropdownMode] = useState<boolean>(false);
  const [isLoadingModels, setIsLoadingModels] = useState<boolean>(false);
  const [isLoadingYears, setIsLoadingYears] = useState<boolean>(false);

  // Load brands on open
  useEffect(() => {
    if (isOpen) {
      fetchFipeBrands().then((b) => {
        if (b && b.length > 0) setBrandList(b);
      });
    }
  }, [isOpen]);

  // Load models when selectedBrandCode changes
  useEffect(() => {
    if (selectedBrandCode && useDropdownMode) {
      setIsLoadingModels(true);
      fetchFipeModels(selectedBrandCode)
        .then((m) => {
          setModelList(m);
          if (m.length > 0) {
            setSelectedModelCode(m[0].codigo.toString());
          } else {
            setSelectedModelCode('');
          }
        })
        .finally(() => setIsLoadingModels(false));
    }
  }, [selectedBrandCode, useDropdownMode]);

  // Load years when model changes
  useEffect(() => {
    if (selectedBrandCode && selectedModelCode && useDropdownMode) {
      setIsLoadingYears(true);
      fetchFipeYears(selectedBrandCode, selectedModelCode)
        .then((y) => {
          setYearList(y);
          if (y.length > 0) {
            setSelectedYearCode(y[0].codigo);
          } else {
            setSelectedYearCode('');
          }
        })
        .finally(() => setIsLoadingYears(false));
    }
  }, [selectedBrandCode, selectedModelCode, useDropdownMode]);

  if (!isOpen) return null;

  const handleChange = (field: keyof DriverProfile, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile({
      ...formData,
      depreciationCostPerKm: estimatedDepreciationCostPerKm,
    });
    onClose();
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const result = onImportData(content);
        if (result && result.message) {
          setImportStatus(result.message);
        } else {
          setImportStatus('Backup restaurado com sucesso!');
        }
        setTimeout(() => setImportStatus(''), 6000);
      } catch {
        setImportStatus('Erro ao ler ou processar arquivo JSON.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Workdays calculation
  const currentWorkdays = formData.workdaysOfWeek || [1, 2, 3, 4, 5, 6];
  const daysPerWeek = currentWorkdays.length;

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1; // 1-12
  const monthName = now.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  const workingDaysThisMonth = countWorkingDaysInMonth(currentYear, currentMonth, currentWorkdays);
  const workingDaysPerYear = workingDaysThisMonth * 12 || 300;

  // Real logged KM from earnings to calculate realistic annual projection
  const currentLoggedKm = earnings
    .filter((e) => e.includeInCalculations !== false)
    .reduce((sum, e) => sum + (e.kmDriven || 0), 0);
  const uniqueDatesWithKm = new Set(
    earnings
      .filter((e) => (e.kmDriven || 0) > 0 && e.includeInCalculations !== false)
      .map((e) => e.date)
  ).size;
  const realAvgDailyKm = uniqueDatesWithKm > 0 ? Math.round(currentLoggedKm / uniqueDatesWithKm) : 120;
  const realAnnualProjectedKm = Math.max(12000, realAvgDailyKm * workingDaysPerYear);

  // Depreciation Calculation with Market and Mileage Influence Factors
  const currentFipeValue = formData.vehicleFipeValue || 0;
  const currentBaseAnnualRate =
    formData.annualDepreciationRate !== undefined ? formData.annualDepreciationRate : 10;
  const currentProjectedKm = formData.projectedAnnualKm || realAnnualProjectedKm || 36000;

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

  // Fuel price calculation preview
  const estimatedFuelCostPerKm =
    formData.kmPerLiter && formData.kmPerLiter > 0
      ? (formData.fuelPricePerLiter || 0) / formData.kmPerLiter
      : 0;

  // Total Real Cost per KM (Combustível + Desgaste/Manutenção + Depreciação FIPE)
  const estimatedTotalCostPerKm =
    estimatedFuelCostPerKm + (formData.maintenanceCostPerKm || 0.18) + estimatedDepreciationCostPerKm;

  const isRentedOrFinanced =
    formData.vehicleOwnershipType === 'alugado' || formData.vehicleOwnershipType === 'financiado';
  const monthlyVehicleCost = isRentedOrFinanced ? formData.vehicleMonthlyPayment || 0 : 0;
  const dailyVehicleCost =
    isRentedOrFinanced && workingDaysThisMonth > 0 ? monthlyVehicleCost / workingDaysThisMonth : 0;

  const projectedMonthlyGross = (formData.targetDailyGross || 0) * workingDaysThisMonth;
  const projectedMonthlyHours = (formData.targetDailyHours || 0) * workingDaysThisMonth;

  const toggleWorkday = (dayNum: number) => {
    let next: number[];
    if (currentWorkdays.includes(dayNum)) {
      if (currentWorkdays.length === 1) return; // Prevent 0 days
      next = currentWorkdays.filter((d) => d !== dayNum);
    } else {
      next = [...currentWorkdays, dayNum].sort((a, b) => (a === 0 ? 7 : a) - (b === 0 ? 7 : b));
    }
    handleChange('workdaysOfWeek', next);
  };

  const setWorkdaysPreset = (presetDays: number[]) => {
    handleChange('workdaysOfWeek', presetDays);
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

        setFormData((prev) => ({
          ...prev,
          vehicleBrand: result!.Marca || prev.vehicleBrand,
          vehicleModel: result!.Modelo || prev.vehicleModel,
          vehicleYear: result!.AnoModelo || prev.vehicleYear,
          vehicleFipeValue: result!.numericValue,
          vehicleFipeCode: result!.CodigoFipe,
          vehicleFipeReference: result!.MesReferencia,
          depreciationCostPerKm: newDeprec.depreciationCostPerKm,
        }));
      } else {
        setFipeSearchError(
          'Não conseguimos localizar o veículo automaticamente na Tabela FIPE. Insira o valor manualmente ou consulte o site oficial veiculos.fipe.org.br.'
        );
        setManualFipeInput(formData.vehicleFipeValue ? formData.vehicleFipeValue.toString() : '');
        setShowManualFipeModal(true);
      }
    } catch (err) {
      setFipeSearchError(
        'Falha ao conectar com o serviço da FIPE. Você pode inserir o valor manualmente abaixo.'
      );
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

      setFormData((prev) => ({
        ...prev,
        vehicleFipeValue: val,
        depreciationCostPerKm: newDeprec.depreciationCostPerKm,
      }));
    }
    setShowManualFipeModal(false);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vehicle-settings-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/85 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-3xl max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950/80 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 id="vehicle-settings-title" className="text-base sm:text-lg font-bold text-white leading-tight">
                Configurações do Veículo & Custos Operacionais
              </h2>
              <p className="text-xs text-zinc-400">
                Consumo por KM, Tabela FIPE Oficial, Depreciação e Metas
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-white p-2 rounded-xl hover:bg-zinc-800 transition-colors cursor-pointer"
            title="Fechar configurações"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="px-4 sm:px-6 pt-3 pb-2 bg-zinc-950/40 border-b border-zinc-800/80 shrink-0 overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1.5 min-w-max text-xs font-semibold">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                activeTab === 'all'
                  ? 'bg-zinc-800 text-white font-bold border border-zinc-700'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
              }`}
            >
              Visão Completa
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('vehicle')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'vehicle'
                  ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Car className="w-3.5 h-3.5" />
              <span>1. Veículo</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('targets')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'targets'
                  ? 'bg-purple-400 text-zinc-950 shadow-md shadow-purple-400/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Target className="w-3.5 h-3.5" />
              <span>2. Metas & Dias</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('backup')}
              className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'backup'
                  ? 'bg-sky-400 text-zinc-950 shadow-md shadow-sky-400/20'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-800'
              }`}
            >
              <Database className="w-3.5 h-3.5" />
              <span>3. Backup</span>
            </button>
          </div>
        </div>

        {/* Scrollable Form Body */}
        <form
          id="vehicle-settings-form"
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-6 overscroll-contain"
        >
          {/* TAB 1: Driver & Vehicle */}
          {(activeTab === 'all' || activeTab === 'vehicle') && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  1. Dados do Motorista e do Veículo
                </h3>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {activeTab === 'all' ? 'Seção 1 de 4' : 'Passo 1 de 4'}
                </span>
              </div>

              {/* Ownership Type */}
              <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <label className="block text-xs font-bold text-zinc-200">
                  Qual é a condição do seu veículo de trabalho?
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <button
                    type="button"
                    onClick={() => handleChange('vehicleOwnershipType', 'proprio')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      formData.vehicleOwnershipType === 'proprio'
                        ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400 ring-2 ring-emerald-500/30 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="text-base mb-1">🚗</div>
                    <div>Próprio (Quitado)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('vehicleOwnershipType', 'alugado')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      formData.vehicleOwnershipType === 'alugado'
                        ? 'bg-amber-500/20 border-amber-500 text-amber-400 ring-2 ring-amber-500/30 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="text-base mb-1">🔑</div>
                    <div>Alugado (Locadora)</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleChange('vehicleOwnershipType', 'financiado')}
                    className={`p-3 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      formData.vehicleOwnershipType === 'financiado'
                        ? 'bg-purple-500/20 border-purple-500 text-purple-400 ring-2 ring-purple-500/30 shadow-md'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                    }`}
                  >
                    <div className="text-base mb-1">💳</div>
                    <div>Financiado (Parcelas)</div>
                  </button>
                </div>

                {isRentedOrFinanced && (
                  <div className="pt-2 border-t border-zinc-800/80 mt-2 space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4 text-amber-400" />
                        Valor Mensal do Carro (R$) *
                      </label>
                      <span className="text-[11px] text-amber-400 font-semibold">
                        {formData.vehicleOwnershipType === 'alugado'
                          ? 'Aluguel Locadora'
                          : 'Parcela do Financiamento'}
                      </span>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500">
                        R$
                      </span>
                      <CurrencyInput
                        id="input-vehicle-monthly-payment"
                        placeholder="Ex: 2.100,00"
                        value={formData.vehicleMonthlyPayment}
                        onChange={(val) => handleChange('vehicleMonthlyPayment', val)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-amber-400 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nome do Motorista
                  </label>
                  <input
                    id="input-driver-name"
                    type="text"
                    placeholder="Ex: João Silva"
                    value={formData.driverName}
                    onChange={(e) => handleChange('driverName', e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Marca do Veículo
                  </label>
                  <input
                    id="input-vehicle-brand"
                    type="text"
                    placeholder="Ex: GM - Chevrolet, Fiat, VW..."
                    value={formData.vehicleBrand || ''}
                    onChange={(e) => {
                      handleChange('vehicleBrand', e.target.value);
                      setFipeSearchBrand(e.target.value);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Modelo do Veículo
                  </label>
                  <input
                    id="input-vehicle-model"
                    type="text"
                    placeholder="Ex: Onix 1.0 Flex"
                    value={formData.vehicleModel}
                    onChange={(e) => {
                      handleChange('vehicleModel', e.target.value);
                      setFipeSearchModel(e.target.value);
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ano de Fabricação / Modelo
                  </label>
                  <input
                    id="input-vehicle-year"
                    type="number"
                    min="1990"
                    max="2030"
                    placeholder="Ex: 2022"
                    value={formData.vehicleYear || ''}
                    onChange={(e) => {
                      const yr = parseInt(e.target.value, 10) || undefined;
                      handleChange('vehicleYear', yr);
                      if (yr) setFipeSearchYear(yr.toString());
                    }}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Placa do Veículo
                  </label>
                  <input
                    id="input-vehicle-plate"
                    type="text"
                    placeholder="Ex: BRA2E19"
                    value={formData.vehiclePlate}
                    onChange={(e) => handleChange('vehiclePlate', e.target.value.toUpperCase())}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm uppercase focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1 flex items-center gap-1">
                    <Gauge className="w-3.5 h-3.5 text-emerald-400" />
                    KM Atual no Painel (Odômetro Base)
                  </label>
                  <input
                    id="input-vehicle-current-km"
                    type="number"
                    placeholder="Ex: 85200"
                    value={formData.vehicleCurrentKm || ''}
                    onChange={(e) =>
                      handleChange('vehicleCurrentKm', parseInt(e.target.value, 10) || 0)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                  <p className="text-[10px] text-zinc-500 mt-1">
                    Soma automaticamente com os km rodados das corridas
                  </p>
                </div>
              </div>

              {activeTab !== 'all' && (
                <div className="pt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => setActiveTab('targets')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-purple-500/30"
                  >
                    <span>Próximo: Metas de Trabalho & Escala Semanal →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Notice: Consumo, Custos por KM e Manutenções moved to Tarefas & Manutenções */}
          {activeTab === 'all' && (
            <div className="p-4 rounded-2xl bg-zinc-950/70 border border-amber-500/30 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
                  <Fuel className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-amber-300 block">
                    Consumo, Custos por KM e Plano de Manutenções
                  </span>
                  <span className="text-[11px] text-zinc-400">
                    Foram transferidos para a tela <strong>Tarefas e Manutenções</strong> para acompanhamento diário com manutenções preventiva, corretiva e preditiva!
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Metas de Trabalho */}
          {(activeTab === 'all' || activeTab === 'targets') && (
            <div className={`space-y-4 ${activeTab === 'all' ? 'pt-6 border-t border-zinc-800' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                  <Target className="w-4 h-4" />
                  2. Metas de Trabalho & Escala Semanal
                </h3>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {activeTab === 'all' ? 'Seção 2 de 3' : 'Passo 2 de 3'}
                </span>
              </div>

              {/* Days of the Week Selection */}
              <div className="bg-zinc-950/70 border border-zinc-800 p-4 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-bold text-zinc-200">
                      Dias da Semana que Pretendo Trabalhar
                    </label>
                    <p className="text-[11px] text-zinc-400">
                      Selecione de 1 a 7 dias (de segunda a domingo) para calcular seu mês
                    </p>
                  </div>
                  <span className="text-xs font-extrabold px-2.5 py-1 rounded-full bg-purple-500/20 border border-purple-500/30 text-purple-300">
                    {daysPerWeek} {daysPerWeek === 1 ? 'dia' : 'dias'}/semana
                  </span>
                </div>

                {/* Day selector toggles */}
                <div className="grid grid-cols-7 gap-1.5">
                  {WORKDAY_OPTIONS.map((opt) => {
                    const isSelected = currentWorkdays.includes(opt.day);
                    return (
                      <button
                        key={opt.day}
                        type="button"
                        onClick={() => toggleWorkday(opt.day)}
                        className={`flex flex-col items-center justify-center py-2.5 px-1 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-purple-500 text-zinc-950 border-purple-400 shadow-md shadow-purple-500/20'
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-white'
                        }`}
                      >
                        <span className="text-[11px] uppercase tracking-wider">{opt.short}</span>
                        <span
                          className={`text-[10px] font-normal ${
                            isSelected ? 'text-zinc-950/80 font-bold' : 'text-zinc-500'
                          }`}
                        >
                          {isSelected ? 'Sim' : 'Folga'}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Quick Presets */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-[11px] text-zinc-500 font-medium">Atalhos rápidos:</span>
                  <button
                    type="button"
                    onClick={() => setWorkdaysPreset([1, 2, 3, 4, 5])}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Seg a Sex (5 dias)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkdaysPreset([1, 2, 3, 4, 5, 6])}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Seg a Sáb (6 dias)
                  </button>
                  <button
                    type="button"
                    onClick={() => setWorkdaysPreset([0, 1, 2, 3, 4, 5, 6])}
                    className="px-2.5 py-1 rounded-lg bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-[11px] text-zinc-300 hover:text-white transition-colors cursor-pointer"
                  >
                    Todos os Dias (7 dias)
                  </button>
                </div>
              </div>

              {/* Automatic Month & Vehicle Calculation Card */}
              <div className="bg-gradient-to-br from-zinc-950 to-purple-950/20 border border-purple-500/30 p-4 rounded-2xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                  <Calendar className="w-4 h-4 text-purple-400" />
                  <span>Cálculo Automático com o Mês Atual ({monthName})</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[11px]">Dias de Plantão no Mês:</span>
                    <strong className="text-lg font-black text-white">
                      {workingDaysThisMonth} dias trabalhados
                    </strong>
                    <p className="text-[10px] text-zinc-500 mt-0.5">
                      Contagem real dos dias selecionados no calendário de {monthName}
                    </p>
                  </div>

                  <div className="bg-zinc-900/80 border border-zinc-800 p-3 rounded-xl">
                    <span className="text-zinc-400 block text-[11px]">
                      {isRentedOrFinanced
                        ? `Custo Diário do Veículo (${
                            formData.vehicleOwnershipType === 'alugado' ? 'Aluguel' : 'Parcela'
                          }):`
                        : 'Condição do Carro:'}
                    </span>
                    {isRentedOrFinanced ? (
                      <>
                        <strong className="text-lg font-black text-amber-400">
                          {formatCurrency(dailyVehicleCost)} / dia
                        </strong>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          {formatCurrency(monthlyVehicleCost)} dividido por {workingDaysThisMonth} dias
                        </p>
                      </>
                    ) : (
                      <>
                        <strong className="text-sm font-black text-emerald-400">
                          Carro Próprio Quitado
                        </strong>
                        <p className="text-[10px] text-zinc-500 mt-0.5">
                          Sem mensalidade de aluguel ou parcela ativa
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Targets */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Meta Diária de Faturamento (R$) *
                  </label>
                  <CurrencyInput
                    id="input-target-daily-gross"
                    placeholder="Ex: 350,00"
                    value={formData.targetDailyGross}
                    onChange={(val) => handleChange('targetDailyGross', val)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm font-bold text-purple-400 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Projeção no mês: <strong className="text-purple-300">{formatCurrency(projectedMonthlyGross)}</strong>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Meta Diária de Horas Online *
                  </label>
                  <input
                    id="input-target-daily-hours"
                    type="number"
                    step="any"
                    min="1"
                    max="16"
                    placeholder="Ex: 8.0"
                    value={formData.targetDailyHours || ''}
                    onChange={(e) =>
                      handleChange('targetDailyHours', parseFloat(e.target.value) || 0)
                    }
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <div className="text-[10px] text-zinc-500 mt-1">
                    Projeção no mês: <strong className="text-white">{projectedMonthlyHours}h</strong> online
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ganho Mínimo por KM (R$/km)
                  </label>
                  <CurrencyInput
                    id="input-min-rate-per-km"
                    placeholder="Ex: 2,20"
                    value={formData.minAcceptableRatePerKm}
                    onChange={(val) => handleChange('minAcceptableRatePerKm', val)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Corte para aprovação de corridas no semáforo
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ganho Mínimo por Hora (R$/h)
                  </label>
                  <CurrencyInput
                    id="input-min-rate-per-hour"
                    placeholder="Ex: 40,00"
                    value={formData.minAcceptableRatePerHour}
                    onChange={(val) => handleChange('minAcceptableRatePerHour', val)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:border-purple-500 transition-colors"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Ritmo mínimo esperado de rendimento
                  </span>
                </div>
              </div>

              {activeTab !== 'all' && (
                <div className="pt-2 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setActiveTab('vehicle')}
                    className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ← Voltar p/ Veículo
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('backup')}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 text-xs font-bold rounded-xl transition-colors cursor-pointer border border-sky-500/30"
                  >
                    <span>Próximo: Backup & Restauração →</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 4: Backup & Reset */}
          {(activeTab === 'all' || activeTab === 'backup') && (
            <div className={`space-y-4 ${activeTab === 'all' ? 'pt-6 border-t border-zinc-800' : ''}`}>
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-wider text-sky-400 flex items-center gap-1.5">
                  <Database className="w-4 h-4" />
                  4. Segurança, Backup e Dados
                </h3>
                <span className="text-[10px] text-zinc-500 font-medium">
                  {activeTab === 'all' ? 'Seção 3 de 3' : 'Passo 3 de 3'}
                </span>
              </div>

              {/* Guarantee Panel: 100% dos dados */}
              <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>Garantia de Backup Completo e Sem Perdas</span>
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    100% das informações
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400 leading-relaxed">
                  O download do backup salva todos os dados registrados no sistema para que nada fique faltando ao fazer o upload:
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Ganhos Salvos</span>
                    <strong className="text-sm font-black text-emerald-400">
                      {earnings.length} <span className="text-[10px] font-normal text-zinc-400">registros</span>
                    </strong>
                  </div>
                  <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Despesas Salvas</span>
                    <strong className="text-sm font-black text-rose-400">
                      {expenses.length} <span className="text-[10px] font-normal text-zinc-400">registros</span>
                    </strong>
                  </div>
                  <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Manutenções</span>
                    <strong className="text-sm font-black text-sky-400">
                      {tasks.length} <span className="text-[10px] font-normal text-zinc-400">tarefas</span>
                    </strong>
                  </div>
                  <div className="bg-zinc-900/90 p-2 rounded-lg border border-zinc-800">
                    <span className="text-zinc-500 text-[10px] block">Configurações</span>
                    <strong className="text-xs font-bold text-amber-300">
                      FIPE & Veículo
                    </strong>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Download className="w-4 h-4 text-emerald-400" />
                      Exportar Dados (Backup Completo)
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Gera e baixa um arquivo seguro (.JSON) contendo todo o seu histórico financeiro, veículo, custos e metas.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onExportData(formData)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar Backup Completo (.JSON)</span>
                  </button>
                </div>

                <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800 flex flex-col justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-sky-400" />
                      Restaurar Backup (Upload/Importar)
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Carregue o arquivo .json baixado anteriormente para restaurar todas as suas informações sem perder nenhum registro.
                    </p>
                  </div>
                  <label className="w-full flex items-center justify-center gap-2 py-2.5 px-3 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 rounded-xl text-xs font-bold text-sky-400 transition-colors cursor-pointer">
                    <Upload className="w-3.5 h-3.5" />
                    <span>Escolher Arquivo JSON</span>
                    <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
                  </label>
                </div>
              </div>

              {importStatus && (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-xs text-emerald-400 font-semibold text-center">
                  {importStatus}
                </div>
              )}

              {/* Danger Zone: Reset */}
              <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-rose-400 flex items-center gap-1.5">
                      <RotateCcw className="w-4 h-4" />
                      Redefinir para Padrões de Fábrica
                    </h4>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      Apaga os lançamentos salvos no navegador e restaura dados de demonstração.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowResetConfirm(true)}
                    className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500 text-rose-400 hover:text-white border border-rose-500/30 text-xs font-bold transition-all cursor-pointer whitespace-nowrap"
                  >
                    Resetar Dados
                  </button>
                </div>
              </div>

              {activeTab !== 'all' && (
                <div className="pt-2 flex items-center">
                  <button
                    type="button"
                    onClick={() => setActiveTab('targets')}
                    className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                  >
                    ← Voltar p/ Metas de Trabalho
                  </button>
                </div>
              )}
            </div>
          )}
        </form>

        {/* Modal Actions Footer (Always Visible / Sticky) */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-t border-zinc-800 bg-zinc-950/95 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="submit"
            form="vehicle-settings-form"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Salvar Alterações</span>
          </button>
        </div>
      </div>

      {/* Manual FIPE Entry Prompt Modal */}
      {showManualFipeModal && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-rose-500/20 text-rose-400">
                  <TrendingDown className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Inserir Valor FIPE Manualmente</h3>
                  <p className="text-xs text-zinc-400">
                    Consulte o valor do veículo no site oficial ou informe manualmente
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowManualFipeModal(false)}
                className="text-zinc-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 text-xs space-y-2">
              <p className="text-zinc-300">
                Você pode verificar a cotação oficial no portal da FIPE em uma nova aba e digitar o valor abaixo:
              </p>
              <a
                href="http://veiculos.fipe.org.br/"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/30 hover:bg-sky-500/20 font-bold"
              >
                <span>Acessar http://veiculos.fipe.org.br/</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                const parsed = parseBRLDecimal(manualFipeInput);
                handleSaveManualFipe(parsed);
              }}
              className="space-y-4"
              noValidate
            >
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1">
                  Qual é o valor atual da Tabela FIPE do seu veículo? (R$)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-zinc-500 z-10">
                    R$
                  </span>
                  <CurrencyInput
                    placeholder="Ex: 44.281,00"
                    value={manualFipeInput}
                    showQuickBadge={true}
                    onChange={(val, formatted) =>
                      setManualFipeInput(formatted || (val > 0 ? val.toString() : ''))
                    }
                    autoFocus
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-10 pr-4 py-2.5 text-white font-bold text-base focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-zinc-400 mt-1.5">
                  <span>
                    Valor reconhecido:{' '}
                    <strong className="text-rose-400 font-bold">
                      {formatCurrency(parseBRLDecimal(manualFipeInput))}
                    </strong>
                  </span>
                  <span className="text-[10px] text-zinc-500">
                    Ex: digite 44281 que salva como 44.281,00
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowManualFipeModal(false)}
                  className="px-4 py-2 rounded-xl text-zinc-400 hover:text-white text-xs font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold rounded-xl shadow-md shadow-rose-500/20 cursor-pointer active:scale-95 transition-all"
                >
                  Confirmar Valor FIPE
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={showResetConfirm}
        onClose={() => setShowResetConfirm(false)}
        onConfirm={() => {
          setShowResetConfirm(false);
          onResetData();
          onClose();
        }}
        title="Redefinir todos os dados?"
        description="Esta ação irá restaurar os dados de fábrica do Rosida - Motorista. Todos os faturamentos e despesas inseridos serão apagados. Deseja continuar?"
        confirmLabel="Sim, Restaurar Dados"
        isDanger={true}
      />
    </div>
  );
};
