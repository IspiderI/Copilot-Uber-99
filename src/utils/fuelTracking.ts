import { ExpenseEntry, EarningsEntry, DriverProfile } from '../types';

export interface ContributingRide {
  id: string;
  date: string;
  platformId: string;
  kmDriven: number;
  grossAmount: number;
  ridesCount?: number;
  shift?: string;
  notes?: string;
  createdAt?: string;
}

export interface FuelCycle {
  id: string; // ID da despesa de combustível
  cycleNumber: number; // 1, 2, 3...
  fuelExpense: ExpenseEntry;
  nextFuelExpense?: ExpenseEntry;
  isCurrentTank: boolean; // true = último abastecimento realizado (tanque ativo em andamento)

  // Dados do abastecimento
  fillDate: string;
  fillTimestamp: number;
  liters: number;
  amount: number;
  pricePerLiter: number;
  fuelType: string;
  notes?: string;

  // Fechamento do ciclo (quando há próximo abastecimento)
  nextFillDate?: string;
  nextFillTimestamp?: number;

  // Quilometragem percorrida neste ciclo
  kmDriven: number;
  contributingRides: ContributingRide[];
  ridesCount: number;

  // Métricas de Consumo
  // Observação: cálculo do consumo é feito dividindo a distância percorrida (km) pela quantidade de litros abastecidos (L)
  kmPerLiter: number; // kmDriven / liters
  costPerKm: number; // amount / kmDriven

  // Projeções e Estimativas (para o tanque em andamento)
  expectedRangeKm: number; // liters * profile.kmPerLiter
  remainingKmEstimate: number; // Math.max(0, expectedRangeKm - kmDriven)
  tankPercentEstimated: number; // 0% a 100% de combustível restante estimado
  status: 'active' | 'completed';
}

export interface FuelTelemetrySummary {
  hasFuelEntries: boolean;
  totalFuelEntriesCount: number;
  currentCycle: FuelCycle | null;
  completedCycles: FuelCycle[];
  allCycles: FuelCycle[];

  // Estatísticas Globais
  totalLitersTracked: number;
  totalSpendTracked: number;
  totalKmTracked: number;
  
  // Médias Reais Consolidadas
  averageKmPerLiterCompleted: number; // Média ponderada dos ciclos finalizados
  averageCostPerKmCompleted: number; // Custo médio por km dos ciclos finalizados
  
  // Comparativo com Perfil do Veículo
  profileKmPerLiter: number;
  deltaVsProfile: number; // Positivo = mais econômico que o configurado

  // Recordes
  bestCycle: FuelCycle | null; // Maior Km/L
  worstCycle: FuelCycle | null; // Menor Km/L

  // Detalhamento por Tipo de Combustível (ex: Etanol vs Gasolina)
  byFuelType: Record<
    string,
    {
      fuelType: string;
      cyclesCount: number;
      totalLiters: number;
      totalKm: number;
      totalSpend: number;
      avgKmPerLiter: number;
      avgCostPerKm: number;
    }
  >;
}

/**
 * Converte data e createdAt em timestamp numérico confiável para ordenação cronológica
 */
export function getEntryTimestamp(dateStr: string, createdAtStr?: string): number {
  if (createdAtStr) {
    const t = new Date(createdAtStr).getTime();
    if (!isNaN(t)) {
      // Se a data ISO bater com dateStr, usa o timestamp exato de criação
      if (createdAtStr.startsWith(dateStr)) {
        return t;
      }
    }
  }
  // Padrão: meio-dia na data informada para evitar problemas de fuso horário
  return new Date(`${dateStr}T12:00:00`).getTime();
}

/**
 * Extrai litros de uma despesa de combustível com fallback inteligente
 */
export function getExpenseLiters(
  exp: ExpenseEntry,
  fallbackPricePerLiter: number = 4
): number {
  if (exp.liters && exp.liters > 0) {
    return exp.liters;
  }
  if (exp.pricePerLiter && exp.pricePerLiter > 0 && exp.amount > 0) {
    return Number((exp.amount / exp.pricePerLiter).toFixed(2));
  }
  if (exp.amount > 0 && fallbackPricePerLiter > 0) {
    return Number((exp.amount / fallbackPricePerLiter).toFixed(2));
  }
  return 0;
}

/**
 * Calcula todos os ciclos de consumo entre abastecimentos e o ciclo ativo atual
 */
export function calculateFuelCycles(
  expenses: ExpenseEntry[],
  earnings: EarningsEntry[],
  profile: DriverProfile
): FuelTelemetrySummary {
  // 1. Filtrar todas as despesas de combustível válidas
  const fuelExpenses = expenses
    .filter(
      (e) =>
        e.includeInCalculations !== false &&
        (e.category === 'combustivel' || (e.liters && e.liters > 0))
    )
    .map((e) => ({
      ...e,
      resolvedLiters: getExpenseLiters(e, profile.fuelPricePerLiter || 4),
      timestamp: getEntryTimestamp(e.date, e.createdAt),
    }))
    .filter((e) => e.resolvedLiters > 0);

  // Ordenar combustível cronologicamente do mais antigo para o mais recente
  fuelExpenses.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.timestamp - b.timestamp;
  });

  // 2. Filtrar todos os ganhos/corridas com KM rodados
  const validRides = earnings
    .filter((e) => e.includeInCalculations !== false && (e.kmDriven || 0) > 0)
    .map((e) => ({
      ...e,
      timestamp: getEntryTimestamp(e.date, e.createdAt),
    }));

  // Ordenar corridas cronologicamente
  validRides.sort((a, b) => {
    if (a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.timestamp - b.timestamp;
  });

  const totalFuelEntriesCount = fuelExpenses.length;

  if (totalFuelEntriesCount === 0) {
    return {
      hasFuelEntries: false,
      totalFuelEntriesCount: 0,
      currentCycle: null,
      completedCycles: [],
      allCycles: [],
      totalLitersTracked: 0,
      totalSpendTracked: 0,
      totalKmTracked: 0,
      averageKmPerLiterCompleted: 0,
      averageCostPerKmCompleted: 0,
      profileKmPerLiter: profile.kmPerLiter || 10,
      deltaVsProfile: 0,
      bestCycle: null,
      worstCycle: null,
      byFuelType: {},
    };
  }

  // 3. Montar os ciclos atribuindo as corridas de cada intervalo
  const cycles: FuelCycle[] = [];

  for (let i = 0; i < totalFuelEntriesCount; i++) {
    const currentFuel = fuelExpenses[i];
    const isCurrentTank = i === totalFuelEntriesCount - 1;
    const nextFuel = isCurrentTank ? undefined : fuelExpenses[i + 1];

    // Corridas que utilizaram o combustível deste abastecimento:
    // Começa na data/timestamp deste abastecimento e vai até antes do próximo abastecimento
    const cycleRides = validRides.filter((ride) => {
      // Se a corrida for antes deste abastecimento, descarta
      if (ride.date < currentFuel.date) {
        return false;
      }
      if (ride.date === currentFuel.date && currentFuel.createdAt && ride.createdAt) {
        // Se ambos tiverem createdAt na mesma data, verifica se a corrida ocorreu depois ou no mesmo momento
        // (tolerância de 5 min para lançamento simultâneo)
        if (ride.timestamp < currentFuel.timestamp - 300000) {
          return false;
        }
      }

      // Se há um próximo abastecimento, a corrida precisa ser anterior a ele
      if (nextFuel) {
        if (ride.date > nextFuel.date) {
          return false;
        }
        if (ride.date === nextFuel.date) {
          // Se a corrida foi feita no mesmo dia do próximo abastecimento,
          // se o timestamp da corrida for posterior ao próximo abastecimento, pertence ao próximo
          if (nextFuel.createdAt && ride.createdAt) {
            if (ride.timestamp >= nextFuel.timestamp) {
              return false;
            }
          } else {
            // Sem timestamp exato no mesmo dia do próximo abastecimento,
            // assume que corridas no dia do próximo abastecimento já rodam com o novo combustível
            return false;
          }
        }
      }

      return true;
    });

    const kmDriven = cycleRides.reduce((sum, r) => sum + (r.kmDriven || 0), 0);
    const liters = currentFuel.resolvedLiters;
    const amount = currentFuel.amount || 0;
    const pricePerLiter =
      currentFuel.pricePerLiter || (liters > 0 ? amount / liters : profile.fuelPricePerLiter || 4);
    const fuelType = currentFuel.fuelType || profile.fuelType || 'etanol';

    // Observação: cálculo do consumo é feito dividindo a distância percorrida (km) pela quantidade de litros abastecidos (L)
    const kmPerLiter = liters > 0 ? Number((kmDriven / liters).toFixed(2)) : 0;
    const costPerKm = kmDriven > 0 ? Number((amount / kmDriven).toFixed(2)) : 0;

    const expectedRangeKm = Number((liters * (profile.kmPerLiter || 10)).toFixed(1));
    const remainingKmEstimate = Math.max(0, Number((expectedRangeKm - kmDriven).toFixed(1)));
    const tankPercentEstimated =
      expectedRangeKm > 0
        ? Math.max(0, Math.min(100, Math.round(((expectedRangeKm - kmDriven) / expectedRangeKm) * 100)))
        : 50;

    const contributingRides: ContributingRide[] = cycleRides.map((r) => ({
      id: r.id,
      date: r.date,
      platformId: r.platformId,
      kmDriven: r.kmDriven || 0,
      grossAmount: r.grossAmount || 0,
      ridesCount: r.ridesCount,
      shift: r.shift,
      notes: r.notes,
      createdAt: r.createdAt,
    }));

    cycles.push({
      id: currentFuel.id,
      cycleNumber: i + 1,
      fuelExpense: currentFuel,
      nextFuelExpense: nextFuel,
      isCurrentTank,
      fillDate: currentFuel.date,
      fillTimestamp: currentFuel.timestamp,
      liters,
      amount,
      pricePerLiter,
      fuelType,
      notes: currentFuel.notes,
      nextFillDate: nextFuel ? nextFuel.date : undefined,
      nextFillTimestamp: nextFuel ? nextFuel.timestamp : undefined,
      kmDriven,
      contributingRides,
      ridesCount: cycleRides.reduce((acc, r) => acc + (r.ridesCount || 1), 0),
      kmPerLiter,
      costPerKm,
      expectedRangeKm,
      remainingKmEstimate,
      tankPercentEstimated,
      status: isCurrentTank ? 'active' : 'completed',
    });
  }

  // Separar ciclo atual (em andamento) e ciclos completados
  const currentCycle = cycles.find((c) => c.isCurrentTank) || null;
  const completedCycles = cycles.filter((c) => !c.isCurrentTank && c.kmDriven > 0);

  // Totais dos ciclos finalizados
  const completedLiters = completedCycles.reduce((sum, c) => sum + c.liters, 0);
  const completedKm = completedCycles.reduce((sum, c) => sum + c.kmDriven, 0);
  const completedSpend = completedCycles.reduce((sum, c) => sum + c.amount, 0);

  const averageKmPerLiterCompleted =
    completedLiters > 0 ? Number((completedKm / completedLiters).toFixed(2)) : 0;
  const averageCostPerKmCompleted =
    completedKm > 0 ? Number((completedSpend / completedKm).toFixed(2)) : 0;

  // Totais gerais incluindo o tanque atual
  const totalLitersTracked = cycles.reduce((sum, c) => sum + c.liters, 0);
  const totalSpendTracked = cycles.reduce((sum, c) => sum + c.amount, 0);
  const totalKmTracked = cycles.reduce((sum, c) => sum + c.kmDriven, 0);

  const profileKmPerLiter = profile.kmPerLiter || 10;
  const deltaVsProfile =
    averageKmPerLiterCompleted > 0
      ? Number((averageKmPerLiterCompleted - profileKmPerLiter).toFixed(2))
      : 0;

  // Recordes entre ciclos finalizados
  let bestCycle: FuelCycle | null = null;
  let worstCycle: FuelCycle | null = null;

  if (completedCycles.length > 0) {
    const sortedByKmPerL = [...completedCycles].sort((a, b) => b.kmPerLiter - a.kmPerLiter);
    bestCycle = sortedByKmPerL[0];
    worstCycle = sortedByKmPerL[sortedByKmPerL.length - 1];
  }

  // Agrupamento por tipo de combustível (Etanol vs Gasolina vs GNV vs Diesel)
  const byFuelType: FuelTelemetrySummary['byFuelType'] = {};

  completedCycles.forEach((c) => {
    const fType = c.fuelType.toLowerCase();
    if (!byFuelType[fType]) {
      byFuelType[fType] = {
        fuelType: c.fuelType,
        cyclesCount: 0,
        totalLiters: 0,
        totalKm: 0,
        totalSpend: 0,
        avgKmPerLiter: 0,
        avgCostPerKm: 0,
      };
    }
    const item = byFuelType[fType];
    item.cyclesCount += 1;
    item.totalLiters += c.liters;
    item.totalKm += c.kmDriven;
    item.totalSpend += c.amount;
  });

  Object.values(byFuelType).forEach((item) => {
    item.avgKmPerLiter =
      item.totalLiters > 0 ? Number((item.totalKm / item.totalLiters).toFixed(2)) : 0;
    item.avgCostPerKm =
      item.totalKm > 0 ? Number((item.totalSpend / item.totalKm).toFixed(2)) : 0;
  });

  return {
    hasFuelEntries: true,
    totalFuelEntriesCount,
    currentCycle,
    completedCycles,
    allCycles: [...cycles].reverse(), // Mais recentes primeiro para a listagem
    totalLitersTracked,
    totalSpendTracked,
    totalKmTracked,
    averageKmPerLiterCompleted,
    averageCostPerKmCompleted,
    profileKmPerLiter,
    deltaVsProfile,
    bestCycle,
    worstCycle,
    byFuelType,
  };
}
