import type { Issue } from '../types';

interface IssueListProps {
  issues: Issue[];
  habitabilityScore: number;
}

const severityConfig = {
  critical: { bg: 'bg-red-900/30', border: 'border-red-600/30', text: 'text-red-400', badge: 'bg-red-600/20 text-red-400', icon: '🔴', label: 'Kritik' },
  warning: { bg: 'bg-amber-900/30', border: 'border-amber-600/30', text: 'text-amber-400', badge: 'bg-amber-600/20 text-amber-400', icon: '🟡', label: 'Uyarı' },
  mild: { bg: 'bg-blue-900/30', border: 'border-blue-600/30', text: 'text-blue-400', badge: 'bg-blue-600/20 text-blue-400', icon: '🔵', label: 'Hafif' },
};

export default function IssueList({ issues, habitabilityScore }: IssueListProps) {
  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-emerald-400';
    if (score >= 40) return 'text-amber-400';
    return 'text-red-400';
  };

  const getScoreEmoji = (score: number) => {
    if (score >= 70) return '🟢';
    if (score >= 40) return '🟡';
    if (score >= 20) return '🟠';
    return '🔴';
  };

  if (issues.length === 0) {
    return (
      <div className="p-6 bg-emerald-900/20 border border-emerald-700/30 rounded-xl text-center">
        <p className="text-3xl mb-2">🎉</p>
        <p className="text-emerald-400 font-semibold">Tebrikler!</p>
        <p className="text-emerald-300/70 text-sm mt-1">Bu gezegen Dünya benzeri ideal koşullara sahip!</p>
      </div>
    );
  }

  const criticalCount = issues.filter(i => i.severity === 'critical').length;

  return (
    <div className="space-y-3">
      {/* Score Banner */}
      <div className="p-4 bg-slate-800/70 border border-slate-700/50 rounded-xl text-center">
        <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Doğal Yaşama Uygunluk</p>
        <p className={`text-4xl font-bold ${getScoreColor(habitabilityScore)}`}>
          {getScoreEmoji(habitabilityScore)} %{habitabilityScore.toFixed(1)}
        </p>
        <div className="mt-2 w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ${
              habitabilityScore >= 70 ? 'bg-emerald-500' :
              habitabilityScore >= 40 ? 'bg-amber-500' : 'bg-red-500'
            }`}
            style={{ width: `${habitabilityScore}%` }}
          />
        </div>
        <div className="flex justify-between mt-1 text-[10px] text-slate-500">
          <span>Yaşanmaz</span>
          <span>Dünya (100%)</span>
        </div>
        {criticalCount > 0 && (
          <p className="text-xs text-red-400 mt-2 font-medium">
            ⚠️ {criticalCount} kritik {criticalCount === 1 ? 'sorun' : 'sorun'} tespit edildi!
          </p>
        )}
      </div>

      {/* Issues */}
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Tespit Edilen Sorunlar ({issues.length})
        </h4>
        {issues.map((issue, idx) => {
          const cfg = severityConfig[issue.severity];
          return (
            <div
              key={idx}
              className={`p-3 rounded-lg border ${cfg.bg} ${cfg.border} transition-all`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${cfg.badge}`}>
                      {cfg.icon} {cfg.label}
                    </span>
                    <span className={`text-sm font-medium ${cfg.text}`}>{issue.label}</span>
                  </div>
                  <div className="text-xs text-slate-400 space-y-0.5">
                    <p>
                      <span className="text-slate-500">Mevcut:</span>{' '}
                      <span className={cfg.text}>{issue.value.toLocaleString()} {issue.unit}</span>
                    </p>
                    <p>
                      <span className="text-slate-500">İdeal Aralık:</span>{' '}
                      <span className="text-slate-300">
                        {issue.idealMin.toLocaleString()} – {issue.idealMax.toLocaleString()} {issue.unit}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
