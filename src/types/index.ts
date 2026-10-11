export type PlatformId = string;

export interface PlatformConfig {
  id: PlatformId;
  name: string;
  tag: string;
  category: 'corrida' | 'entrega' | 'ambos';
  bgColor: string;
  borderColor: string;
  textColor: string;
  accentColor: string;
  iconName: string;
}

export type PlatformOption = PlatformConfig;

export type ShiftType = 'manha' | 'tarde' | 'noite' | 'madrugada' | 'integral';

export interface EarningsEntry {
  id: string;
  date: string; // YYYY-MM-DD
  platformId: PlatformId;
  grossAmount: number; // R$
  ridesCount: number;
  onlineHours: number; // decimal hours (ex: 4.5)
  kmDriven: number; // km
  tipsOrBonus: number; // R$
  shift: ShiftType;
  notes?: string;
  createdAt: string;
  includeInCalculations?: boolean; // Se false, não soma em faturamento, metas e médias
}

export interface ExpenseCategoryConfig {
  id: string;
  name: string;
  iconName?: string;
  color?: string;
  isDefault?: boolean;
}

export interface FuelTypeConfig {
  id: string;
  name: string;
  unit: string; // 'L' | 'm³' | 'kWh'
  defaultPrice?: number;
}

export type ExpenseCategory = string;

export interface ExpenseEntry {
  id: string;
  date: string; // YYYY-MM-DD
  category: string;
  amount: number; // R$
  notes?: string;
  liters?: number;
  pricePerLiter?: number;
  fuelType?: string;
  createdAt: string;
  includeInCalculations?: boolean; // Se false, não soma em despesas nem abate do lucro
  platformId?: string; // ID da plataforma vinculada ou vazio/'geral' para despesa compartilhada
}

export type TaskCategory = 'manutencao' | 'documentos' | 'veiculo' | 'financeiro' | 'outro';
export type TaskPriority = 'baixa' | 'media' | 'alta';

export interface DriverTask {
  id: string;
  title: string;
  category: TaskCategory;
  priority: TaskPriority;
  dueDate?: string; // YYYY-MM-DD
  dueKm?: number;
  completed: boolean;
  completedAt?: string;
  createdAt: string;
}

export type CopilotVerdict = 'green' | 'yellow' | 'red';

export interface CopilotCalculation {
  id: string;
  platform: PlatformId;
  offeredValue: number; // R$
  pickupDistanceKm: number; // km busca
  tripDistanceKm: number; // km viagem
  estimatedMinutes: number; // min
  totalDistanceKm: number;
  ratePerKm: number; // R$/km
  ratePerHour: number; // R$/hora
  operationalCost: number; // R$
  netProfit: number; // R$
  verdict: CopilotVerdict;
  verdictLabel: string;
  verdictReason: string;
  timestamp: string;
}

export type VehicleOwnershipType = 'proprio' | 'alugado' | 'financiado';

export interface DriverProfile {
  driverName: string;
  vehicleModel: string;
  vehiclePlate: string;
  vehicleCurrentKm: number;
  vehicleOwnershipType?: VehicleOwnershipType;
  vehicleMonthlyPayment?: number; // Valor mensal do carro se for alugado ou financiado
  fuelType: 'gasolina' | 'etanol' | 'gnv' | 'diesel' | 'eletrico';
  kmPerLiter: number;
  fuelPricePerLiter: number;
  maintenanceCostPerKm: number; // ex: 0.18
  // FIPE & Depreciação do Veículo
  vehicleBrand?: string; // ex: 'GM - Chevrolet'
  vehicleYear?: number; // ex: 2022
  vehicleFipeValue?: number; // Valor oficial Tabela Fipe em R$
  vehicleFipeCode?: string; // Código Fipe (ex: 004519-5)
  vehicleFipeReference?: string; // Mês de referência (ex: 'setembro de 2026')
  annualDepreciationRate?: number; // Taxa de depreciação anual % (padrão 8% a 12%, default: 10%)
  projectedAnnualKm?: number; // Quilometragem anual projetada (ex: 36000 km)
  depreciationCostPerKm?: number; // Custo de depreciação por KM em R$/km (ex: 0.22)
  fixedDailyCost: number; // outros custos diários (seguro, MEI, etc.)
  workdaysOfWeek?: number[]; // Dias da semana de trabalho: 0 = Dom, 1 = Seg, ..., 6 = Sáb. Padrão: [1,2,3,4,5,6] (Seg a Sáb)
  targetDailyGross: number; // ex: 350.00
  targetDailyHours: number; // ex: 8
  minAcceptableRatePerKm?: number; // opcional
  minAcceptableRatePerHour?: number; // opcional
  maintenanceItems?: MaintenanceItemConfig[]; // Lista de manutenções preventiva, corretiva e preditiva
  syncMaintenanceCostFromItems?: boolean; // Se true, o maintenanceCostPerKm é a soma calculada dos itens
}

export type MaintenanceCategoryType = 'preventiva' | 'corretiva' | 'preditiva';

export interface MaintenanceItemConfig {
  id: string;
  name: string;
  category: MaintenanceCategoryType;
  description: string;
  estimatedCost: number; // R$ custo estimado da manutenção/reserva
  intervalKm?: number; // Intervalo em km para preventiva/preditiva
  costPerKm: number; // R$/km gerado pelo item
  isActive: boolean; // Se entra na composição do custo por KM do veículo
  lastDoneKm?: number; // Odômetro em que foi realizada pela última vez
  notes?: string;
}
