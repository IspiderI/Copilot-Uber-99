// Service for querying the official Tabela FIPE database and calculating vehicle depreciation

export interface FipeBrand {
  codigo: string;
  nome: string;
}

export interface FipeModel {
  codigo: number;
  nome: string;
}

export interface FipeYear {
  codigo: string;
  nome: string;
}

export interface FipeVehicleDetails {
  TipoVeiculo: number;
  Valor: string; // ex: "R$ 61.129,00"
  Marca: string;
  Modelo: string;
  AnoModelo: number;
  Combustivel: string;
  CodigoFipe: string;
  MesReferencia: string;
  SiglaCombustivel: string;
  numericValue: number; // ex: 61129.00
}

export interface VehicleDepreciationResult {
  fipeValue: number;
  baseAnnualRate: number; // ex: 10 (%)
  projectedAnnualKm: number; // ex: 36000 (km)
  standardAnnualKm: number; // 15000 (km)
  excessKm: number; // ex: 21000 (km)
  kmAccelerationRate: number; // ex: 3.15 (%)
  effectiveAnnualRate: number; // ex: 13.15 (%)
  annualLoss: number; // R$ per year
  monthlyLoss: number; // R$ per month
  dailyLoss: number; // R$ per working day
  depreciationCostPerKm: number; // R$ per km rodado
}

const FIPE_API_BASE = 'https://parallelum.com.br/fipe/api/v1/carros';

// Top popular brands in Brazil as immediate fallback in case of network latency
export const POPULAR_BRANDS: FipeBrand[] = [
  { codigo: '23', nome: 'GM - Chevrolet' },
  { codigo: '21', nome: 'Fiat' },
  { codigo: '59', nome: 'Volkswagen' },
  { codigo: '26', nome: 'Hyundai' },
  { codigo: '44', nome: 'Renault' },
  { codigo: '56', nome: 'Toyota' },
  { codigo: '25', nome: 'Honda' },
  { codigo: '22', nome: 'Ford' },
  { codigo: '41', nome: 'Nissan' },
  { codigo: '149', nome: 'Jeep' },
  { codigo: '13', nome: 'Citroën' },
  { codigo: '43', nome: 'Peugeot' },
  { codigo: '171', nome: 'Caoa Chery' },
  { codigo: '224', nome: 'BYD' },
];

/**
 * Parse Brazilian currency string (e.g. "R$ 61.129,00") into a clean number
 */
export const parseFipeCurrency = (valStr: string): number => {
  if (!valStr) return 0;
  const cleaned = valStr
    .replace('R$', '')
    .trim()
    .replace(/\./g, '')
    .replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

/**
 * Fetch all car brands from FIPE API
 */
export const fetchFipeBrands = async (): Promise<FipeBrand[]> => {
  try {
    const res = await fetch(`${FIPE_API_BASE}/marcas`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: FipeBrand[] = await res.json();
    return data && data.length > 0 ? data : POPULAR_BRANDS;
  } catch (err) {
    console.warn('Falha ao obter marcas FIPE online, usando lista padrão:', err);
    return POPULAR_BRANDS;
  }
};

/**
 * Fetch models for a given brand code
 */
export const fetchFipeModels = async (brandCode: string): Promise<FipeModel[]> => {
  if (!brandCode) return [];
  try {
    const res = await fetch(`${FIPE_API_BASE}/marcas/${brandCode}/modelos`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    return data.modelos || [];
  } catch (err) {
    console.error('Erro ao buscar modelos FIPE:', err);
    return [];
  }
};

/**
 * Fetch available model years for a given brand and model
 */
export const fetchFipeYears = async (
  brandCode: string,
  modelCode: string | number
): Promise<FipeYear[]> => {
  if (!brandCode || !modelCode) return [];
  try {
    const res = await fetch(
      `${FIPE_API_BASE}/marcas/${brandCode}/modelos/${modelCode}/anos`,
      {
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data: FipeYear[] = await res.json();
    return data || [];
  } catch (err) {
    console.error('Erro ao buscar anos FIPE:', err);
    return [];
  }
};

/**
 * Fetch complete vehicle details and official valuation
 */
export const fetchFipeVehicleValue = async (
  brandCode: string,
  modelCode: string | number,
  yearCode: string
): Promise<FipeVehicleDetails | null> => {
  if (!brandCode || !modelCode || !yearCode) return null;
  try {
    const res = await fetch(
      `${FIPE_API_BASE}/marcas/${brandCode}/modelos/${modelCode}/anos/${yearCode}`,
      {
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const rawData = await res.json();
    return {
      ...rawData,
      numericValue: parseFipeCurrency(rawData.Valor),
    };
  } catch (err) {
    console.error('Erro ao buscar valor oficial FIPE:', err);
    return null;
  }
};

/**
 * Smart automatic search by Brand Name, Model Name, and Year
 */
export const searchFipeAuto = async (
  brandName: string,
  modelName: string,
  year?: number
): Promise<FipeVehicleDetails | null> => {
  if (!brandName || !modelName) return null;

  try {
    const brands = await fetchFipeBrands();
    const cleanBrand = brandName.toLowerCase().trim();

    // Match brand
    const matchedBrand = brands.find((b) => {
      const bName = b.nome.toLowerCase();
      return (
        bName.includes(cleanBrand) ||
        cleanBrand.includes(bName) ||
        (cleanBrand.includes('chevrolet') && bName.includes('gm')) ||
        (cleanBrand.includes('vw') && bName.includes('volkswagen'))
      );
    });

    if (!matchedBrand) return null;

    const models = await fetchFipeModels(matchedBrand.codigo);
    const cleanModel = modelName.toLowerCase().trim();

    // Match model: check if model name matches
    const matchedModel = models.find((m) => {
      const mName = m.nome.toLowerCase();
      // Token match
      const tokens = cleanModel.split(/\s+/).filter((t) => t.length > 2);
      return tokens.every((token) => mName.includes(token));
    }) || models.find((m) => m.nome.toLowerCase().includes(cleanModel.split(/\s+/)[0]));

    if (!matchedModel) return null;

    const years = await fetchFipeYears(matchedBrand.codigo, matchedModel.codigo);
    if (!years || years.length === 0) return null;

    let matchedYear = years[0];
    if (year) {
      const yearStr = year.toString();
      matchedYear =
        years.find((y) => y.codigo.startsWith(yearStr) || y.nome.includes(yearStr)) ||
        years[0];
    }

    return await fetchFipeVehicleValue(
      matchedBrand.codigo,
      matchedModel.codigo,
      matchedYear.codigo
    );
  } catch (err) {
    console.error('Erro na busca automática FIPE:', err);
    return null;
  }
};

/**
 * Calculate vehicle depreciation based on FIPE value and mileage factors
 *
 * Rules:
 * - Base depreciation in Brazilian market: 8% to 12% per year (default 10% a.a.)
 * - Standard usage benchmark: 12.000 km to 15.000 km per year
 * - Accelerated depreciation: mileage above 15.000 km/year accelerates price loss on resale.
 *   Each 10.000 km excess adds ~1.5% to the annual depreciation rate.
 */
export const calculateVehicleDepreciation = ({
  fipeValue,
  baseAnnualRate = 10, // 8% to 12%
  projectedAnnualKm = 36000, // typical for app drivers
  workingDaysPerYear = 300,
}: {
  fipeValue: number;
  baseAnnualRate?: number;
  projectedAnnualKm?: number;
  workingDaysPerYear?: number;
}): VehicleDepreciationResult => {
  const cleanFipe = Math.max(0, fipeValue || 0);
  const cleanBaseRate = Math.max(1, Math.min(30, baseAnnualRate || 10));
  const cleanKm = Math.max(1000, projectedAnnualKm || 36000);
  const standardAnnualKm = 15000;

  // Excess mileage above normal benchmark (15.000 km)
  const excessKm = Math.max(0, cleanKm - standardAnnualKm);

  // Mileage acceleration factor: +1.5% annual loss per 10.000 km excess
  const kmAccelerationRate = (excessKm / 10000) * 1.5;

  // Effective annual depreciation rate
  const effectiveAnnualRate = Number((cleanBaseRate + kmAccelerationRate).toFixed(2));

  // Losses
  const annualLoss = (cleanFipe * effectiveAnnualRate) / 100;
  const monthlyLoss = annualLoss / 12;
  const cleanWorkingDays = workingDaysPerYear > 0 ? workingDaysPerYear : 300;
  const dailyLoss = annualLoss / cleanWorkingDays;

  // Depreciation per KM rodado
  const depreciationCostPerKm = Number((annualLoss / cleanKm).toFixed(3));

  return {
    fipeValue: cleanFipe,
    baseAnnualRate: cleanBaseRate,
    projectedAnnualKm: cleanKm,
    standardAnnualKm,
    excessKm,
    kmAccelerationRate: Number(kmAccelerationRate.toFixed(2)),
    effectiveAnnualRate,
    annualLoss: Number(annualLoss.toFixed(2)),
    monthlyLoss: Number(monthlyLoss.toFixed(2)),
    dailyLoss: Number(dailyLoss.toFixed(2)),
    depreciationCostPerKm,
  };
};
