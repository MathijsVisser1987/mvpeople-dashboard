import { Target } from 'lucide-react';

function KPIBar({ kpi }) {
  const pct = Math.min(kpi.pct, 200);
  const barWidth = Math.min(pct, 100);

  return (
    <div className="flex items-center gap-2 py-1.5">
      <span className="text-sm w-5 text-center">{kpi.emoji}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between mb-0.5">
          <span className="text-xs font-semibold text-white/80 font-display truncate">{kpi.label}</span>
          <span className="text-xs font-display ml-2 whitespace-nowrap">
            <span className={kpi.onTrack ? 'text-emerald-400' : 'text-red-400'}>{kpi.actual}</span>
            <span className="text-white/30"> / {kpi.proRated}</span>
            <span className="text-white/20 text-[10px]"> ({kpi.target})</span>
          </span>
        </div>
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              kpi.onTrack ? 'bg-emerald-500' : pct >= 70 ? 'bg-yellow-500' : 'bg-red-500'
            }`}
            style={{ width: `${barWidth}%` }}
          />
        </div>
      </div>
      <span className={`text-xs font-bold font-display w-10 text-right ${
        kpi.onTrack ? 'text-emerald-400' : 'text-red-400'
      }`}>
        {kpi.variance >= 0 ? '+' : ''}{kpi.variance}
      </span>
    </div>
  );
}

function MemberKPIs({ member }) {
  if (!member.kpis || member.kpis.length === 0) return null;

  const onTrackCount = member.kpis.filter(k => k.onTrack).length;
  const totalKpis = member.kpis.length;

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full overflow-hidden bg-mvp-dark flex items-center justify-center">
            {member.photo ? (
              <img src={member.photo} alt={member.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-bold font-display" style={{ color: member.color }}>{member.avatar}</span>
            )}
          </div>
          <div>
            <span className="text-sm font-bold text-white font-display">{member.name}</span>
            <span className="text-[10px] text-white/30 ml-2 font-body">{member.targetProfile === 'recruiter360' ? '360' : 'Starter'}</span>
          </div>
        </div>
        <div className={`text-xs font-bold font-display px-2 py-0.5 rounded-full ${
          onTrackCount === totalKpis ? 'bg-emerald-500/20 text-emerald-400' :
          onTrackCount >= totalKpis / 2 ? 'bg-yellow-500/20 text-yellow-400' :
          'bg-red-500/20 text-red-400'
        }`}>
          {onTrackCount}/{totalKpis}
        </div>
      </div>

      {/* T / A / V header */}
      <div className="flex items-center justify-end gap-1 mb-1 text-[9px] text-white/25 font-display uppercase tracking-wider">
        <span className="mr-auto ml-7">KPI</span>
        <span>A / T (Month)</span>
        <span className="w-10 text-right">Var</span>
      </div>

      <div className="divide-y divide-white/5">
        {member.kpis.map(kpi => (
          <KPIBar key={kpi.key} kpi={kpi} />
        ))}
      </div>

      {/* Headhunt Challenge progress bar for starters */}
      {member.headhuntChallenge && (
        <div className="mt-3 pt-3 border-t border-white/10">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-semibold text-amber-400 font-display">
              Headhunt Bonus
            </span>
            <span className="text-xs font-display">
              <span className="text-white/80">{member.headhuntChallenge.current}/{member.headhuntChallenge.target}</span>
              <span className="text-amber-400 ml-1">&mdash; &euro;{member.headhuntChallenge.bonus}</span>
            </span>
          </div>
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min((member.headhuntChallenge.current / member.headhuntChallenge.target) * 100, 100)}%`,
                background: member.headhuntChallenge.qualified
                  ? 'linear-gradient(90deg, #fbbf24, #f59e0b)'
                  : 'linear-gradient(90deg, #d97706, #b45309)',
              }}
            />
          </div>
          {member.headhuntChallenge.qualified && (
            <div className="mt-1.5 text-center">
              <span className="text-[10px] font-bold text-amber-400 bg-amber-400/15 px-2 py-0.5 rounded-full font-display uppercase tracking-wider">
                Qualified!
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function KPITargets({ members }) {
  const membersWithKPIs = (members || []).filter(m => m.kpis && m.kpis.length > 0);

  if (membersWithKPIs.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <Target size={20} className="text-mvp-accent" />
        <h2 className="text-lg font-bold font-display">KPI Targets</h2>
        <span className="text-xs text-white/30 ml-1 font-body">T / A / V</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        {membersWithKPIs.map(member => (
          <MemberKPIs key={member.id} member={member} />
        ))}
      </div>
    </div>
  );
}
