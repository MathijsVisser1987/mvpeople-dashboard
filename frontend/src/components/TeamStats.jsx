import { TrendingUp, Phone, Briefcase, Clock, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatTalkTime } from '../utils/formatters';

export default function TeamStats({ stats, loading, targets }) {
  const items = [
    {
      label: 'Total Deals',
      value: stats?.totalDeals || 0,
      target: targets?.deals || 30,
      format: formatNumber,
      icon: Briefcase,
      color: 'text-mvp-success',
      bgColor: 'bg-mvp-success/10',
      borderColor: 'border-mvp-success/20',
      barColor: '#00e676',
    },
    {
      label: 'Total Calls',
      value: stats?.totalCalls || 0,
      target: targets?.calls || 3000,
      format: formatNumber,
      icon: Phone,
      color: 'text-mvp-accent',
      bgColor: 'bg-mvp-accent/10',
      borderColor: 'border-mvp-accent/20',
      barColor: '#59D6D6',
    },
    {
      label: 'Pipeline Value',
      value: stats?.totalPipeline || 0,
      target: targets?.pipeline || 500000,
      format: formatCurrency,
      icon: TrendingUp,
      color: 'text-mvp-gold',
      bgColor: 'bg-mvp-gold/10',
      borderColor: 'border-mvp-gold/20',
      barColor: '#ffd700',
    },
    {
      label: 'Total Talk Time',
      value: stats?.totalTalkTime || 0,
      target: targets?.talkTime || 5000,
      format: formatTalkTime,
      icon: Clock,
      color: 'text-mvp-fire',
      bgColor: 'bg-mvp-fire/10',
      borderColor: 'border-mvp-fire/20',
      barColor: '#ff6b35',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((stat) => {
        const pct = stat.target > 0 ? Math.min((stat.value / stat.target) * 100, 100) : 0;
        return (
          <div
            key={stat.label}
            className={`bg-mvp-card rounded-xl border ${stat.borderColor} p-4 hover:scale-[1.02] transition-transform`}
          >
            <div className="flex items-center gap-2 mb-2">
              <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
                <stat.icon size={16} className={stat.color} />
              </div>
              <span className="text-xs text-white/50 uppercase tracking-wider font-display font-semibold">{stat.label}</span>
            </div>
            {loading ? (
              <Loader2 size={20} className="animate-spin text-white/20" />
            ) : (
              <>
                <div className={`text-2xl font-bold font-display ${stat.color}`}>
                  {stat.format(stat.value)}
                </div>
                {/* Progress bar toward target */}
                <div className="mt-2">
                  <div className="flex justify-between text-[10px] text-white/30 font-display mb-1">
                    <span>{Math.round(pct)}%</span>
                    <span>Target: {stat.format(stat.target)}</span>
                  </div>
                  <div className="w-full h-1.5 bg-mvp-dark rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${pct}%`, backgroundColor: stat.barColor }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
