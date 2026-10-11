import React, { useState } from 'react';
import { X, Plus, Edit2, Trash2, Check, Car, Package, Layers, AlertCircle } from 'lucide-react';
import { PlatformConfig } from '../types';

interface ManagePlatformsModalProps {
  isOpen: boolean;
  onClose: () => void;
  platforms: PlatformConfig[];
  onAddPlatform: (platform: PlatformConfig) => void;
  onUpdatePlatform: (platform: PlatformConfig) => void;
  onDeletePlatform: (id: string) => void;
}

const COLOR_PRESETS = [
  {
    name: 'Verde Esmeralda',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    accentColor: '#10B981',
  },
  {
    name: 'Âmbar / Dourado',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    accentColor: '#F59E0B',
  },
  {
    name: 'Azul Claro',
    bgColor: 'bg-sky-500/15',
    borderColor: 'border-sky-500/40',
    textColor: 'text-sky-400',
    accentColor: '#0EA5E9',
  },
  {
    name: 'Roxo / Violeta',
    bgColor: 'bg-purple-500/15',
    borderColor: 'border-purple-500/40',
    textColor: 'text-purple-400',
    accentColor: '#A855F7',
  },
  {
    name: 'Vermelho / Coral',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    accentColor: '#EF4444',
  },
  {
    name: 'Laranja',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    accentColor: '#F97316',
  },
  {
    name: 'Ciano',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    accentColor: '#06B6D4',
  },
  {
    name: 'Preto / Cinza',
    bgColor: 'bg-zinc-800/60',
    borderColor: 'border-zinc-700',
    textColor: 'text-zinc-200',
    accentColor: '#E4E4E7',
  },
];

export const ManagePlatformsModal: React.FC<ManagePlatformsModalProps> = ({
  isOpen,
  onClose,
  platforms,
  onAddPlatform,
  onUpdatePlatform,
  onDeletePlatform,
}) => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [tag, setTag] = useState('');
  const [category, setCategory] = useState<'corrida' | 'entrega' | 'ambos'>('corrida');
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleOpenAdd = () => {
    setEditingId(null);
    setName('');
    setTag('');
    setCategory('corrida');
    setSelectedColorIndex(0);
    setErrorMsg('');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleOpenEdit = (p: PlatformConfig) => {
    setEditingId(p.id);
    setName(p.name);
    setTag(p.tag);
    setCategory(p.category);
    const colorIdx = COLOR_PRESETS.findIndex((c) => c.accentColor === p.accentColor);
    setSelectedColorIndex(colorIdx >= 0 ? colorIdx : 0);
    setErrorMsg('');
    setIsFormOpen(true);
    setDeleteConfirmId(null);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('O nome do aplicativo é obrigatório.');
      return;
    }

    const preset = COLOR_PRESETS[selectedColorIndex];
    if (editingId) {
      // Edit existing
      const existing = platforms.find((p) => p.id === editingId);
      if (!existing) return;
      onUpdatePlatform({
        ...existing,
        name: name.trim(),
        tag: tag.trim() || name.trim(),
        category,
        bgColor: preset.bgColor,
        borderColor: preset.borderColor,
        textColor: preset.textColor,
        accentColor: preset.accentColor,
      });
    } else {
      // Create new
      const newId = `app_${Date.now()}_${name.trim().toLowerCase().replace(/[^a-z0-9]/g, '')}`;
      onAddPlatform({
        id: newId,
        name: name.trim(),
        tag: tag.trim() || 'Serviços de transporte/entrega',
        category,
        bgColor: preset.bgColor,
        borderColor: preset.borderColor,
        textColor: preset.textColor,
        accentColor: preset.accentColor,
        iconName: category === 'entrega' ? 'Package' : 'Car',
      });
    }

    setIsFormOpen(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    if (platforms.length <= 1) {
      setErrorMsg('Você precisa ter pelo menos um aplicativo cadastrado.');
      return;
    }
    onDeletePlatform(id);
    setDeleteConfirmId(null);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm overflow-hidden"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-2xl w-full max-w-lg h-[92dvh] sm:h-auto max-h-[92dvh] sm:max-h-[85vh] shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-zinc-800 bg-zinc-950/95 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white leading-tight">
                Gerenciar Aplicativos
              </h2>
              <p className="text-xs text-zinc-400">Adicione, edite ou exclua opções de app</p>
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

        {/* Content Body */}
        <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-4 overscroll-contain">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Form to Add / Edit */}
          {isFormOpen ? (
            <form onSubmit={handleSave} className="bg-zinc-950/80 border border-zinc-800 p-4 rounded-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
                <h3 className="text-xs font-bold uppercase text-emerald-400">
                  {editingId ? 'Editar Aplicativo' : 'Novo Aplicativo'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Cancelar
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Nome do Aplicativo *
                </label>
                <input
                  type="text"
                  placeholder="Ex: Maxim, Borzo, Kangu, Táxi SP..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-emerald-500 transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Categoria
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  >
                    <option value="corrida">🚗 Corridas / Passageiros</option>
                    <option value="entrega">📦 Entregas / Cargas</option>
                    <option value="ambos">⚡ Ambos (Corrida & Entrega)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Descrição Curta / Subtítulo
                  </label>
                  <input
                    type="text"
                    placeholder="Ex: Cargas e Encomendas"
                    value={tag}
                    onChange={(e) => setTag(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-emerald-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  Cor de Identificação
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {COLOR_PRESETS.map((preset, idx) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => setSelectedColorIndex(idx)}
                      className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-medium transition-all cursor-pointer ${
                        selectedColorIndex === idx
                          ? `${preset.bgColor} ${preset.borderColor} ring-2 ring-emerald-500 text-white font-bold`
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      <span
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: preset.accentColor }}
                      />
                      <span className="truncate text-[11px]">{preset.name.split(' ')[0]}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsFormOpen(false)}
                  className="px-3 py-1.5 rounded-xl text-xs text-zinc-400 hover:text-white cursor-pointer"
                >
                  Voltar
                </button>
                <button
                  type="submit"
                  className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs shadow-md transition-colors cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>{editingId ? 'Salvar Edição' : 'Cadastrar App'}</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="flex items-center justify-between pb-1">
              <span className="text-xs text-zinc-400">
                Total de <strong className="text-white">{platforms.length}</strong> aplicativos cadastrados
              </span>
              <button
                type="button"
                onClick={handleOpenAdd}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-zinc-950 font-bold rounded-xl text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Adicionar Aplicativo</span>
              </button>
            </div>
          )}

          {/* List of Platforms */}
          <div className="space-y-2">
            {platforms.map((platform) => {
              const isDeleting = deleteConfirmId === platform.id;
              return (
                <div
                  key={platform.id}
                  className={`flex items-center justify-between p-3 rounded-xl border transition-all ${platform.bgColor} ${platform.borderColor}`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: platform.accentColor }}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm font-bold truncate ${platform.textColor}`}>
                          {platform.name}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-950/60 border border-zinc-800 text-zinc-400 shrink-0">
                          {platform.category === 'entrega'
                            ? 'Entrega'
                            : platform.category === 'corrida'
                            ? 'Corrida'
                            : 'Corrida & Entrega'}
                        </span>
                      </div>
                      <p className="text-[11px] text-zinc-400 truncate">{platform.tag}</p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1 shrink-0 ml-2">
                    {isDeleting ? (
                      <div className="flex items-center gap-1.5 bg-zinc-950/90 border border-rose-500/50 p-1 rounded-lg">
                        <span className="text-[10px] text-rose-400 font-semibold px-1">Excluir?</span>
                        <button
                          type="button"
                          onClick={() => handleDelete(platform.id)}
                          className="px-2 py-0.5 bg-rose-500 hover:bg-rose-600 text-white font-bold rounded text-[10px] cursor-pointer"
                        >
                          Sim
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(null)}
                          className="px-1.5 py-0.5 text-zinc-400 hover:text-white text-[10px] cursor-pointer"
                        >
                          Não
                        </button>
                      </div>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(platform)}
                          className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Editar aplicativo"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirmId(platform.id)}
                          className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                          title="Excluir aplicativo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 sm:px-6 py-3 border-t border-zinc-800 bg-zinc-950 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            Concluir
          </button>
        </div>
      </div>
    </div>
  );
};
