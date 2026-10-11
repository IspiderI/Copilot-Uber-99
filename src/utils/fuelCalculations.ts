import { EarningsEntry, ExpenseEntry, DriverProfile } from '../types';

export interface FuelCycle {
  id: string;
  fuelExpense: ExpenseEntry;
  cycleNumber: number;
  startDate: string;
  startCreatedAt: string;
  endDate: string | null;
  endCreatedAt: string | null;
  isCurrentCycle: boolean;
  liters: number;
  pricePerLiter: number;
  totalCost: number;
  fuelType: string;
  totalKmDriven: number;
  earningsEntries: EarningsEntry[];
  kmPerLiter: number;
  costPerKm: number;
  expectedKmPerLiter: number;
  efficiencyRatio: number; // > 1 means more efficient than expected
}

export interface CurrentCycleTelemetry {
  latestFuelExpense: ExpenseEntry | null;
  latestCycle: FuelCycle | null;
  kmDriven: number;
  liters: number;
  currentKmPerLiter: number;
  costPerKm: number;
  estimatedLitersUsed: number;
  estimatedLitersRemaining: number;
  estimatedKmRemaining: number;
  tankUsagePercentage: number;
  totalCompletedCycles: number;
  weightedOverallKmPerLiter: number;
  weightedOverallCostPerKm: number;
}

/**
 * Universal safe timestamp extraction for date / createdAt comparison.
 */
export const getRecordTimestamp = (record: { date: string; createdAt?: string }): number => {
  if (record.createdAt) {
    const t = new Date(record.createdAt).getTime();
    if (!isNaN(t)) return t;
  }
  if (!record.date) return 0;
  const parts = record.date.split('-').map(Number);
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return new Date(y, m - 1, d, 12, 0, 0).getTime();
  }
  return new Date(record.date).getTime() || 0;
};

/**
 * Calculates all fuel cycles by correlating fuel records with subsequently driven kilometers.
 * Rule:
 * Consumo (km/L) = Distância percorrida (km) ÷ Litros abastecidos (L)
 */
export const calculateFuelCycles = (
  expenses: ExpenseEntry[],
  earnings: EarningsEntry[],
  profile: DriverProfile
): {
  cycles: FuelCycle[];
  telemetry: CurrentCycleTelemetry;
  priorEarningsKm: number;
} => {
  // 1. Filter valid fuel expenses
  const fuelExpenses = expenses.filter(
    (e) => e.category === 'combustivel' && e.includeInCalculations !== false && e.amount > 0
  );

  // Sort ascending chronologically
  const sortedFuels = [...fuelExpenses].sort(
    (a, b) => getRecordTimestamp(a) - getRecordTimestamp(b)
  );

  // 2. Filter valid earnings with km driven
  const validEarnings = earnings.filter(
    (e) => (e.kmDriven || 0) > 0 && e.includeInCalculations !== false
  );

  // Sort ascending chronologically
  const sortedEarnings = [...validEarnings].sort(
    (a, b) => getRecordTimestamp(a) - getRecordTimestamp(b)
  );

  if (sortedFuels.length === 0) {
    const totalKm = sortedEarnings.reduce((acc, curr) => acc + (curr.kmDriven || 0), 0);
    return {
      cycles: [],
      telemetry: {
        latestFuelExpense: null,
        latestCycle: null,
        kmDriven: totalKm,
        liters: 0,
        currentKmPerLiter: 0,
        costPerKm: 0,
        estimatedLitersUsed: 0,
        estimatedLitersRemaining: 0,
        estimatedKmRemaining: 0,
        tankUsagePercentage: 0,
        totalCompletedCycles: 0,
        weightedOverallKmPerLiter: 0,
        weightedOverallCostPerKm: 0,
      },
      priorEarningsKm: totalKm,
    };
  }

  const expectedKmPerLiter = profile.kmPerLiter && profile.kmPerLiter > 0 ? profile.kmPerLiter : 10;
  const firstFuelTimestamp = getRecordTimestamp(sortedFuels[0]);

  // Earnings logged before the very first fuel record
  const priorEarnings = sortedEarnings.filter(
    (e) => getRecordTimestamp(e) < firstFuelTimestamp
  );
  const priorEarningsKm = priorEarnings.reduce((acc, e) => acc + (e.kmDriven || 0), 0);

  const cycles: FuelCycle[] = [];

  for (let i = 0; i < sortedFuels.length; i++) {
    const currentFuel = sortedFuels[i];
    const isCurrentCycle = i === sortedFuels.length - 1;
    const nextFuel = !isCurrentCycle ? sortedFuels[i + 1] : null;

    const startTs = getRecordTimestamp(currentFuel);
    const endTs = nextFuel ? getRecordTimestamp(nextFuel) : Infinity;

    // Liters calculation with fallback
    let liters = currentFuel.liters || 0;
    if (liters <= 0) {
      if (currentFuel.pricePerLiter && currentFuel.pricePerLiter > 0) {
        liters = currentFuel.amount / currentFuel.pricePerLiter;
      } else if (profile.fuelPricePerLiter && profile.fuelPricePerLiter > 0) {
        liters = currentFuel.amount / profile.fuelPricePerLiter;
      } else {
        liters = currentFuel.amount / 4.0;
      }
    }
    liters = Number(liters.toFixed(2));

    const pricePerLiter =
      currentFuel.pricePerLiter && currentFuel.pricePerLiter > 0
        ? currentFuel.pricePerLiter
        : liters > 0
        ? Number((currentFuel.amount / liters).toFixed(2))
        : profile.fuelPricePerLiter || 4.0;

    // Filter earnings for this cycle: on or after current fuel, and before next fuel
    const cycleEarnings = sortedEarnings.filter((e) => {
      const eTs = getRecordTimestamp(e);
      // Same date tolerance: if fuel has only date string, earnings of that day are driven with that fuel
      return eTs >= startTs && eTs < endTs;
    });

    const totalKmDriven = cycleEarnings.reduce((acc, e) => acc + (e.kmDriven || 0), 0);

    // Core formula: km / liters
    const kmPerLiter = liters > 0 && totalKmDriven > 0 ? Number((totalKmDriven / liters).toFixed(2)) : 0;
    const costPerKm = totalKmDriven > 0 ? Number((currentFuel.amount / totalKmDriven).toFixed(2)) : 0;
    const efficiencyRatio = kmPerLiter > 0 ? Number((kmPerLiter / expectedKmPerLiter).toFixed(2)) : 0;

    cycles.push({
      id: `cycle-${currentFuel.id}`,
      fuelExpense: currentFuel,
      cycleNumber: i + 1,
      startDate: currentFuel.date,
      startCreatedAt: currentFuel.createdAt || currentFuel.date,
      endDate: nextFuel ? nextFuel.date : null,
      endCreatedAt: nextFuel ? nextFuel.createdAt || nextFuel.date : null,
      isCurrentCycle,
      liters,
      pricePerLiter,
      totalCost: currentFuel.amount,
      fuelType: currentFuel.fuelType || profile.fuelType || 'etanol',
      totalKmDriven,
      earningsEntries: cycleEarnings,
      kmPerLiter,
      costPerKm,
      expectedKmPerLiter,
      efficiencyRatio,
    });
  }

  // Calculate overall weighted metrics
  const allCompletedCycles = cycles.filter((c) => !c.isCurrentCycle && c.totalKmDriven > 0);
  const totalCompletedKm = allCompletedCycles.reduce((sum, c) => sum + c.totalKmDriven, 0);
  const totalCompletedLiters = allCompletedCycles.reduce((sum, c) => sum + c.liters, 0);
  const totalCompletedCost = allCompletedCycles.reduce((sum, c) => sum + c.totalCost, 0);

  const weightedOverallKmPerLiter =
    totalCompletedLiters > 0 && totalCompletedKm > 0
      ? Number((totalCompletedKm / totalCompletedLiters).toFixed(2))
      : 0;

  const weightedOverallCostPerKm =
    totalCompletedKm > 0 ? Number((totalCompletedCost / totalCompletedKm).toFixed(2)) : 0;

  // Latest cycle telemetry (since the last fuel refueling)
  const latestCycle = cycles.length > 0 ? cycles[cycles.length - 1] : null;
  const latestFuelExpense = sortedFuels.length > 0 ? sortedFuels[sortedFuels.length - 1] : null;

  const currentKmDriven = latestCycle ? latestCycle.totalKmDriven : 0;
  const currentLiters = latestCycle ? latestCycle.liters : 0;
  const currentKmPerLiter = latestCycle ? latestCycle.kmPerLiter : 0;
  const currentCostPerKm = latestCycle ? latestCycle.costPerKm : 0;

  const estimatedLitersUsed =
    expectedKmPerLiter > 0 ? Number((currentKmDriven / expectedKmPerLiter).toFixed(2)) : 0;
  const estimatedLitersRemaining = Math.max(0, Number((currentLiters - estimatedLitersUsed).toFixed(2)));
  const estimatedKmRemaining = Math.round(estimatedLitersRemaining * expectedKmPerLiter);
  const tankUsagePercentage =
    currentLiters > 0 ? Math.min(100, Math.round((estimatedLitersUsed / currentLiters) * 100)) : 0;

  return {
    cycles,
    telemetry: {
      latestFuelExpense,
      latestCycle,
      kmDriven: currentKmDriven,
      liters: currentLiters,
      currentKmPerLiter,
      costPerKm: currentCostPerKm,
      estimatedLitersUsed,
      estimatedLitersRemaining,
      estimatedKmRemaining,
      tankUsagePercentage,
      totalCompletedCycles: allCompletedCycles.length,
      weightedOverallKmPerLiter,
      weightedOverallCostPerKm,
    },
    priorEarningsKm,
  };
};

/**
 * Returns the fuel cycle context for a specific earnings entry,
 * indicating how many km had been accumulated in that fuel cycle up to this trip
 * and the resulting km/L at that moment.
 */
export const getEarningsFuelCycleContext = (
  entry: EarningsEntry,
  cycles: FuelCycle[]
): {
  cycle: FuelCycle | null;
  cycleNumber: number;
  cumulativeKmInCycle: number;
  kmPerLiterAtPoint: number;
  isCurrentCycle: boolean;
} => {
  const eTs = getRecordTimestamp(entry);

  for (const cycle of cycles) {
    const startTs = getRecordTimestamp({ date: cycle.startDate, createdAt: cycle.startCreatedAt });
    const endTs = cycle.endDate
      ? getRecordTimestamp({ date: cycle.endDate, createdAt: cycle.endCreatedAt || undefined })
      : Infinity;

    if (eTs >= startTs && eTs < endTs) {
      // Find all entries in this cycle up to this entry
      const priorInCycle = cycle.earningsEntries.filter(
        (e) => getRecordTimestamp(e) <= eTs
      );
      const cumulativeKm = priorInCycle.reduce((sum, e) => sum + (e.kmDriven || 0), 0);
      const kmPerLiterAtPoint =
        cycle.liters > 0 && cumulativeKm > 0
          ? Number((cumulativeKm / cycle.liters).toFixed(2))
          : 0;

      return {
        cycle,
        cycleNumber: cycle.cycleNumber,
        cumulativeKmInCycle: cumulativeKm,
        kmPerLiterAtPoint,
        isCurrentCycle: cycle.isCurrentCycle,
      };
    }
  }

  return {
    cycle: null,
    cycleNumber: 0,
    cumulativeKmInCycle: 0,
    kmPerLiterAtPoint: 0,
    isCurrentCycle: false,
  };
};
