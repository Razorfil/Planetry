import type { PlanetRecord } from '../types';

interface PlanetLibraryProps {
  planets: PlanetRecord[];
  activePlanetId: string | null;
  onSelect: (planet: PlanetRecord) => void;
  onDelete: (id: string) => void;
  onNewPlanet: () => void;
}

export default function PlanetLibrary({ planets, activePlanetId, onSelect, onDelete, onNewPlanet }: PlanetLibraryProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-slate-700/50">
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <span>🪐</span> Gezegen Kütüphanesi
        </h2>
        <p className="text-[10px] text-slate-500 mt-1">{planets.length} gezegen keşfedildi</p>
      </div>

      {/* New Planet Button */}
      <div className="p-3">
        <button
          onClick={onNewPlanet}
          className="w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white rounded-lg text-sm font-semibold transition-all shadow-lg shadow-indigo-900/30 flex items-center justify-center gap-2"
        >
          <span className="text-lg">+</span> Yeni Gezegen Keşfet
        </button>
      </div>

      {/* Planet List */}
      <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-2">
        {planets.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-4xl mb-2">🌌</p>
            <p className="text-xs text-slate-500">Henüz keşfedilmiş gezegen yok.</p>
            <p className="text-xs text-slate-600 mt-1">Yeni bir simülasyon başlatın.</p>
          </div>
        ) : (
          planets.map(planet => (
            <div
              key={planet.id}
              onClick={() => onSelect(planet)}
              className={`
                p-3 rounded-lg border cursor-pointer transition-all duration-200
                ${activePlanetId === planet.id
                  ? 'bg-sky-900/30 border-sky-600/50 ring-1 ring-sky-500/30'
                  : 'bg-slate-800/40 border-slate-700/40 hover:bg-slate-800/70 hover:border-slate-600/50'
                }
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-slate-200 truncate">
                    {planet.params.name}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-lg font-bold ${getScoreColor(planet.aiScore.habitabilityScore)}`}>
                      %{planet.aiScore.habitabilityScore.toFixed(0)}
                    </span>
                    <span className="text-[10px] text-slate-600">
                      {planet.params.temperature_K.toFixed(0)} K
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {planet.aiScore.issues.filter(i => i.severity === 'critical').slice(0, 2).map((issue, idx) => (
                      <span key={idx} className="text-[9px] px-1.5 py-0.5 rounded bg-red-900/30 text-red-400 border border-red-700/30">
                        {issue.label}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(planet.id);
                  }}
                  className="text-slate-600 hover:text-red-400 transition-colors text-sm p-1"
                  title="Sil"
                >
                  🗑️
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
