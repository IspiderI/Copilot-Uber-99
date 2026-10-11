import React, { useState, useEffect } from 'react';
import {
  X,
  Check,
  Fuel,
  DollarSign,
  Settings2,
  Trash2,
  Calculator,
  Info,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  ExpenseEntry,
  DriverProfile,
  ExpenseCategoryConfig,
  FuelTypeConfig,
  PlatformOption,
} from '../types';
import { getRelativeDate, DEFAULT_EXPENSE_CATEGORIES, DEFAULT_FUEL_TYPES, PLATFORMS } from '../data/constants';
import { getCategoryIcon } from './ManageExpenseCategoriesModal';
import { formatCurrency, formatBRLDecimal, parseBRLDecimal } from '../utils/helpers';
import { CurrencyInput } from './CurrencyInput';

interface QuickAddExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (expense: Omit<ExpenseEntry, 'id' | 'createdAt'>, editId?: string) => void;
  onDelete?: (id: string) => void;
  initialExpense?: ExpenseEntry | null;
  selectedDate: string;
  profile: DriverProfile;
  platforms?: PlatformOption[];
  categories?: ExpenseCategoryConfig[];
  fuelTypes?: FuelTypeConfig[];
  onOpenManageCategories?: () => void;
  onOpenManageFuelTypes?: () => void;
}

export const QuickAddExpenseModal: React.FC<QuickAddExpenseModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialExpense,
  selectedDate,
  profile,
  platforms,
  categories = DEFAULT_EXPENSE_CATEGORIES,
  fuelTypes = DEFAULT_FUEL_TYPES,
  onOpenManageCategories,
  onOpenManageFuelTypes,
}) => {
  // Helper to determine base price for a given fuel type
  const getFuelBasePrice = (fType: string): number => {
    const matchedFuel = fuelTypes.find((f) => f.id === fType);
    if (matchedFuel && matchedFuel.defaultPrice && matchedFuel.defaultPrice > 0) {
      return matchedFuel.defaultPrice;
    }
    if (profile.fuelPricePerLiter && profile.fuelPricePerLiter > 0) {
      return profile.fuelPricePerLiter;
    }
    return 3.89;
  };

  const [date, setDate] = useState<string>(() => initialExpense?.date || selectedDate || getRelativeDate(0));
  const [category, setCategory] = useState<string>(() => initialExpense?.category || 'combustivel');
  const [platformId, setPlatformId] = useState<string>(() => initialExpense?.platformId || 'all');
  const [amount, setAmount] = useState<string>(() =>
    initialExpense ? formatBRLDecimal(initialExpense.amount, 2) : ''
  );
  const [notes, setNotes] = useState<string>(() => initialExpense?.notes || '');
  const [liters, setLiters] = useState<string>(() =>
    initialExpense?.liters ? initialExpense.liters.toString() : ''
  );
  const [fuelType, setFuelType] = useState<string>(() =>
    initialExpense?.fuelType || profile.fuelType || 'etanol'
  );
  const [pricePerLiter, setPricePerLiter] = useState<string>(() => {
    if (initialExpense?.pricePerLiter) {
      return formatBRLDecimal(initialExpense.pricePerLiter, 2);
    }
    if (initialExpense?.amount && initialExpense?.liters && initialExpense.liters > 0) {
      return formatBRLDecimal(initialExpense.amount / initialExpense.liters, 2);
    }
    const f = initialExpense?.fuelType || profile.fuelType || 'etanol';
    return formatBRLDecimal(getFuelBasePrice(f), 2);
  });
  const [includeInCalculations, setIncludeInCalculations] = useState<boolean>(() =>
    initialExpense ? initialExpense.includeInCalculations !== false : true
  );
  const [showFuelExplanation, setShowFuelExplanation] = useState<boolean>(false);

  useEffect(() => {
    if (initialExpense) {
      setDate(initialExpense.date);
      setCategory(initialExpense.category);
      setPlatformId(initialExpense.platformId || 'all');
      setAmount(formatBRLDecimal(initialExpense.amount, 2));
      setNotes(initialExpense.notes || '');
      setLiters(initialExpense.liters ? initialExpense.liters.toString() : '');
      const fType = initialExpense.fuelType || profile.fuelType || 'etanol';
      setFuelType(fType);

      if (initialExpense.pricePerLiter) {
        setPricePerLiter(formatBRLDecimal(initialExpense.pricePerLiter, 2));
      } else if (initialExpense.amount && initialExpense.liters && initialExpense.liters > 0) {
        setPricePerLiter(formatBRLDecimal(initialExpense.amount / initialExpense.liters, 2));
      } else {
        setPricePerLiter(formatBRLDecimal(getFuelBasePrice(fType), 2));
      }

      setIncludeInCalculations(initialExpense.includeInCalculations !== false);
    } else {
      setDate(selectedDate || getRelativeDate(0));
      setCategory('combustivel');
      setPlatformId('all');
      setAmount('');
      setNotes('');
      setLiters('');
      const defaultFuel = profile.fuelType || 'etanol';
      setFuelType(defaultFuel);
      setPricePerLiter(formatBRLDecimal(getFuelBasePrice(defaultFuel), 2));
      setIncludeInCalculations(true);
    }
  }, [initialExpense, selectedDate, profile, isOpen]);

  if (!isOpen) return null;

  // Selected fuel config
  const currentFuelConfig = fuelTypes.find((f) => f.id === fuelType) || {
    id: fuelType,
    name: fuelType,
    unit: 'L',
    defaultPrice: parseFloat(pricePerLiter) || 3.89,
  };
  const unit = currentFuelConfig.unit || 'L';

  // Handle Fuel Type Change
  const handleFuelTypeChange = (newType: string) => {
    setFuelType(newType);
    const newBasePrice = getFuelBasePrice(newType);
    setPricePerLiter(newBasePrice.toFixed(2));

    const numAmount = parseFloat(amount) || 0;
    if (numAmount > 0 && newBasePrice > 0) {
      setLiters((numAmount / newBasePrice).toFixed(2));
    }
  };

  // Bidirectional calculations:
  // 1. When total amount changes
  const handleAmountChange = (val: string, parsedNum?: number) => {
    setAmount(val);
    if (category === 'combustivel') {
      const numTotal = parsedNum !== undefined ? parsedNum : parseBRLDecimal(val);
      const numPrice = parseBRLDecimal(pricePerLiter);
      if (numTotal > 0 && numPrice > 0) {
        setLiters((numTotal / numPrice).toFixed(2));
      } else if (!val) {
        setLiters('');
      }
    }
  };

  // 2. When price per liter changes
  const handlePricePerLiterChange = (val: string, parsedNum?: number) => {
    setPricePerLiter(val);
    const numPrice = parsedNum !== undefined ? parsedNum : parseBRLDecimal(val);
    const numTotal = parseBRLDecimal(amount);
    if (numPrice > 0 && numTotal > 0) {
      setLiters((numTotal / numPrice).toFixed(2));
    }
  };

  // 3. When liters change
  const handleLitersChange = (val: string) => {
    setLiters(val);
    const numLiters = parseFloat(val) || 0;
    const numPrice = parseBRLDecimal(pricePerLiter);
    if (numLiters > 0 && numPrice > 0) {
      setAmount((numLiters * numPrice).toFixed(2));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseBRLDecimal(amount);
    if (!numAmount || numAmount <= 0) return;

    const numLiters = category === 'combustivel' && liters ? parseFloat(liters) : undefined;
    const numPricePerLiter = category === 'combustivel' && pricePerLiter ? parseBRLDecimal(pricePerLiter) : undefined;

    onSave(
      {
        date,
        category,
        amount: numAmount,
        notes: notes.trim() || undefined,
        liters: numLiters,
        pricePerLiter: numPricePerLiter,
        fuelType: category === 'combustivel' ? fuelType : undefined,
        includeInCalculations,
        platformId: platformId === 'all' ? undefined : platformId,
      },
      initialExpense ? initialExpense.id : undefined
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
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg h-[94dvh] sm:h-auto max-h-[94dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950/95 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                {initialExpense ? 'Editar Despesa' : 'Lançar Despesa'}
              </h2>
              <p className="text-xs text-zinc-400">Combustível, alimentação, manutenção e outros gastos</p>
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

        {/* Form */}
        <form
          key={initialExpense ? `edit-exp-${initialExpense.id}` : `new-exp-${isOpen}`}
          onSubmit={handleSubmit}
          noValidate
          className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain"
        >
          {/* Include in Calculations Toggle */}
          <div className={`p-3 rounded-xl border transition-all ${
            includeInCalculations
              ? 'bg-emerald-500/10 border-emerald-500/30'
              : 'bg-amber-500/10 border-amber-500/30'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {includeInCalculations ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold text-white flex items-center gap-1.5">
                    <span>{includeInCalculations ? 'Incluído nos cálculos e relatórios' : 'Ignorado nos cálculos (apenas histórico)'}</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5 leading-tight">
                    {includeInCalculations
                      ? 'O valor será somado às despesas operacionais e abatido do lucro líquido.'
                      : 'Não abate do lucro líquido e não soma nos totais de despesas.'}
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

          {/* Date */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">Data do Gasto</label>
            <input
              id="input-expense-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Category selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-zinc-400">Categoria de Despesa</label>
              {onOpenManageCategories && (
                <button
                  type="button"
                  onClick={onOpenManageCategories}
                  className="flex items-center gap-1 text-[11px] font-bold text-rose-400 hover:text-rose-300 hover:underline cursor-pointer"
                >
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Gerenciar Categorias</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {categories.map((cat) => {
                const isSelected = category === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`btn-select-expense-cat-${cat.id}`}
                    type="button"
                    onClick={() => setCategory(cat.id)}
                    className={`flex flex-col items-center justify-center p-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-rose-500/20 border-rose-500 text-white ring-1 ring-rose-500'
                        : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                    }`}
                  >
                    <span className={isSelected ? 'text-rose-400 mb-1' : `${cat.color || 'text-zinc-400'} mb-1`}>
                      {getCategoryIcon(cat.iconName)}
                    </span>
                    <span className="truncate w-full text-center">{cat.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Platform Attribution */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-zinc-400">
                Vincular ao Aplicativo (Opcional)
              </label>
              <span className="text-[10px] text-zinc-500 font-normal">
                {platformId === 'all' ? 'Despesa Geral (rateada entre os apps)' : 'Gasto exclusivo deste app'}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setPlatformId('all')}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                  platformId === 'all'
                    ? 'bg-zinc-800 text-white border-zinc-600 shadow-sm'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Geral (Todos os Apps)
              </button>
              {(platforms || PLATFORMS).map((p) => {
                const isSel = platformId === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPlatformId(p.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 border ${
                      isSel
                        ? 'bg-rose-950/40 text-white border-rose-500 ring-1 ring-rose-500/50 shadow-sm'
                        : 'bg-zinc-950 text-zinc-400 border-zinc-800 hover:text-white'
                    }`}
                  >
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: p.accentColor }}
                    />
                    <span>{p.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount input */}
          <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800">
            <label className="block text-xs font-bold text-zinc-300 mb-1">Valor Total Pago (R$)</label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xl font-bold text-zinc-500 z-10">
                R$
              </span>
              <CurrencyInput
                id="input-expense-amount"
                placeholder="0,00"
                value={amount}
                showQuickBadge={true}
                onChange={(num, formatted) => handleAmountChange(formatted, num)}
                autoFocus
                className="w-full bg-zinc-900 border border-zinc-700 rounded-xl pl-12 pr-4 py-3 text-2xl font-black text-rose-400 placeholder-zinc-700 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Special interactive section for FUEL */}
          {category === 'combustivel' && (
            <div className="bg-gradient-to-br from-amber-500/10 via-zinc-950 to-zinc-950 p-3.5 rounded-xl border border-amber-500/30 space-y-3">
              {/* Header with Explanation Button */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
                  <Fuel className="w-4 h-4" />
                  <span>Cálculo Automático & Transparente de Litros</span>
                </div>
                <button
                  type="button"
                  onClick={() => setShowFuelExplanation(!showFuelExplanation)}
                  className="text-[11px] text-amber-300/80 hover:text-amber-200 flex items-center gap-1 cursor-pointer"
                  title="De onde vem o cálculo?"
                >
                  <Info className="w-3.5 h-3.5" />
                  <span>De onde vem?</span>
                </button>
              </div>

              {/* Explanatory banner if toggled */}
              {showFuelExplanation && (
                <div className="p-3 rounded-lg bg-zinc-900/90 border border-amber-500/20 text-xs text-zinc-300 space-y-1.5 animate-in fade-in duration-150">
                  <div className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Calculator className="w-3.5 h-3.5" />
                    <span>Como o app calcula a quantidade de litros:</span>
                  </div>
                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                    A quantidade de litros é obtida pela fórmula: <strong>Valor Total (R$) ÷ Preço por Litro (R$/L)</strong>.
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    • <strong>De onde sai o preço por litro?</strong> Por padrão, ele vem do valor cadastrado no seu veículo ({formatCurrency(profile.fuelPricePerLiter)}/L) ou do combustível selecionado ({formatCurrency(currentFuelConfig.defaultPrice || 3.89)}/{unit}).
                  </p>
                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                    • <strong>Você tem controle total:</strong> você pode alterar o campo <em>Preço por Litro</em> livremente para o valor da bomba no posto, ou digitar diretamente a <em>Quantidade de Litros</em> na nota!
                  </p>
                </div>
              )}

              {/* Fuel Type & Price Per Liter */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[11px] font-semibold text-zinc-300">
                      Tipo de Combustível
                    </label>
                    {onOpenManageFuelTypes && (
                      <button
                        type="button"
                        onClick={onOpenManageFuelTypes}
                        className="text-[10px] text-amber-400 hover:text-amber-300 underline cursor-pointer"
                      >
                        Editar tipos
                      </button>
                    )}
                  </div>
                  <select
                    id="select-expense-fueltype"
                    value={fuelType}
                    onChange={(e) => handleFuelTypeChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2.5 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    {fuelTypes.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.unit || 'L'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                    Preço por {unit} (R$/{unit})
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-500 font-bold z-10">
                      R$
                    </span>
                    <CurrencyInput
                      id="input-expense-price-per-liter"
                      placeholder="Ex: 3,89"
                      value={pricePerLiter}
                      onChange={(num, formatted) => handlePricePerLiterChange(formatted, num)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-2.5 py-2 text-xs text-amber-400 font-bold focus:outline-none focus:border-amber-400"
                    />
                  </div>
                </div>
              </div>

              {/* Liters input */}
              <div>
                <label className="block text-[11px] font-semibold text-zinc-300 mb-1">
                  Quantidade Abastecida ({unit})
                </label>
                <div className="relative">
                  <input
                    id="input-expense-liters"
                    type="number"
                    step="0.01"
                    placeholder="Ex: 25.50"
                    value={liters}
                    onChange={(e) => handleLitersChange(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white font-semibold focus:outline-none focus:border-amber-400"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-medium">
                    {unit}
                  </span>
                </div>
              </div>

              {/* Live Formula Preview */}
              {parseFloat(amount) > 0 && parseFloat(pricePerLiter) > 0 && (
                <div className="p-2 rounded-lg bg-zinc-950/80 border border-zinc-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-zinc-400 flex items-center gap-1">
                    <Calculator className="w-3 h-3 text-amber-400" />
                    Cálculo:
                  </span>
                  <span className="text-amber-300 font-mono font-medium">
                    {formatCurrency(parseFloat(amount))} ÷ {formatCurrency(parseFloat(pricePerLiter))}/{unit} ={' '}
                    <strong>{liters || (parseFloat(amount) / parseFloat(pricePerLiter)).toFixed(2)} {unit}</strong>
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-xs font-semibold text-zinc-400 mb-1">
              Observações (Posto, detalhes ou fornecedor)
            </label>
            <input
              id="input-expense-notes"
              type="text"
              placeholder="Ex: Posto Ipiranga Av. Paulista, almoço, troca de óleo"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-2">
            <div>
              {initialExpense && onDelete && (
                <button
                  type="button"
                  onClick={() => {
                    onDelete(initialExpense.id);
                    onClose();
                  }}
                  className="flex items-center gap-1 text-xs font-semibold text-rose-400 hover:text-rose-300 p-2 rounded-lg hover:bg-rose-500/10 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Excluir Despesa</span>
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl border border-zinc-800 text-zinc-300 hover:bg-zinc-800 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                id="btn-submit-expense"
                type="submit"
                className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold shadow-lg shadow-rose-500/20 transition-all cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>{initialExpense ? 'Atualizar Despesa' : 'Salvar Despesa'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
