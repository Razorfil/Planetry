import { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import type { PlanetParams, PlanetRecord, CapsuleMode } from './types';
import { analyzeHabitability, generateCapsuleDesigns } from './aiEngine';
import PlanetLibrary from './components/PlanetLibrary';
import PlanetForm from './components/PlanetForm';
import IssueList from './components/IssueList';
import HabitabilityChart from './components/HabitabilityChart';
import CapsuleReport from './components/CapsuleReport';

const STORAGE_KEY = 'akilli-kapsul-gezegenler';

function loadPlanets(): PlanetRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.map((p: PlanetRecord) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
    }
  } catch { /* ignore */ }
  return [];
}

function savePlanets(planets: PlanetRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(planets));
  } catch { /* ignore */ }
}

export default function App() {
  const [planets, setPlanets] = useState<PlanetRecord[]>(loadPlanets);
  const [activePlanetId, setActivePlanetId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (!initialized) {
      setInitialized(true);
      if (planets.length === 0) {
        setShowForm(true);
      }
    }
  }, [initialized, planets.length]);
  const [activeCapsuleMode, setActiveCapsuleMode] = useState<CapsuleMode>('economic');

  const activePlanet = planets.find(p => p.id === activePlanetId) || null;

  useEffect(() => {
    savePlanets(planets);
  }, [planets]);

  const handleNewPlanet = () => {
    setActivePlanetId(null);
    setShowForm(true);
  };

  const handleFormSubmit = (params: PlanetParams) => {
    const aiScore = analyzeHabitability(params);
    const capsules = generateCapsuleDesigns(params, aiScore);

    const record: PlanetRecord = {
      id: uuidv4(),
      params,
      aiScore,
      capsules,
      createdAt: new Date(),
    };

    setPlanets(prev => [record, ...prev]);
    setActivePlanetId(record.id);
    setShowForm(false);
  };

  const handleSelectPlanet = (planet: PlanetRecord) => {
    setActivePlanetId(planet.id);
    setShowForm(false);
  };

  const handleDeletePlanet = (id: string) => {
    setPlanets(prev => prev.filter(p => p.id !== id));
    if (activePlanetId === id) {
      setActivePlanetId(null);
    }
  };

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Left Panel - Planet Library */}
      <div className="w-72 flex-shrink-0 border-r border-slate-800 bg-slate-900/50 overflow-hidden">
        <PlanetLibrary
          planets={planets}
          activePlanetId={activePlanetId}
          onSelect={handleSelectPlanet}
          onDelete={handleDeletePlanet}
          onNewPlanet={handleNewPlanet}
        />
      </div>

      {/* Center Panel - Form or Planet Details */}
      <div className="w-[420px] flex-shrink-0 border-r border-slate-800 overflow-y-auto bg-slate-900/30">
        {showForm || (!activePlanet && planets.length === 0) ? (
          <div className="p-5">
            <div className="mb-5">
              <h1 className="text-xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent">
                🚀 Yeni Gezegen Keşfi
              </h1>
              <p className="text-xs text-slate-400 mt-1">
                SI birim sistemine göre gezegen parametrelerini tanımlayın.
              </p>
            </div>
            <PlanetForm
              onSubmit={handleFormSubmit}
              onCancel={() => {
                setShowForm(false);
                if (planets.length > 0 && !activePlanetId) {
                  setActivePlanetId(planets[0].id);
                }
              }}
            />
          </div>
        ) : activePlanet ? (
          <div className="p-5 space-y-5">
            {/* Planet Header */}
            <div>
              <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold text-slate-100">{activePlanet.params.name}</h1>
                <button
                  onClick={handleNewPlanet}
                  className="text-xs px-3 py-1.5 bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 rounded-lg transition-colors border border-indigo-700/30"
                >
                  + Yeni
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">
                Keşif: {activePlanet.createdAt.toLocaleDateString('tr-TR', {
                  day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                })}
              </p>
            </div>

            {/* Issues & Score */}
            <IssueList issues={activePlanet.aiScore.issues} habitabilityScore={activePlanet.aiScore.habitabilityScore} />

            {/* SI Parameters Summary */}
            <div className="border-t border-slate-700/50 pt-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">SI Parametre Özeti</h3>
              <div className="grid grid-cols-2 gap-1.5 text-xs">
                {[
                  ['🌡️ Sıcaklık', `${activePlanet.params.temperature_K} K (${(activePlanet.params.temperature_K - 273.15).toFixed(1)}°C)`],
                  ['🌀 Basınç', `${activePlanet.params.pressure_kPa} kPa`],
                  ['☠️ Zararlı Gaz', `${activePlanet.params.toxicGasDensity_kgm3} kg/m³ (${activePlanet.params.toxicGasType})`],
                  ['💧 Su Hacmi', `${activePlanet.params.waterVolume_m3.toExponential(1)} m³`],
                  ['🧪 Su pH', `${activePlanet.params.waterPH}`],
                  ['🌊 Su Sıcaklığı', `${activePlanet.params.waterTemp_K} K`],
                  ['💦 Toprak Nemi', `${activePlanet.params.soilMoisture_kgkg} kg/kg`],
                  ['🪨 Yüzey Yoğ.', `${activePlanet.params.soilDensity_kgm3} kg/m³`],
                ].map(([label, value], i) => (
                  <div key={i} className="bg-slate-800/40 rounded-lg px-2.5 py-1.5">
                    <span className="text-slate-500">{label}</span>
                    <p className="text-slate-300 font-medium truncate">{value}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Capsule Designs */}
            <div className="border-t border-slate-700/50 pt-3">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">Kapsül Tasarım Modları</h3>
              <div className="space-y-2.5">
                {(['economic', 'sustainable', 'rapid'] as CapsuleMode[]).map(mode => (
                  <CapsuleReport
                    key={mode}
                    design={activePlanet.capsules[mode]}
                    isActive={activeCapsuleMode === mode}
                    onClick={() => setActiveCapsuleMode(mode)}
                  />
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-5xl mb-4">🪐</p>
              <p className="text-slate-400 font-medium">Bir gezegen seçin</p>
              <p className="text-xs text-slate-600 mt-1">veya yeni bir simülasyon başlatın</p>
            </div>
          </div>
        )}
      </div>

      {/* Right Panel - Technical Schema & Charts */}
      <div className="flex-1 overflow-y-auto bg-slate-950/50 p-5">
        {activePlanet ? (
          <div className="space-y-6 max-w-2xl">
            {/* Title */}
            <div>
              <h2 className="text-lg font-bold text-slate-200">Teknik Şema & Mühendislik Raporu</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activePlanet.params.name} — {activePlanet.capsules[activeCapsuleMode].title}
              </p>
            </div>

            {/* Capsule SVG Visualization */}
            <div className="flex justify-center p-6 bg-slate-900/50 rounded-xl border border-slate-800">
              <div className="transform scale-150">
                {activePlanet.capsules[activeCapsuleMode] && (
                  <div className="flex flex-col items-center gap-4">
                    <svg width="200" height="170" viewBox="0 0 200 170" xmlns="http://www.w3.org/2000/svg">
                      {/* Background planet surface */}
                      <defs>
                        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#0f172a" />
                          <stop offset="60%" stopColor="#1e1b4b" />
                          <stop offset="100%" stopColor="#312e81" />
                        </linearGradient>
                        <radialGradient id="star1" cx="30%" cy="20%">
                          <stop offset="0%" stopColor="#fff" stopOpacity="0.8" />
                          <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                        </radialGradient>
                      </defs>
                      <rect x="0" y="0" width="200" height="170" rx="12" fill="url(#sky)" />

                      {/* Stars */}
                      {[[20,15],[60,8],[140,25],[170,10],[30,40],[155,18],[90,6],[10,30]].map(([cx,cy],i) => (
                        <circle key={i} cx={cx} cy={cy} r={1 + (i % 2)} fill="white" opacity={0.4 + (i % 3) * 0.15} />
                      ))}

                      {/* Distant planet/moon */}
                      <circle cx="160" cy="30" r="12" fill="#475569" opacity="0.6" />
                      <circle cx="160" cy="30" r="12" fill="none" stroke="#64748b" strokeWidth="0.5" opacity="0.3" />

                      {/* Ground */}
                      <ellipse cx="100" cy="155" rx="95" ry="10" fill="#1e293b" opacity="0.4" />

                      {/* Render capsule based on type */}
                      {activePlanet.capsules[activeCapsuleMode].formType === 'spherical' && (
                        <g>
                          <circle cx="100" cy="80" r="55" fill="#475569" stroke="#64748b" strokeWidth="2" />
                          <circle cx="100" cy="80" r="45" fill="none" stroke="#3b82f6" strokeWidth="1" strokeDasharray="6 3" opacity="0.5" />
                          <circle cx="100" cy="80" r="30" fill="none" stroke="#64748b" strokeWidth="0.8" opacity="0.3" />
                          <rect x="85" y="95" width="30" height="25" rx="3" fill="#334155" opacity="0.8" />
                          <circle cx="107" cy="108" r="1.5" fill="#3b82f6" />
                        </g>
                      )}

                      {activePlanet.capsules[activeCapsuleMode].formType === 'dome' && (
                        <g>
                          <path d="M35 120 Q35 15 100 15 Q165 15 165 120 Z" fill="#475569" stroke="#64748b" strokeWidth="2" />
                          <line x1="55" y1="40" x2="100" y2="15" stroke="#10b981" strokeWidth="0.7" opacity="0.4" />
                          <line x1="145" y1="40" x2="100" y2="15" stroke="#10b981" strokeWidth="0.7" opacity="0.4" />
                          <line x1="55" y1="40" x2="145" y2="40" stroke="#10b981" strokeWidth="0.7" opacity="0.4" />
                          <line x1="40" y1="80" x2="55" y2="40" stroke="#10b981" strokeWidth="0.7" opacity="0.4" />
                          <line x1="160" y1="80" x2="145" y2="40" stroke="#10b981" strokeWidth="0.7" opacity="0.4" />
                          <line x1="35" y1="120" x2="165" y2="120" stroke="#64748b" strokeWidth="2" />
                          <rect x="85" y="60" width="30" height="45" rx="3" fill="#334155" opacity="0.7" />
                          <rect x="89" y="64" width="22" height="18" rx="2" fill="#38bdf8" opacity="0.4" />
                        </g>
                      )}

                      {activePlanet.capsules[activeCapsuleMode].formType === 'modular' && (
                        <g>
                          <rect x="50" y="30" width="100" height="65" rx="10" fill="#475569" stroke="#64748b" strokeWidth="2" />
                          <rect x="20" y="50" width="40" height="35" rx="6" fill="#334155" stroke="#f97316" strokeWidth="1.5" />
                          <rect x="140" y="45" width="40" height="45" rx="6" fill="#334155" stroke="#f97316" strokeWidth="1.5" />
                          <rect x="56" y="60" width="8" height="12" rx="2" fill="#f97316" opacity="0.5" />
                          <rect x="136" y="60" width="8" height="12" rx="2" fill="#f97316" opacity="0.5" />
                          <circle cx="80" cy="50" r="7" fill="#38bdf8" opacity="0.4" />
                          <circle cx="120" cy="50" r="7" fill="#38bdf8" opacity="0.4" />
                          <line x1="55" y1="95" x2="45" y2="140" stroke="#64748b" strokeWidth="2.5" />
                          <line x1="145" y1="95" x2="155" y2="140" stroke="#64748b" strokeWidth="2.5" />
                        </g>
                      )}

                      {activePlanet.capsules[activeCapsuleMode].formType === 'aerodynamic' && (
                        <g>
                          <path d="M100 8 Q160 8 165 60 Q168 90 160 125 Q155 140 100 140 Q45 140 40 125 Q32 90 35 60 Q40 8 100 8 Z" fill="#475569" stroke="#8b5cf6" strokeWidth="2" />
                          <path d="M48 90 Q100 108 152 90" fill="none" stroke="#a78bfa" strokeWidth="1" opacity="0.4" />
                          <ellipse cx="100" cy="40" rx="10" ry="7" fill="#38bdf8" opacity="0.4" />
                          <polygon points="150,55 168,50 165,70" fill="#a78bfa" opacity="0.4" />
                        </g>
                      )}

                      {activePlanet.capsules[activeCapsuleMode].formType === 'telescopic' && (
                        <g>
                          <rect x="45" y="55" width="110" height="50" rx="5" fill="#475569" stroke="#06b6d4" strokeWidth="2" />
                          <rect x="58" y="38" width="84" height="22" rx="4" fill="#334155" stroke="#0891b2" strokeWidth="1.5" />
                          <rect x="68" y="22" width="64" height="18" rx="4" fill="#334155" stroke="#0891b2" strokeWidth="1.5" />
                          <line x1="100" y1="22" x2="100" y2="10" stroke="#06b6d4" strokeWidth="1.5" />
                          <circle cx="100" cy="9" r="2.5" fill="#06b6d4" />
                        </g>
                      )}

                      {/* Glow */}
                      <ellipse cx="100" cy="80" rx="55" ry="50" fill="none" stroke="#38bdf8" strokeWidth="0.5" opacity="0.1" />
                    </svg>
                    <span className="text-xs text-slate-500 italic">AI Destekli Teknik Şema</span>
                  </div>
                )}
              </div>
            </div>

            {/* Habitability Radar Chart */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                📊 Yaşam Yüzdesi Radar Grafiği
              </h3>
              <HabitabilityChart aiScore={activePlanet.aiScore} />
            </div>

            {/* Engineering Report */}
            <div className="bg-slate-900/50 rounded-xl border border-slate-800 p-4">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                📋 Mühendislik Raporu
              </h3>

              <div className="space-y-3 text-sm">
                {activePlanet.capsules[activeCapsuleMode] && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Form Tipi</p>
                        <p className="text-slate-200 font-semibold capitalize">
                          {activePlanet.capsules[activeCapsuleMode].formType}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Zırh Sistemi</p>
                        <p className="text-slate-200 font-semibold text-sm">
                          {activePlanet.capsules[activeCapsuleMode].armorType}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Maliyet Tasarrufu</p>
                        <p className="text-emerald-400 font-bold text-lg">
                          %{activePlanet.capsules[activeCapsuleMode].costSavings}
                        </p>
                      </div>
                      <div className="bg-slate-800/50 rounded-lg p-3">
                        <p className="text-xs text-slate-500">Kurulum Süresi</p>
                        <p className="text-sky-400 font-bold text-lg">
                          {activePlanet.capsules[activeCapsuleMode].setupTime_s} <span className="text-xs">saniye</span>
                        </p>
                      </div>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">AI Analiz Raporu</p>
                      <p className="text-slate-300 text-sm leading-relaxed">
                        {activePlanet.capsules[activeCapsuleMode].description}
                      </p>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-2">Mühendislik Kararları</p>
                      <ul className="space-y-1.5">
                        {activePlanet.capsules[activeCapsuleMode].features.map((f, i) => (
                          <li key={i} className="text-xs text-slate-400 flex gap-2">
                            <span className="text-sky-400">⚙️</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="bg-slate-800/30 rounded-lg p-3">
                      <p className="text-xs text-slate-500 mb-1">♻️ Sürdürülebilirlik Notu</p>
                      <p className="text-slate-400 text-sm">
                        {activePlanet.capsules[activeCapsuleMode].sustainabilityNotes}
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center p-8">
              <p className="text-6xl mb-4">🔬</p>
              <p className="text-slate-400 font-medium">Teknik şema ve rapor burada görüntülenecek</p>
              <p className="text-xs text-slate-600 mt-1">Bir gezegen seçip analiz edin</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
