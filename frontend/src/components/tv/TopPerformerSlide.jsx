import { Trophy, Briefcase, Phone, Clock } from 'lucide-react';
import { formatNumber, formatTalkTime, formatCurrency } from '../../utils/formatters';
import Avatar from '../Avatar';

export default function TopPerformerSlide({ member }) {
  if (!member) {
    return <div className="text-3xl text-white/30 font-display">No data yet...</div>;
  }

  return (
    <div className="text-center w-full max-w-[900px]">
      <div className="flex items-center justify-center gap-3 mb-6">
        <Trophy size={40} className="text-mvp-gold" />
        <h2 className="text-3xl font-bold font-display text-mvp-gold">Top Performer</h2>
      </div>

      {/* Large avatar */}
      <div className="mx-auto mb-6 glow-teal w-40 h-40">
        <Avatar member={member} size="w-40 h-40" textSize="text-6xl" borderWidth="4px" />
      </div>

      <h3 className="text-6xl font-black font-display text-white mb-2">{member.name}</h3>
      <p className="text-xl text-white/40 font-body mb-8">{member.role}</p>

      {/* Points */}
      <div className="text-5xl font-black gradient-gold font-display mb-10">
        {formatNumber(member.points)} pts
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-6">
        {[
          { icon: Briefcase, label: 'Deals', value: member.deals, color: 'text-mvp-success' },
          { icon: Phone, label: 'Calls', value: formatNumber(member.calls), color: 'text-mvp-accent' },
          { icon: Clock, label: 'Talk Time', value: formatTalkTime(member.talkTimeMinutes), color: 'text-mvp-fire' },
          { icon: Trophy, label: 'Pipeline', value: formatCurrency(member.pipelineValue), color: 'text-mvp-gold' },
        ].map((stat) => (
          <div key={stat.label} className="bg-mvp-card rounded-2xl border border-mvp-border p-6">
            <stat.icon size={28} className={`${stat.color} mx-auto mb-3`} />
            <div className={`text-3xl font-bold font-display ${stat.color}`}>{stat.value}</div>
            <div className="text-sm text-white/40 font-display uppercase tracking-wider mt-1">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
