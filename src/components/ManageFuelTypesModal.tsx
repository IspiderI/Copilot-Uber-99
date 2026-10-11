import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Fuel,
  AlertCircle,
  Zap,
} from 'lucide-react';
import { FuelTypeConfig } from '../types';
import { formatCurrency, parseBRLDecimal } from '../utils/helpers';
import { CurrencyInput } from './CurrencyInput';

interface ManageFuelTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
  fuelTypes: FuelTypeConfig[];
  onAddFuelType: (fuel: FuelTypeConfig) => void;
  onUpdateFuelType: (fuel: FuelTypeConfig) => void;
  onDeleteFuelType: (id: string) => void;
}

export const ManageFuelTypesModal: React.FC<ManageFuelTypesModalProps> = ({
  isOpen,
  onClose,
  fuelTypes,
  onAddFuelType,
  onUpdateFuelType,
  onDeleteFuelType,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('L');
  const [defaultPrice, setDefaultPrice] = useState('3.89');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setUnit('L');
    setDefaultPrice('3.89');
    setErrorMsg('');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleOpenEdit = (fuel: FuelTypeConfig) => {
    setEditingId(fuel.id);
    setName(fuel.name);
    setUnit(fuel.unit || 'L');
    setDefaultPrice(fuel.defaultPrice !== undefined ? fuel.defaultPrice.toString() : '');
    setErrorMsg('');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do combustível é obrigatório.');
      return;
    }

    const parsedPrice = parseBRLDecimal(defaultPrice);

    if (editingId) {
      onUpdateFuelType({
        id: editingId,
        name: name.trim(),
        unit: unit.trim() || 'L',
        defaultPrice: parsedPrice > 0 ? parsedPrice : undefined,
      });
    } else {
      const id = 'fuel_' + Date.now();
      onAddFuelType({
        id,
        name: name.trim(),
        unit: unit.trim() || 'L',
        defaultPrice: parsedPrice > 0 ? parsedPrice : undefined,
      });
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg h-[92dvh] sm:h-auto max-h-[92dvh] sm:max-h-[90vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950/95 shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
              <Fuel className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Tipos de Combustível
              </h2>
              <p className="text-xs text-zinc-400">Personalize combustíveis, unidades e preços de referência</p>
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

        {/* Content */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {!isFormOpen && (
            <button
              onClick={handleOpenAdd}
              className="w-full flex items-center justify-center gap-2 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold border border-amber-500/40 rounded-xl py-3 px-4 text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Adicionar Tipo de Combustível</span>
            </button>
          )}

          {/* Form */}
          {isFormOpen && (
            <form
              onSubmit={handleSave}
              className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800">
                <span className="text-xs font-bold text-white">
                  {editingId ? 'Editar Tipo de Combustível' : 'Novo Tipo de Combustível'}
                </span>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-zinc-400 hover:text-white text-xs cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              {errorMsg && (
                <div className="p-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Nome do Combustível *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Etanol, Gasolina Podium, GNV, Diesel S10"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Unidade de Medida
                  </label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
                  >
                    <option value="L">Litros (L)</option>
                    <option value="m³">Metros Cúbicos (m³ - GNV)</option>
                    <option value="kWh">Quilowatt-hora (kWh - Elétrico)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                    Preço Padrão de Referência (R$)
                  </label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-500 z-10">
                      R$
                    </span>
                    <CurrencyInput
                      placeholder="Ex: 3,89"
                      value={defaultPrice}
                      onChange={(_num, formatted) => setDefaultPrice(formatted)}
                      className="w-full bg-zinc-900 border border-zinc-800 rounded-lg pl-8 pr-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400 font-bold"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-500 block mt-0.5">
                    Preço base usado para calcular litros automaticamente
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-lg border border-zinc-800 text-zinc-300 text-xs font-semibold hover:bg-zinc-800 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-zinc-950 text-xs font-bold transition-colors cursor-pointer shadow-md shadow-amber-500/20"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingId ? 'Atualizar Combustível' : 'Salvar Combustível'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of fuel types */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Tipos Cadastrados ({fuelTypes.length})
            </h3>

            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              {fuelTypes.map((fuel) => {
                const isConfirmingDelete = deleteConfirmId === fuel.id;

                return (
                  <div
                    key={fuel.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 text-amber-400">
                        {fuel.unit === 'kWh' ? <Zap className="w-4 h-4" /> : <Fuel className="w-4 h-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{fuel.name}</span>
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-zinc-800 text-zinc-300 border border-zinc-700">
                            {fuel.unit || 'L'}
                          </span>
                        </div>
                        <div className="text-[11px] text-zinc-400">
                          Preço padrão:{' '}
                          <span className="text-amber-400 font-semibold">
                            {fuel.defaultPrice ? `${formatCurrency(fuel.defaultPrice)}/${fuel.unit || 'L'}` : 'Não definido'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[11px] text-rose-400 font-semibold">Excluir?</span>
                          <button
                            onClick={() => {
                              onDeleteFuelType(fuel.id);
                              setDeleteConfirmId(null);
                            }}
                            className="px-2 py-1 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded cursor-pointer"
                          >
                            Sim
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(null)}
                            className="px-2 py-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-[10px] font-bold rounded cursor-pointer"
                          >
                            Não
                          </button>
                        </div>
                      ) : (
                        <>
                          <button
                            onClick={() => handleOpenEdit(fuel)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar combustível"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {fuelTypes.length > 1 && (
                            <button
                              onClick={() => setDeleteConfirmId(fuel.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Excluir combustível"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-zinc-800 bg-zinc-950 flex justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
