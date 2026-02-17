import { TrendingUp, Phone, Briefcase, Clock, Loader2 } from 'lucide-react';
import { formatCurrency, formatNumber, formatTalkTime } from '../utils/formatters';

export default function TeamStats({ stats, loading }) {
  const items = [
    {
      label: 'Total Deals',
      value: stats?.totalDeals || 0,
      format: formatNumber,
      icon: Briefcase,
      color: 'text-mvp-success',
      bgColor: 'bg-mvp-success/10',
      borderColor: 'border-mvp-success/20',
    },
    {
      label: 'Total Calls',
      value: stats?.totalCalls || 0,
      format: formatNumber,
      icon: Phone,
      color: 'text-mvp-electric',
      bgColor: 'bg-mvp-electric/10',
      borderColor: 'border-mvp-electric/20',
    },
    {
      label: 'Pipeline Value',
      value: stats?.totalPipeline || 0,
      format: formatCurrency,
      icon: TrendingUp,
      color: 'text-mvp-gold',
      bgColor: 'bg-mvp-gold/10',
      borderColor: 'border-mvp-gold/20',
    },
    {
      label: 'Total Talk Time',
      value: stats?.totalTalkTime || 0,
      format: formatTalkTime,
      icon: Clock,
      color: 'text-mvp-fire',
      bgColor: 'bg-mvp-fire/10',
      borderColor: 'border-mvp-fire/20',
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {items.map((stat) => (
        <div
          key={stat.label}
          className={`bg-mvp-card rounded-xl border ${stat.borderColor} p-4 hover:scale-[1.02] transition-transform`}
        >
          <div className="flex items-center gap-2 mb-2">
            <div className={`p-1.5 rounded-lg ${stat.bgColor}`}>
              <stat.icon size={16} className={stat.color} />
            </div>
            <span className="text-xs text-white/50 uppercase tracking-wider">{stat.label}</span>
          </div>
          {loading ? (
            <Loader2 size={20} className="animate-spin text-white/20" />
          ) : (
            <div className={`text-2xl font-bold ${stat.color}`}>
              {stat.format(stat.value)}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
