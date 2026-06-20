import type { PlanetParams, AIScore, Issue, CapsuleDesign, CapsuleMode } from './types';

// Scorable parameters (excluding name and toxicGasType)
type ScorableParam = 'temperature_K' | 'pressure_kPa' | 'toxicGasDensity_kgm3' | 'waterVolume_m3' | 'waterPH' | 'waterTemp_K' | 'soilMoisture_kgkg' | 'soilDensity_kgm3';

const SCORE_PARAMS: ScorableParam[] = [
  'temperature_K', 'pressure_kPa', 'toxicGasDensity_kgm3',
  'waterVolume_m3', 'waterPH', 'waterTemp_K',
  'soilMoisture_kgkg', 'soilDensity_kgm3',
];

function scoreParam(
  value: number,
  idealMin: number,
  idealMax: number,
  tolerance: number = 0.5
): { score: number; severity: Issue['severity'] | null } {
  const range = idealMax - idealMin;

  if (value >= idealMin && value <= idealMax) {
    return { score: 100, severity: null };
  }

  const deviation = Math.min(Math.abs(value - idealMin), Math.abs(value - idealMax));
  const relativeDeviation = deviation / (range * tolerance + 1e-6);

  const rawScore = Math.max(0, 100 - relativeDeviation * 100);
  let severity: Issue['severity'] | null = null;

  if (relativeDeviation > 2.0) severity = 'critical';
  else if (relativeDeviation > 1.0) severity = 'warning';
  else if (relativeDeviation > 0.3) severity = 'mild';

  return { score: Math.round(Math.max(0, Math.min(100, rawScore))), severity };
}

function getIdealRange(param: ScorableParam): [number, number] {
  switch (param) {
    case 'temperature_K': return [280, 310];
    case 'pressure_kPa': return [80, 120];
    case 'toxicGasDensity_kgm3': return [0, 0.001];
    case 'waterVolume_m3': return [1e12, 1e20];
    case 'waterPH': return [6.0, 8.5];
    case 'waterTemp_K': return [273, 323];
    case 'soilMoisture_kgkg': return [0.1, 0.4];
    case 'soilDensity_kgm3': return [1000, 2000];
  }
}

function getParamLabel(param: ScorableParam): string {
  const labels: Record<ScorableParam, string> = {
    temperature_K: 'Sıcaklık',
    pressure_kPa: 'Atmosfer Basıncı',
    toxicGasDensity_kgm3: 'Zararlı Gaz Yoğunluğu',
    waterVolume_m3: 'Su Hacmi',
    waterPH: 'Su pH',
    waterTemp_K: 'Su Sıcaklığı',
    soilMoisture_kgkg: 'Toprak Nemi',
    soilDensity_kgm3: 'Yüzey Yoğunluğu',
  };
  return labels[param];
}

function getParamUnit(param: ScorableParam): string {
  const units: Record<ScorableParam, string> = {
    temperature_K: 'K',
    pressure_kPa: 'kPa',
    toxicGasDensity_kgm3: 'kg/m³',
    waterVolume_m3: 'm³',
    waterPH: '',
    waterTemp_K: 'K',
    soilMoisture_kgkg: 'kg/kg',
    soilDensity_kgm3: 'kg/m³',
  };
  return units[param];
}

export function analyzeHabitability(params: PlanetParams): AIScore {
  const scores: AIScore['scores'] = {} as AIScore['scores'];
  const issues: Issue[] = [];

  for (const param of SCORE_PARAMS) {
    const [idealMin, idealMax] = getIdealRange(param);
    const { score, severity } = scoreParam(params[param] as number, idealMin, idealMax);
    scores[param] = score;

    if (severity) {
      issues.push({
        parameter: param,
        value: params[param] as number,
        idealMin,
        idealMax,
        severity,
        unit: getParamUnit(param),
        label: getParamLabel(param),
      });
    }
  }

  // Weighted average
  const weights: Record<ScorableParam, number> = {
    temperature_K: 2.0,
    pressure_kPa: 2.0,
    toxicGasDensity_kgm3: 2.5,
    waterVolume_m3: 1.5,
    waterPH: 1.0,
    waterTemp_K: 1.0,
    soilMoisture_kgkg: 0.8,
    soilDensity_kgm3: 0.5,
  };

  let weightedSum = 0;
  let weightTotal = 0;
  for (const param of SCORE_PARAMS) {
    weightedSum += scores[param] * weights[param];
    weightTotal += weights[param];
  }

  const habitabilityScore = Math.round((weightedSum / weightTotal) * 100) / 100;

  // Cross-analysis penalty
  let penaltyMultiplier = 1.0;
  const criticalIssues = issues.filter(i => i.severity === 'critical');
  if (criticalIssues.length >= 3) penaltyMultiplier = 0.5;
  else if (criticalIssues.length >= 2) penaltyMultiplier = 0.65;
  else if (criticalIssues.length === 1) penaltyMultiplier = 0.8;

  if (params.toxicGasDensity_kgm3 > 0.01) penaltyMultiplier *= 0.7;

  const finalScore = Math.round(habitabilityScore * penaltyMultiplier * 100) / 100;

  return {
    habitabilityScore: Math.max(0, Math.min(100, finalScore)),
    scores,
    issues: issues.sort((a, b) => {
      const order = { critical: 0, warning: 1, mild: 2 };
      return order[a.severity] - order[b.severity];
    }),
  };
}

export function generateCapsuleDesigns(params: PlanetParams, aiScore: AIScore): Record<CapsuleMode, CapsuleDesign> {
  const criticalIssues = aiScore.issues.filter(i => i.severity === 'critical');
  const score = aiScore.habitabilityScore;

  // --- Economic Mode ---
  const economicFeatures: string[] = [];
  const eliminatedArmor: string[] = [];

  if (aiScore.scores.pressure_kPa > 85) {
    eliminatedArmor.push('Titanyum basınç zırhı');
    economicFeatures.push('Atmosfer basıncı yaşama uygun olduğundan titanyum zırh elendi, ekonomik polimer gövde seçildi.');
  }
  if (aiScore.scores.temperature_K > 80) {
    eliminatedArmor.push('Termal koruma kalkanı');
    economicFeatures.push('Sıcaklık değerleri tolere edilebilir aralıkta, termal kalkan inceltildi.');
  }
  if (aiScore.scores.soilDensity_kgm3 > 70) {
    economicFeatures.push('Zemin yapısı uygun, pahalı hidrolik ayak sistemleri yerine sabit temel kullanıldı.');
  }
  if (eliminatedArmor.length === 0) {
    economicFeatures.push('Minimum ekonomik iyileştirme uygulandı; temel koruma sistemleri korundu.');
  }

  const ecoCostSavings = Math.min(85, eliminatedArmor.length * 20 + (aiScore.scores.pressure_kPa > 85 ? 15 : 0) + (aiScore.scores.temperature_K > 80 ? 10 : 0));

  const economicDesign: CapsuleDesign = {
    mode: 'economic',
    title: '💰 Ekonomik Mod',
    formType: score > 50 ? 'dome' : 'spherical',
    armorType: eliminatedArmor.length > 0 ? 'Polimer Kompozit Gövde' : 'Güçlendirilmiş Polimer',
    description: eliminatedArmor.length > 0
      ? `${eliminatedArmor.join(', ')} elenerek maliyet ~%${ecoCostSavings} düşürüldü. Kapsül, gezegenin uygun parametrelerinden faydalanarak minimum maliyetle maksimum koruma sağlar.`
      : 'Gezegen koşulları zorlu olduğu için ekonomik modda dahi temel koruma sistemleri korunmuştur.',
    features: economicFeatures,
    costSavings: ecoCostSavings,
    setupTime_s: Math.round(3600 * (1 + criticalIssues.length * 0.3)),
    sustainabilityNotes: 'Geri dönüştürülebilir polimer malzemeler tercih edildi.',
  };

  // --- Sustainable Mode ---
  const sustainableFeatures: string[] = [];
  let sustainableDesc = '';

  if (params.toxicGasDensity_kgm3 > 0.0005) {
    if (params.toxicGasType === 'CO2') {
      sustainableFeatures.push(
        `Atmosferdeki yüksek CO₂ yoğunluğu (${params.toxicGasDensity_kgm3} kg/m³) Sabatier reaktörüne yönlendirilerek astronot atık hidrojeni ile birleştirilip su ve metan yakıtı üretilecek.`
      );
      sustainableDesc = 'Sabatier döngüsü ile CO₂ geri kazanımı sağlandı.';
    } else if (params.toxicGasType === 'CH4') {
      sustainableFeatures.push(
        `Atmosferdeki metan (${params.toxicGasDensity_kgm3} kg/m³) yakıt hücrelerinde oksitlenerek enerji ve su üretiminde kullanılacak.`
      );
      sustainableDesc = 'Metan oksidasyon döngüsü kuruldu.';
    } else {
      sustainableFeatures.push(
        `Zararlı ${params.toxicGasType} gazı kimyasal filtreleme ile ayrıştırılarak endüstriyel hammaddeye dönüştürülecek.`
      );
      sustainableDesc = 'Kimyasal dönüşüm reaktörleri eklendi.';
    }
  }

  if (aiScore.scores.waterVolume_m3 < 50) {
    sustainableFeatures.push('Su kıtlığı nedeniyle kapalı döngü su arıtma sistemi ve atmosferik nem yoğuşturucu entegre edildi.');
  }

  if (aiScore.scores.soilMoisture_kgkg < 50) {
    sustainableFeatures.push('Toprak nemi yetersiz; hidroponik tarım modülleri ve su tasarruflu damlama sistemleri eklendi.');
  }

  if (sustainableFeatures.length === 0) {
    sustainableFeatures.push('Gezegen koşulları sürdürülebilirlik için uygun; standart kapalı döngü yaşam destek sistemi kuruldu.');
    sustainableDesc = 'Standart sürdürülebilir yaşam döngüsü.';
  }

  const sustainableDesign: CapsuleDesign = {
    mode: 'sustainable',
    title: '🌱 Sürdürülebilir Mod',
    formType: 'dome',
    armorType: 'Biyo-tabanlı Kompozit + Geri Dönüşüm Katmanı',
    description: sustainableDesc || 'Sıfır atık prensibiyle tasarlanmış kapalı döngü yaşam sistemi.',
    features: sustainableFeatures,
    costSavings: 15,
    setupTime_s: Math.round(7200 * (1 + criticalIssues.length * 0.25)),
    sustainabilityNotes: 'Tüm atıklar kaynağa dönüştürülür. Sıfır atık hedefi: %100 döngüsel ekonomi.',
  };

  // --- Rapid Mode ---
  const rapidFeatures: string[] = [];
  const isAggressive = criticalIssues.length >= 2 || params.temperature_K > 400 || params.temperature_K < 200 || params.pressure_kPa > 200;

  if (isAggressive) {
    rapidFeatures.push('Agresif çevre koşulları tespit edildi. Modüler, katlanabilir prefabrik paneller kullanılacak.');
    rapidFeatures.push('Robotik kollar için önceden programlanmış hızlı montaj senaryosu aktif.');
    if (params.pressure_kPa > 150) {
      rapidFeatures.push('Yüksek basınca dayanıklı şişirilebilir iç kabuk 45 saniyede açılır.');
    }
    if (params.temperature_K > 350 || params.temperature_K < 230) {
      rapidFeatures.push('Termal yalıtımlı acil durum balonu ilk 30 saniyede devreye girer.');
    }
  } else {
    rapidFeatures.push('Orta düzey koşullar; hızlı kurulum için prefabrik kubbe sistemi yeterli.');
  }

  const setupTime = isAggressive ? Math.round(180 + criticalIssues.length * 60) : 600;

  const rapidDesign: CapsuleDesign = {
    mode: 'rapid',
    title: '⏱️ Hızlı Üretim Modu',
    formType: isAggressive ? 'modular' : 'dome',
    armorType: isAggressive ? 'Şişirilebilir Çok Katmanlı Zırh + Prefabrik Panel' : 'Prefabrik Kubbe Panelleri',
    description: isAggressive
      ? `Aşırı çevre koşulları nedeniyle hızlı kurulum protokolü devrede. Robotik montaj ile ${setupTime} saniyede yaşanabilir alan oluşturulur.`
      : `Prefabrik mimari ile ${setupTime} saniyede kurulum tamamlanır.`,
    features: rapidFeatures,
    costSavings: 0,
    setupTime_s: setupTime,
    sustainabilityNotes: isAggressive ? 'Acil durum modunda sürdürülebilirlik ikinci plandadır.' : 'Modüler yapı sayesinde sonradan genişletilebilir.',
  };

  return {
    economic: economicDesign,
    sustainable: sustainableDesign,
    rapid: rapidDesign,
  };
}
