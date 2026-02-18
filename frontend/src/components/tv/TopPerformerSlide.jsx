import { Trophy, Briefcase, Phone, Clock } from 'lucide-react';
import { formatNumber, formatTalkTime, formatCurrency } from '../../utils/formatters';
import Avatar from '../Avatar';

export default function TopPerformerSlide({ member }) {
  if (!member) {
    return <div className="text-[3vh] text-white/30 font-display">No data yet...</div>;
  }

  return (
    <div className="text-center w-full max-w-[50vw]">
      <div className="flex items-center justify-center gap-[0.8vw] mb-[2vh]">
        <Trophy className="text-mvp-gold" style={{ width: '4vh', height: '4vh' }} />
        <h2 className="text-[4vh] font-bold font-display text-mvp-gold">Top Performer</h2>
      </div>

      {/* Large avatar */}
      <div className="mx-auto mb-[2vh] glow-teal" style={{ width: '18vh', height: '18vh' }}>
        <Avatar member={member} size="w-full h-full" textSize="text-[7vh]" borderWidth="4px" />
      </div>

      <h3 className="text-[7vh] font-black font-display text-white mb-[0.5vh]">{member.name}</h3>
      <p className="text-[2.5vh] text-white/40 font-body mb-[3vh]">{member.role}</p>

      {/* Points */}
      <div className="text-[6vh] font-black gradient-gold font-display mb-[4vh]">
        {formatNumber(member.points)} pts
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-[1vw]">
        {[
          { icon: Briefcase, label: 'Deals', value: member.deals, color: 'text-mvp-success' },
          { icon: Phone, label: 'Calls', value: formatNumber(member.calls), color: 'text-mvp-accent' },
          { icon: Clock, label: 'Talk Time', value: formatTalkTime(member.talkTimeMinutes), color: 'text-mvp-fire' },
          { icon: Trophy, label: 'Pipeline', value: formatCurrency(member.pipelineValue), color: 'text-mvp-gold' },
        ].map((stat) => (
          <div key={stat.label} className="bg-mvp-card rounded-[1.5vh] border border-mvp-border p-[2vh]">
            <stat.icon className={`${stat.color} mx-auto mb-[1vh]`} style={{ width: '3vh', height: '3vh' }} />
            <div className={`text-[3.5vh] font-bold font-display ${stat.color}`}>{stat.value}</div>
            <div className="text-[1.3vh] text-white/40 font-display uppercase tracking-wider mt-[0.5vh]">{stat.label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
