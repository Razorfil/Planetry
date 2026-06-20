import { useState } from 'react';
import type { PlanetParams } from '../types';
import SensorPanel from './SensorPanel';

interface PlanetFormProps {
  onSubmit: (params: PlanetParams) => void;
  onCancel: () => void;
  initialValues?: Partial<PlanetParams>;
}

const DEFAULT_VALUES: PlanetParams = {
  name: '',
  temperature_K: 288,
  pressure_kPa: 101.325,
  toxicGasDensity_kgm3: 0.0004,
  toxicGasType: 'CO2',
  waterVolume_m3: 1e15,
  waterPH: 7.0,
  waterTemp_K: 288,
  soilMoisture_kgkg: 0.25,
  soilDensity_kgm3: 1600,
};

export default function PlanetForm({ onSubmit, onCancel, initialValues }: PlanetFormProps) {
  const [form, setForm] = useState<PlanetParams>({ ...DEFAULT_VALUES, ...initialValues });
  const [errors, setErrors] = useState<Partial<Record<keyof PlanetParams, string>>>({});

  const updateField = <K extends keyof PlanetParams>(key: K, value: PlanetParams[K]) => {
    setForm(prev => ({ ...prev, [key]: value }));
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const validate = (): boolean => {
    const errs: Partial<Record<keyof PlanetParams, string>> = {};
    if (!form.name.trim()) errs.name = 'Gezegen adı zorunludur.';
    if (form.temperature_K < 0) errs.temperature_K = 'Sıcaklık 0 K\'den küçük olamaz.';
    if (form.pressure_kPa < 0) errs.pressure_kPa = 'Basınç negatif olamaz.';
    if (form.toxicGasDensity_kgm3 < 0) errs.toxicGasDensity_kgm3 = 'Negatif yoğunluk olamaz.';
    if (form.waterVolume_m3 < 0) errs.waterVolume_m3 = 'Hacim negatif olamaz.';
    if (form.waterPH < 0 || form.waterPH > 14) errs.waterPH = 'pH 0-14 aralığında olmalıdır.';
    if (form.waterTemp_K < 0) errs.waterTemp_K = 'Sıcaklık 0 K\'den küçük olamaz.';
    if (form.soilMoisture_kgkg < 0 || form.soilMoisture_kgkg > 1) errs.soilMoisture_kgkg = '0-1 arası kütle payı giriniz.';
    if (form.soilDensity_kgm3 < 0) errs.soilDensity_kgm3 = 'Yoğunluk negatif olamaz.';
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) onSubmit(form);
  };

  const applySensorReading = ({ ph, gasDensity }: { ph: number; gasDensity: number }) => {
    updateField('waterPH', ph);
    updateField('toxicGasDensity_kgm3', gasDensity);
  };

  const tempC = (form.temperature_K - 273.15).toFixed(1);
  const waterTempC = (form.waterTemp_K - 273.15).toFixed(1);

  const inputClass = "w-full px-3 py-2 bg-slate-700/60 border border-slate-600 rounded-lg text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500/50 focus:border-sky-500/50 text-sm transition-colors";
  const labelClass = "block text-xs font-medium text-slate-400 mb-1 uppercase tracking-wider";
  const errorClass = "text-xs text-red-400 mt-0.5";

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Planet Name */}
      <div>
        <label className={labelClass}>🪐 Gezegen Adı</label>
        <input
          type="text"
          value={form.name}
          onChange={e => updateField('name', e.target.value)}
          placeholder="Örn: Proxima-Centauri c"
          className={inputClass}
        />
        {errors.name && <p className={errorClass}>{errors.name}</p>}
      </div>

      {/* Hardware sensor connection */}
      <SensorPanel onApply={applySensorReading} />

      {/* Section: Air Parameters */}
      <div className="border-t border-slate-700/50 pt-4">
        <h3 className="text-sm font-semibold text-sky-400 mb-3">☁️ Hava Parametreleri</h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Sıcaklık (K)</label>
            <input
              type="number"
              step="0.1"
              value={form.temperature_K}
              onChange={e => updateField('temperature_K', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <p className="text-[10px] text-slate-500 mt-0.5">≈ {tempC} °C</p>
            {errors.temperature_K && <p className={errorClass}>{errors.temperature_K}</p>}
          </div>
          <div>
            <label className={labelClass}>Atmosfer Basıncı (kPa)</label>
            <input
              type="number"
              step="0.001"
              value={form.pressure_kPa}
              onChange={e => updateField('pressure_kPa', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <p className="text-[10px] text-slate-500 mt-0.5">Dünya: 101.325 kPa</p>
            {errors.pressure_kPa && <p className={errorClass}>{errors.pressure_kPa}</p>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mt-3">
          <div>
            <label className={labelClass}>Zararlı Gaz Yoğunluğu (kg/m³)</label>
            <input
              type="number"
              step="0.0001"
              value={form.toxicGasDensity_kgm3}
              onChange={e => updateField('toxicGasDensity_kgm3', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            {errors.toxicGasDensity_kgm3 && <p className={errorClass}>{errors.toxicGasDensity_kgm3}</p>}
          </div>
          <div>
            <label className={labelClass}>Gaz Tipi</label>
            <select
              value={form.toxicGasType}
              onChange={e => updateField('toxicGasType', e.target.value as PlanetParams['toxicGasType'])}
              className={inputClass}
            >
              <option value="CO2">CO₂ - Karbondioksit</option>
              <option value="CH4">CH₄ - Metan</option>
              <option value="SO2">SO₂ - Kükürt Dioksit</option>
              <option value="NH3">NH₃ - Amonyak</option>
              <option value="H2S">H₂S - Hidrojen Sülfür</option>
            </select>
          </div>
        </div>
      </div>

      {/* Section: Water Parameters */}
      <div className="border-t border-slate-700/50 pt-4">
        <h3 className="text-sm font-semibold text-blue-400 mb-3">💧 Su Parametreleri</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Su Hacmi (m³)</label>
            <input
              type="number"
              step="1e12"
              value={form.waterVolume_m3}
              onChange={e => updateField('waterVolume_m3', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            {errors.waterVolume_m3 && <p className={errorClass}>{errors.waterVolume_m3}</p>}
          </div>
          <div>
            <label className={labelClass}>Su pH (0-14)</label>
            <input
              type="number"
              step="0.1"
              min="0"
              max="14"
              value={form.waterPH}
              onChange={e => updateField('waterPH', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            {errors.waterPH && <p className={errorClass}>{errors.waterPH}</p>}
          </div>
        </div>

        <div className="mt-3">
          <label className={labelClass}>Su Sıcaklığı (K)</label>
          <input
            type="number"
            step="0.1"
            value={form.waterTemp_K}
            onChange={e => updateField('waterTemp_K', parseFloat(e.target.value) || 0)}
            className={inputClass}
          />
          <p className="text-[10px] text-slate-500 mt-0.5">≈ {waterTempC} °C | Faz: {form.waterTemp_K >= 373.15 ? 'Gaz' : form.waterTemp_K >= 273.15 ? 'Sıvı' : 'Katı'}</p>
          {errors.waterTemp_K && <p className={errorClass}>{errors.waterTemp_K}</p>}
        </div>
      </div>

      {/* Section: Soil Parameters */}
      <div className="border-t border-slate-700/50 pt-4">
        <h3 className="text-sm font-semibold text-amber-400 mb-3">🌱 Toprak Parametreleri</h3>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Toprak Nemi (kg/kg)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              max="1"
              value={form.soilMoisture_kgkg}
              onChange={e => updateField('soilMoisture_kgkg', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <p className="text-[10px] text-slate-500 mt-0.5">Kütle payı: 0.0 - 1.0</p>
            {errors.soilMoisture_kgkg && <p className={errorClass}>{errors.soilMoisture_kgkg}</p>}
          </div>
          <div>
            <label className={labelClass}>Yüzey Yoğunluğu (kg/m³)</label>
            <input
              type="number"
              step="10"
              value={form.soilDensity_kgm3}
              onChange={e => updateField('soilDensity_kgm3', parseFloat(e.target.value) || 0)}
              className={inputClass}
            />
            <p className="text-[10px] text-slate-500 mt-0.5">Kum: 1600 | Kaya: 2600</p>
            {errors.soilDensity_kgm3 && <p className={errorClass}>{errors.soilDensity_kgm3}</p>}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-3 pt-2 border-t border-slate-700/50">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2.5 bg-slate-700/60 hover:bg-slate-700 text-slate-300 rounded-lg text-sm font-medium transition-colors border border-slate-600/50"
        >
          İptal
        </button>
        <button
          type="submit"
          className="flex-1 px-4 py-2.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-lg text-sm font-semibold transition-colors shadow-lg shadow-sky-900/30"
        >
          🚀 Gezegeni Analiz Et
        </button>
      </div>
    </form>
  );
}
