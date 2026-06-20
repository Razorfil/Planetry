import type { CapsuleDesign, CapsuleMode } from '../types';
import CapsuleSVG from './CapsuleSVG';

interface CapsuleReportProps {
  design: CapsuleDesign;
  isActive: boolean;
  onClick: () => void;
}

const modeColors: Record<CapsuleMode, { bg: string; border: string; badge: string; text: string }> = {
  economic: {
    bg: 'bg-emerald-900/20',
    border: 'border-emerald-700/40',
    badge: 'bg-emerald-600/20 text-emerald-400 border-emerald-600/30',
    text: 'text-emerald-100',
  },
  sustainable: {
    bg: 'bg-green-900/20',
    border: 'border-green-700/40',
    badge: 'bg-green-600/20 text-green-400 border-green-600/30',
    text: 'text-green-100',
  },
  rapid: {
    bg: 'bg-orange-900/20',
    border: 'border-orange-700/40',
    badge: 'bg-orange-600/20 text-orange-400 border-orange-600/30',
    text: 'text-orange-100',
  },
};

export default function CapsuleReport({ design, isActive, onClick }: CapsuleReportProps) {
  const colors = modeColors[design.mode];

  const formTypeLabels: Record<string, string> = {
    spherical: 'Küresel',
    dome: 'Kubbe',
    modular: 'Modüler',
    aerodynamic: 'Aerodinamik',
    telescopic: 'Teleskobik',
  };

  return (
    <div
      onClick={onClick}
      className={`
        p-4 rounded-xl border cursor-pointer transition-all duration-300
        ${colors.bg} ${colors.border}
        ${isActive ? 'ring-2 ring-sky-500/60 scale-[1.02]' : 'hover:scale-[1.01] hover:border-sky-600/30'}
      `}
    >
      <div className="flex items-center gap-3 mb-3">
        <span className={`text-xs font-bold px-2 py-0.5 rounded-full border ${colors.badge}`}>
          {design.title}
        </span>
      </div>

      <div className="flex gap-4">
        <div className="flex-shrink-0">
          <CapsuleSVG design={design} size={120} />
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          <p className={`text-xs ${colors.text} leading-relaxed`}>{design.description}</p>
          
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-800/50 rounded-lg px-2 py-1.5">
              <span className="text-slate-500">Form:</span>{' '}
              <span className="text-slate-300 font-medium">{formTypeLabels[design.formType]}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-1.5">
              <span className="text-slate-500">Zırh:</span>{' '}
              <span className="text-slate-300 font-medium text-[11px]">{design.armorType}</span>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-1.5">
              <span className="text-slate-500">Maliyet:</span>{' '}
              <span className="text-emerald-400 font-medium">
                {design.costSavings > 0 ? `%${design.costSavings} tasarruf` : 'Standart'}
              </span>
            </div>
            <div className="bg-slate-800/50 rounded-lg px-2 py-1.5">
              <span className="text-slate-500">Kurulum:</span>{' '}
              <span className="text-sky-400 font-medium">{design.setupTime_s} s</span>
            </div>
          </div>
        </div>
      </div>

      {isActive && (
        <div className="mt-4 pt-3 border-t border-slate-700/50 space-y-2 animate-fadeIn">
          <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Özellikler</h4>
          <ul className="space-y-1.5">
            {design.features.map((f, i) => (
              <li key={i} className="text-xs text-slate-300 flex gap-2">
                <span className="text-sky-400 flex-shrink-0">▸</span>
                {f}
              </li>
            ))}
          </ul>
          <div className="mt-2 pt-2 border-t border-slate-700/30">
            <p className="text-[11px] text-slate-500">
              <span className="text-slate-400">♻️ Sürdürülebilirlik:</span> {design.sustainabilityNotes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
