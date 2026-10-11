import React, { useState } from 'react';
import {
  X,
  Plus,
  Edit2,
  Trash2,
  Check,
  Fuel,
  Utensils,
  Sparkles,
  Wrench,
  Car,
  Shield,
  DollarSign,
  Coffee,
  ShoppingBag,
  Truck,
  Zap,
  Layers,
  Tag,
  AlertCircle,
} from 'lucide-react';
import { ExpenseCategoryConfig } from '../types';

interface ManageExpenseCategoriesModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: ExpenseCategoryConfig[];
  onAddCategory: (cat: ExpenseCategoryConfig) => void;
  onUpdateCategory: (cat: ExpenseCategoryConfig) => void;
  onDeleteCategory: (id: string) => void;
}

const AVAILABLE_ICONS: Array<{ name: string; label: string; icon: React.ReactNode }> = [
  { name: 'Fuel', label: 'Combustível', icon: <Fuel className="w-4 h-4" /> },
  { name: 'Utensils', label: 'Alimentação', icon: <Utensils className="w-4 h-4" /> },
  { name: 'Sparkles', label: 'Lavagem', icon: <Sparkles className="w-4 h-4" /> },
  { name: 'Wrench', label: 'Manutenção', icon: <Wrench className="w-4 h-4" /> },
  { name: 'Car', label: 'Veículo/Aluguel', icon: <Car className="w-4 h-4" /> },
  { name: 'Shield', label: 'Seguro/IPVA', icon: <Shield className="w-4 h-4" /> },
  { name: 'DollarSign', label: 'Taxas/Pedágio', icon: <DollarSign className="w-4 h-4" /> },
  { name: 'Coffee', label: 'Lanche/Café', icon: <Coffee className="w-4 h-4" /> },
  { name: 'ShoppingBag', label: 'Compras/Itens', icon: <ShoppingBag className="w-4 h-4" /> },
  { name: 'Truck', label: 'Frete/Guincho', icon: <Truck className="w-4 h-4" /> },
  { name: 'Zap', label: 'Elétrica/Bateria', icon: <Zap className="w-4 h-4" /> },
  { name: 'Layers', label: 'Geral/Outros', icon: <Layers className="w-4 h-4" /> },
];

const COLOR_PRESETS = [
  { label: 'Âmbar', color: 'text-amber-400', bg: 'bg-amber-500/20' },
  { label: 'Rosa/Coral', color: 'text-rose-400', bg: 'bg-rose-500/20' },
  { label: 'Azul Claro', color: 'text-sky-400', bg: 'bg-sky-500/20' },
  { label: 'Laranja', color: 'text-orange-400', bg: 'bg-orange-500/20' },
  { label: 'Índigo/Roxo', color: 'text-indigo-400', bg: 'bg-indigo-500/20' },
  { label: 'Púrpura', color: 'text-purple-400', bg: 'bg-purple-500/20' },
  { label: 'Esmeralda', color: 'text-emerald-400', bg: 'bg-emerald-500/20' },
  { label: 'Cinza/Neutro', color: 'text-zinc-400', bg: 'bg-zinc-500/20' },
  { label: 'Ciano', color: 'text-cyan-400', bg: 'bg-cyan-500/20' },
];

export const getCategoryIcon = (iconName?: string) => {
  switch (iconName) {
    case 'Fuel':
      return <Fuel className="w-4 h-4" />;
    case 'Utensils':
      return <Utensils className="w-4 h-4" />;
    case 'Sparkles':
      return <Sparkles className="w-4 h-4" />;
    case 'Wrench':
      return <Wrench className="w-4 h-4" />;
    case 'Car':
      return <Car className="w-4 h-4" />;
    case 'Shield':
      return <Shield className="w-4 h-4" />;
    case 'DollarSign':
      return <DollarSign className="w-4 h-4" />;
    case 'Coffee':
      return <Coffee className="w-4 h-4" />;
    case 'ShoppingBag':
      return <ShoppingBag className="w-4 h-4" />;
    case 'Truck':
      return <Truck className="w-4 h-4" />;
    case 'Zap':
      return <Zap className="w-4 h-4" />;
    default:
      return <Layers className="w-4 h-4" />;
  }
};

export const ManageExpenseCategoriesModal: React.FC<ManageExpenseCategoriesModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onUpdateCategory,
  onDeleteCategory,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form fields
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('Layers');
  const [selectedColor, setSelectedColor] = useState('text-rose-400');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setSelectedIcon('Layers');
    setSelectedColor('text-rose-400');
    setErrorMsg('');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleOpenEdit = (cat: ExpenseCategoryConfig) => {
    setEditingId(cat.id);
    setName(cat.name);
    setSelectedIcon(cat.iconName || 'Layers');
    setSelectedColor(cat.color || 'text-rose-400');
    setErrorMsg('');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome da categoria é obrigatório.');
      return;
    }

    if (editingId) {
      const existing = categories.find((c) => c.id === editingId);
      onUpdateCategory({
        id: editingId,
        name: name.trim(),
        iconName: selectedIcon,
        color: selectedColor,
        isDefault: existing?.isDefault,
      });
    } else {
      const id = 'cat_' + Date.now();
      onAddCategory({
        id,
        name: name.trim(),
        iconName: selectedIcon,
        color: selectedColor,
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
            <div className="p-2 rounded-lg bg-rose-500/20 text-rose-400">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Categorias de Despesas
              </h2>
              <p className="text-xs text-zinc-400">Adicione, edite ou exclua categorias de gastos</p>
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
          {/* Action button if form not open */}
          {!isFormOpen && (
            <button
              onClick={handleOpenAdd}
              className="w-full flex items-center justify-center gap-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 font-bold border border-rose-500/40 rounded-xl py-3 px-4 text-xs transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Criar Nova Categoria de Despesa</span>
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
                  {editingId ? 'Editar Categoria' : 'Nova Categoria'}
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
                  Nome da Categoria *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Café & Lanches, Estacionamento, Multas"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoFocus
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Ícone Representativo
                </label>
                <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5 max-h-32 overflow-y-auto p-1 bg-zinc-900/50 rounded-lg border border-zinc-800">
                  {AVAILABLE_ICONS.map((item) => (
                    <button
                      key={item.name}
                      type="button"
                      onClick={() => setSelectedIcon(item.name)}
                      className={`p-2 rounded-lg flex flex-col items-center justify-center gap-1 text-[10px] transition-colors cursor-pointer ${
                        selectedIcon === item.name
                          ? 'bg-rose-500/30 border border-rose-500 text-white'
                          : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
                      }`}
                    >
                      <span>{item.icon}</span>
                      <span className="truncate w-full text-center">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-zinc-400 mb-1">
                  Cor da Categoria
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.color}
                      type="button"
                      onClick={() => setSelectedColor(preset.color)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1.5 cursor-pointer transition-all ${
                        selectedColor === preset.color
                          ? 'border-white ring-1 ring-white bg-zinc-900'
                          : 'border-zinc-800 bg-zinc-900/50 text-zinc-400'
                      }`}
                    >
                      <span className={`w-2.5 h-2.5 rounded-full ${preset.color.replace('text-', 'bg-')}`} />
                      <span className={preset.color}>{preset.label}</span>
                    </button>
                  ))}
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
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold transition-colors cursor-pointer shadow-md shadow-rose-500/20"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingId ? 'Atualizar Categoria' : 'Salvar Categoria'}</span>
                </button>
              </div>
            </form>
          )}

          {/* List of categories */}
          <div className="space-y-2">
            <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Categorias Cadastradas ({categories.length})
            </h3>

            <div className="divide-y divide-zinc-800/80 rounded-xl border border-zinc-800 bg-zinc-950/60 overflow-hidden">
              {categories.map((cat) => {
                const isConfirmingDelete = deleteConfirmId === cat.id;

                return (
                  <div
                    key={cat.id}
                    className="p-3 flex items-center justify-between gap-3 hover:bg-zinc-900/40 transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-8 h-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0 ${
                          cat.color || 'text-rose-400'
                        }`}
                      >
                        {getCategoryIcon(cat.iconName)}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate flex items-center gap-1.5">
                          <span>{cat.name}</span>
                          {cat.id === 'combustivel' && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30">
                              Combustível
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate">ID: {cat.id}</div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isConfirmingDelete ? (
                        <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
                          <span className="text-[11px] text-rose-400 font-semibold">Excluir?</span>
                          <button
                            onClick={() => {
                              onDeleteCategory(cat.id);
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
                            onClick={() => handleOpenEdit(cat)}
                            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                            title="Editar categoria"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {categories.length > 1 && (
                            <button
                              onClick={() => setDeleteConfirmId(cat.id)}
                              className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                              title="Excluir categoria"
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
