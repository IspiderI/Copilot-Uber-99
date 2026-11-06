import { PlatformConfig, DriverProfile, EarningsEntry, ExpenseEntry, DriverTask, ExpenseCategoryConfig, FuelTypeConfig, MaintenanceItemConfig } from '../types';

export const PLATFORMS: PlatformConfig[] = [
  {
    id: 'uber',
    name: 'Uber',
    tag: 'UberX / Flash / Black',
    category: 'ambos',
    bgColor: 'bg-zinc-900',
    borderColor: 'border-zinc-700',
    textColor: 'text-white',
    accentColor: '#FFFFFF',
    iconName: 'Car',
  },
  {
    id: '99',
    name: '99 App',
    tag: '99Pop / 99Moto / Entrega',
    category: 'ambos',
    bgColor: 'bg-amber-500/15',
    borderColor: 'border-amber-500/40',
    textColor: 'text-amber-400',
    accentColor: '#F59E0B',
    iconName: 'Zap',
  },
  {
    id: 'indrive',
    name: 'inDrive',
    tag: 'Viagens & Cargas',
    category: 'corrida',
    bgColor: 'bg-emerald-500/15',
    borderColor: 'border-emerald-500/40',
    textColor: 'text-emerald-400',
    accentColor: '#10B981',
    iconName: 'Navigation',
  },
  {
    id: 'mercadolivre',
    name: 'Mercado Livre',
    tag: 'Envios Extra / Entregas',
    category: 'entrega',
    bgColor: 'bg-yellow-400/15',
    borderColor: 'border-yellow-400/40',
    textColor: 'text-yellow-300',
    accentColor: '#FACC15',
    iconName: 'Package',
  },
  {
    id: 'ifood',
    name: 'iFood',
    tag: 'Entregas Rápidas',
    category: 'entrega',
    bgColor: 'bg-red-500/15',
    borderColor: 'border-red-500/40',
    textColor: 'text-red-400',
    accentColor: '#EF4444',
    iconName: 'ShoppingBag',
  },
  {
    id: 'lalamove',
    name: 'Lalamove',
    tag: 'Fretes & Carretos',
    category: 'entrega',
    bgColor: 'bg-orange-500/15',
    borderColor: 'border-orange-500/40',
    textColor: 'text-orange-400',
    accentColor: '#F97316',
    iconName: 'Truck',
  },
  {
    id: 'particular',
    name: 'Particular',
    tag: 'Clientes Fixos / Direto',
    category: 'corrida',
    bgColor: 'bg-indigo-500/15',
    borderColor: 'border-indigo-500/40',
    textColor: 'text-indigo-400',
    accentColor: '#818CF8',
    iconName: 'UserCheck',
  },
  {
    id: 'outros',
    name: 'Outros Apps',
    tag: 'Borzo / Rappi / Loggi',
    category: 'ambos',
    bgColor: 'bg-cyan-500/15',
    borderColor: 'border-cyan-500/40',
    textColor: 'text-cyan-400',
    accentColor: '#06B6D4',
    iconName: 'Layers',
  },
];

export const DEFAULT_MAINTENANCE_ITEMS: MaintenanceItemConfig[] = [
  // 1. Manutenção Preventiva
  {
    id: 'prev-oleo',
    name: 'Troca de óleo do motor e filtro',
    category: 'preventiva',
    description: 'Óleo lubrificante 5W30/0W20 + filtro de óleo lubrificante',
    estimatedCost: 260.0,
    intervalKm: 10000,
    costPerKm: 0.026,
    isActive: true,
  },
  {
    id: 'prev-filtros',
    name: 'Filtros (Ar, Combustível e Cabine/Ar-condicionado)',
    category: 'preventiva',
    description: 'Filtro de ar do motor, combustível e ar-condicionado',
    estimatedCost: 150.0,
    intervalKm: 10000,
    costPerKm: 0.015,
    isActive: true,
  },
  {
    id: 'prev-freios',
    name: 'Sistema de freios',
    category: 'preventiva',
    description: 'Pastilhas dianteiras, discos e fluido de freio DOT4',
    estimatedCost: 390.0,
    intervalKm: 25000,
    costPerKm: 0.016,
    isActive: true,
  },
  {
    id: 'prev-arrefecimento',
    name: 'Sistema de arrefecimento',
    category: 'preventiva',
    description: 'Líquido de arrefecimento, aditivo orgânico e mangueiras',
    estimatedCost: 190.0,
    intervalKm: 30000,
    costPerKm: 0.006,
    isActive: true,
  },
  {
    id: 'prev-velas',
    name: 'Velas de ignição',
    category: 'preventiva',
    description: 'Jogo de velas de ignição (e cabos) para queima eficiente e consumo baixo',
    estimatedCost: 210.0,
    intervalKm: 30000,
    costPerKm: 0.007,
    isActive: true,
  },

  // 2. Manutenção Corretiva
  {
    id: 'corr-suspensao',
    name: 'Barulhos na suspensão',
    category: 'corretiva',
    description: 'Bieletas, buchas de bandeja, pivôs e terminais de direção',
    estimatedCost: 450.0,
    costPerKm: 0.018,
    isActive: true,
  },
  {
    id: 'corr-vazamentos',
    name: 'Vazamentos de fluidos no chão',
    category: 'corretiva',
    description: 'Retentores, juntas de cárter/tampa de válvulas ou conexões',
    estimatedCost: 320.0,
    costPerKm: 0.012,
    isActive: true,
  },
  {
    id: 'corr-luzes-painel',
    name: 'Luzes de alerta acesas no painel',
    category: 'corretiva',
    description: 'Diagnóstico com scanner OBD2, injeção eletrônica e sensores',
    estimatedCost: 260.0,
    costPerKm: 0.010,
    isActive: true,
  },
  {
    id: 'corr-partida',
    name: 'Dificuldades para dar a partida',
    category: 'corretiva',
    description: 'Motor de arranque, automático de partida ou relé',
    estimatedCost: 310.0,
    costPerKm: 0.012,
    isActive: true,
  },
  {
    id: 'corr-lampada',
    name: 'Troca de uma lâmpada queimada',
    category: 'corretiva',
    description: 'Lâmpadas de farol H4/H7, lanternas traseiras, setas e freio',
    estimatedCost: 45.0,
    costPerKm: 0.002,
    isActive: true,
  },
  {
    id: 'corr-amortecedor',
    name: 'Substituição de um amortecedor estourado',
    category: 'corretiva',
    description: 'Par de amortecedores dianteiros/traseiros, batentes e coifas',
    estimatedCost: 650.0,
    costPerKm: 0.022,
    isActive: true,
  },
  {
    id: 'corr-motor-aquecimento',
    name: 'Reparo no motor após um superaquecimento',
    category: 'corretiva',
    description: 'Plaina de cabeçote, junta metálica e teste de estanqueidade',
    estimatedCost: 850.0,
    costPerKm: 0.015,
    isActive: true,
  },

  // 3. Manutenção Preditiva
  {
    id: 'pred-pneus',
    name: 'Pneus',
    category: 'preditiva',
    description: 'Alinhamento 3D, balanceamento, rodízio e jogo de pneus novos',
    estimatedCost: 1600.0,
    intervalKm: 50000,
    costPerKm: 0.032,
    isActive: true,
  },
  {
    id: 'pred-correia',
    name: 'Correia dentada',
    category: 'preditiva',
    description: 'Kit correia sincronizadora dentada, tensor e bomba d’água preventiva',
    estimatedCost: 620.0,
    intervalKm: 50000,
    costPerKm: 0.012,
    isActive: true,
  },
  {
    id: 'pred-bateria',
    name: 'Bateria',
    category: 'preditiva',
    description: 'Bateria selada de 50Ah a 60Ah com garantia de 18 a 24 meses',
    estimatedCost: 440.0,
    intervalKm: 40000,
    costPerKm: 0.011,
    isActive: true,
  },
];

export const DEFAULT_PROFILE: DriverProfile = {
  driverName: 'Marcos Silva',
  vehicleModel: 'Chevrolet Onix 1.0 Flex',
  vehiclePlate: 'BRA2E19',
  vehicleCurrentKm: 78450,
  vehicleOwnershipType: 'alugado',
  vehicleMonthlyPayment: 2100.0, // R$ 2.100,00 mensal
  fuelType: 'etanol',
  kmPerLiter: 10.2,
  fuelPricePerLiter: 3.89,
  maintenanceCostPerKm: 0.18, // Pneus, troca de óleo, freios, suspensão
  vehicleBrand: 'GM - Chevrolet',
  vehicleYear: 2022,
  vehicleFipeValue: 61129.0, // R$ 61.129,00
  vehicleFipeCode: '004519-5',
  vehicleFipeReference: 'setembro de 2026',
  annualDepreciationRate: 10, // 10% a.a. (intervalo comum 8% a 12%)
  projectedAnnualKm: 36000, // 36.000 km ao ano para motorista de app
  depreciationCostPerKm: 0.223, // R$/km calculado da depreciação
  fixedDailyCost: 0, // outros custos diários
  workdaysOfWeek: [1, 2, 3, 4, 5, 6], // 1=Seg a 6=Sáb (6 dias por semana)
  targetDailyGross: 350.0,
  targetDailyHours: 8.0,
  minAcceptableRatePerKm: 2.2,
  minAcceptableRatePerHour: 40.0,
  maintenanceItems: DEFAULT_MAINTENANCE_ITEMS,
  syncMaintenanceCostFromItems: true,
};

export const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategoryConfig[] = [
  { id: 'abastecimento', name: 'Abastecimento', iconName: 'Fuel', color: 'text-amber-400', isDefault: true },
  { id: 'combustivel_rodagem', name: 'Combustível automático da rodagem', iconName: 'Fuel', color: 'text-sky-400', isDefault: true },
  { id: 'alimentacao', name: 'Alimentação', iconName: 'Utensils', color: 'text-rose-400', isDefault: true },
  { id: 'lavagem', name: 'Lavagem', iconName: 'Sparkles', color: 'text-sky-400', isDefault: true },
  { id: 'manutencao', name: 'Manutenção', iconName: 'Wrench', color: 'text-orange-400', isDefault: true },
  { id: 'aluguel_carro', name: 'Aluguel do Carro', iconName: 'Car', color: 'text-indigo-400', isDefault: true },
  { id: 'seguro_ipva', name: 'Seguro / IPVA', iconName: 'Shield', color: 'text-purple-400', isDefault: true },
  { id: 'estacionamento_pedagio', name: 'Pedágio / Estac.', iconName: 'DollarSign', color: 'text-emerald-400', isDefault: true },
  { id: 'outros', name: 'Outros Custos', iconName: 'Layers', color: 'text-zinc-400', isDefault: true },
];

export const DEFAULT_FUEL_TYPES: FuelTypeConfig[] = [
  { id: 'etanol', name: 'Etanol (Álcool)', unit: 'L', defaultPrice: 3.89 },
  { id: 'gasolina', name: 'Gasolina Comum', unit: 'L', defaultPrice: 5.99 },
  { id: 'gasolina_aditivada', name: 'Gasolina Aditivada', unit: 'L', defaultPrice: 6.19 },
  { id: 'gnv', name: 'GNV (Gás Natural)', unit: 'm³', defaultPrice: 4.49 },
  { id: 'diesel', name: 'Diesel S10', unit: 'L', defaultPrice: 5.89 },
  { id: 'eletrico', name: 'Recarga Elétrica', unit: 'kWh', defaultPrice: 1.80 },
];

// Function to generate relative dates based on local user calendar (avoids UTC timezone shift)
export const getRelativeDate = (offsetDays: number = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() - offsetDays);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Retorna intervalo exato do mês passado (dia 1 ao último dia)
export const getLastMonthRange = (): { start: string; end: string; label: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed: 0 = Jan, 9 = Out
  const prevDate = new Date(year, month - 1, 1);
  const prevYear = prevDate.getFullYear();
  const prevMonth = prevDate.getMonth();
  const lastDay = new Date(prevYear, prevMonth + 1, 0).getDate();
  const monthStr = String(prevMonth + 1).padStart(2, '0');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return {
    start: `${prevYear}-${monthStr}-01`,
    end: `${prevYear}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
    label: `${monthNames[prevMonth]} de ${prevYear}`,
  };
};

// Retorna intervalo do mês atual (dia 1 até hoje ou fim do mês)
export const getCurrentMonthRange = (): { start: string; end: string; label: string } => {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const lastDay = new Date(year, month + 1, 0).getDate();
  const monthStr = String(month + 1).padStart(2, '0');
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  return {
    start: `${year}-${monthStr}-01`,
    end: `${year}-${monthStr}-${String(lastDay).padStart(2, '0')}`,
    label: `${monthNames[month]} de ${year}`,
  };
};

// Retorna data formatada no mês anterior (ex: dia 5 do mês passado)
export const getPreviousMonthDate = (dayOfMonth: number): string => {
  const now = new Date();
  const prevDate = new Date(now.getFullYear(), now.getMonth() - 1, dayOfMonth);
  const y = prevDate.getFullYear();
  const m = String(prevDate.getMonth() + 1).padStart(2, '0');
  const d = String(dayOfMonth).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

export const INITIAL_EARNINGS: EarningsEntry[] = [
  // Hoje
  {
    id: 'earn-1',
    date: getRelativeDate(0),
    platformId: 'uber',
    grossAmount: 184.5,
    ridesCount: 9,
    onlineHours: 4.2,
    kmDriven: 82,
    tipsOrBonus: 15.0,
    shift: 'manha',
    notes: 'Manhã produtiva na Zona Sul com dinâmico bom',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'earn-2',
    date: getRelativeDate(0),
    platformId: '99',
    grossAmount: 112.8,
    ridesCount: 5,
    onlineHours: 2.5,
    kmDriven: 48,
    tipsOrBonus: 5.0,
    shift: 'tarde',
    notes: 'Duas corridas boas 99Pop',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'earn-3',
    date: getRelativeDate(0),
    platformId: 'indrive',
    grossAmount: 75.0,
    ridesCount: 3,
    onlineHours: 1.5,
    kmDriven: 31,
    tipsOrBonus: 0,
    shift: 'tarde',
    notes: 'Corrida negociada direto pro centro',
    createdAt: new Date().toISOString(),
  },
  // Ontem
  {
    id: 'earn-4',
    date: getRelativeDate(1),
    platformId: 'mercadolivre',
    grossAmount: 220.0,
    ridesCount: 38,
    onlineHours: 5.0,
    kmDriven: 65,
    tipsOrBonus: 20.0,
    shift: 'manha',
    notes: 'Rota Envios Extra galpão Cajamar',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'earn-5',
    date: getRelativeDate(1),
    platformId: 'uber',
    grossAmount: 145.2,
    ridesCount: 7,
    onlineHours: 3.2,
    kmDriven: 60,
    tipsOrBonus: 8.0,
    shift: 'noite',
    notes: 'Pico da noite volta pra casa',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  // 2 dias atrás
  {
    id: 'earn-6',
    date: getRelativeDate(2),
    platformId: 'uber',
    grossAmount: 198.0,
    ridesCount: 11,
    onlineHours: 5.2,
    kmDriven: 94,
    tipsOrBonus: 12.0,
    shift: 'integral',
    notes: 'Dia corrido chuva e tarifa dinâmica',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'earn-7',
    date: getRelativeDate(2),
    platformId: '99',
    grossAmount: 135.5,
    ridesCount: 6,
    onlineHours: 3.0,
    kmDriven: 58,
    tipsOrBonus: 0,
    shift: 'noite',
    notes: 'Corridas aeroporto',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  // 3 dias atrás
  {
    id: 'earn-8',
    date: getRelativeDate(3),
    platformId: 'ifood',
    grossAmount: 95.0,
    ridesCount: 12,
    onlineHours: 3.5,
    kmDriven: 42,
    tipsOrBonus: 18.0,
    shift: 'noite',
    notes: 'Horário de janta entregas',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'earn-9',
    date: getRelativeDate(3),
    platformId: 'uber',
    grossAmount: 210.0,
    ridesCount: 10,
    onlineHours: 4.8,
    kmDriven: 88,
    tipsOrBonus: 10.0,
    shift: 'tarde',
    notes: 'Metrô e shoppings',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  // 4 dias atrás
  {
    id: 'earn-10',
    date: getRelativeDate(4),
    platformId: 'particular',
    grossAmount: 150.0,
    ridesCount: 2,
    onlineHours: 2.0,
    kmDriven: 50,
    tipsOrBonus: 20.0,
    shift: 'manha',
    notes: 'Viagem particular ida e volta consulta médica',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'earn-11',
    date: getRelativeDate(4),
    platformId: 'uber',
    grossAmount: 165.0,
    ridesCount: 8,
    onlineHours: 4.0,
    kmDriven: 70,
    tipsOrBonus: 5.0,
    shift: 'tarde',
    notes: 'Plantão tarde',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  // Corridas do Mês Passado (Setembro) para relatórios e filtros mensais
  {
    id: 'earn-m1',
    date: getPreviousMonthDate(5),
    platformId: 'uber',
    grossAmount: 310.0,
    ridesCount: 14,
    onlineHours: 7.0,
    kmDriven: 130,
    tipsOrBonus: 20.0,
    shift: 'integral',
    notes: 'Sexta-feira cheia mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5, 18, 0, 0).toISOString(),
  },
  {
    id: 'earn-m2',
    date: getPreviousMonthDate(6),
    platformId: '99',
    grossAmount: 245.0,
    ridesCount: 10,
    onlineHours: 5.5,
    kmDriven: 105,
    tipsOrBonus: 10.0,
    shift: 'tarde',
    notes: 'Sábado à tarde 99Pop',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 6, 20, 0, 0).toISOString(),
  },
  {
    id: 'earn-m3',
    date: getPreviousMonthDate(12),
    platformId: 'uber',
    grossAmount: 350.0,
    ridesCount: 15,
    onlineHours: 8.0,
    kmDriven: 145,
    tipsOrBonus: 25.0,
    shift: 'integral',
    notes: 'Plantão completo',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 12, 19, 0, 0).toISOString(),
  },
  {
    id: 'earn-m4',
    date: getPreviousMonthDate(13),
    platformId: 'indrive',
    grossAmount: 260.0,
    ridesCount: 9,
    onlineHours: 5.0,
    kmDriven: 110,
    tipsOrBonus: 15.0,
    shift: 'tarde',
    notes: 'Corridas aeroporto',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 13, 21, 0, 0).toISOString(),
  },
  {
    id: 'earn-m5',
    date: getPreviousMonthDate(19),
    platformId: 'uber',
    grossAmount: 335.0,
    ridesCount: 14,
    onlineHours: 7.5,
    kmDriven: 140,
    tipsOrBonus: 18.0,
    shift: 'integral',
    notes: 'Zona Norte e Centro',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 19, 18, 30, 0).toISOString(),
  },
  {
    id: 'earn-m6',
    date: getPreviousMonthDate(20),
    platformId: 'mercadolivre',
    grossAmount: 240.0,
    ridesCount: 40,
    onlineHours: 5.0,
    kmDriven: 70,
    tipsOrBonus: 10.0,
    shift: 'manha',
    notes: 'Envios Extra mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 20, 14, 0, 0).toISOString(),
  },
  {
    id: 'earn-m7',
    date: getPreviousMonthDate(26),
    platformId: 'uber',
    grossAmount: 365.0,
    ridesCount: 16,
    onlineHours: 8.0,
    kmDriven: 155,
    tipsOrBonus: 22.0,
    shift: 'integral',
    notes: 'Plantão fim de semana',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 26, 20, 0, 0).toISOString(),
  },
  {
    id: 'earn-m8',
    date: getPreviousMonthDate(27),
    platformId: '99',
    grossAmount: 285.0,
    ridesCount: 12,
    onlineHours: 6.0,
    kmDriven: 120,
    tipsOrBonus: 12.0,
    shift: 'tarde',
    notes: 'Corridas 99 mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 27, 21, 0, 0).toISOString(),
  },
];

export const INITIAL_EXPENSES: ExpenseEntry[] = [
  {
    id: 'exp-1',
    date: getRelativeDate(0),
    category: 'abastecimento',
    amount: 110.0,
    liters: 28.27,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Posto Shell - Tanque cheio Etanol R$ 3,89/L',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-2',
    date: getRelativeDate(0),
    category: 'alimentacao',
    amount: 28.5,
    notes: 'Almoço no prato feito + água mineral',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'exp-3',
    date: getRelativeDate(1),
    category: 'lavagem',
    amount: 35.0,
    notes: 'Ducha rápida com aspiração interna',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'exp-4',
    date: getRelativeDate(2),
    category: 'abastecimento',
    amount: 95.0,
    liters: 24.4,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Abastecimento diário',
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
  },
  {
    id: 'exp-5',
    date: getRelativeDate(3),
    category: 'estacionamento_pedagio',
    amount: 18.4,
    notes: 'Pedágio rodovia dos Imigrantes',
    createdAt: new Date(Date.now() - 86400000 * 3).toISOString(),
  },
  {
    id: 'exp-6',
    date: getRelativeDate(4),
    category: 'manutencao',
    amount: 80.0,
    notes: 'Troca de palhetas do limpador e alinhamento',
    createdAt: new Date(Date.now() - 86400000 * 4).toISOString(),
  },
  {
    id: 'exp-7',
    date: getRelativeDate(5),
    category: 'abastecimento',
    amount: 105.0,
    liters: 27.0,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Tanque cheio início da semana',
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
  },
  // Abastecimentos do Mês Passado (Setembro) para cálculo exato mensal do dia 1 ao 30
  {
    id: 'exp-m1',
    date: getPreviousMonthDate(5),
    category: 'abastecimento',
    amount: 126.43,
    liters: 32.5,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Posto Shell - 1º Abastecimento do mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 5, 8, 30, 0).toISOString(),
  },
  {
    id: 'exp-m2',
    date: getPreviousMonthDate(12),
    category: 'abastecimento',
    amount: 116.70,
    liters: 30.0,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Posto Ipiranga - 2º Abastecimento do mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 12, 8, 0, 0).toISOString(),
  },
  {
    id: 'exp-m3',
    date: getPreviousMonthDate(19),
    category: 'abastecimento',
    amount: 129.15,
    liters: 33.2,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Posto BR Petrobras - 3º Abastecimento do mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 19, 9, 0, 0).toISOString(),
  },
  {
    id: 'exp-m4',
    date: getPreviousMonthDate(26),
    category: 'abastecimento',
    amount: 123.70,
    liters: 31.8,
    pricePerLiter: 3.89,
    fuelType: 'etanol',
    notes: 'Posto Shell - 4º Abastecimento do mês passado',
    createdAt: new Date(new Date().getFullYear(), new Date().getMonth() - 1, 26, 8, 15, 0).toISOString(),
  },
];

export const INITIAL_TASKS: DriverTask[] = [
  {
    id: 'task-1',
    title: 'Calibrar pneus dianteiros (32 psi) e traseiros (34 psi)',
    category: 'veiculo',
    priority: 'alta',
    dueDate: getRelativeDate(0),
    completed: true,
    completedAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-2',
    title: 'Troca de Óleo 5W30 Sintético e Filtro',
    category: 'manutencao',
    priority: 'alta',
    dueDate: getRelativeDate(-3), // Daqui a 3 dias
    dueKm: 80000,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-3',
    title: 'Comprar suporte magnético novo para o celular',
    category: 'outro',
    priority: 'media',
    dueDate: getRelativeDate(-2),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-4',
    title: 'Renovação do seguro de acidentes pessoais para app',
    category: 'documentos',
    priority: 'alta',
    dueDate: getRelativeDate(-10),
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-5',
    title: 'Revisar pastilhas de freio dianteiras',
    category: 'manutencao',
    priority: 'media',
    dueKm: 82000,
    completed: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'task-6',
    title: 'Higienização e aspiração dos bancos',
    category: 'veiculo',
    priority: 'baixa',
    dueDate: getRelativeDate(-1),
    completed: true,
    completedAt: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(),
  },
];
