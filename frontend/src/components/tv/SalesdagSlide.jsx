import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { formatNumber } from '../../utils/formatters';
import Avatar from '../Avatar';

// End of business day: 18:00 Amsterdam time today
function getEndOfSalesdag() {
  const now = new Date();
  // Create a date for today at 18:00 Amsterdam
  const today = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/Amsterdam' }));
  today.setHours(18, 0, 0, 0);
  // Convert back to local time by computing the offset
  const amsterdamOffset = today.getTime() - new Date(today.toISOString()).getTime();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate(), 18, 0, 0);
}

function getTimeRemaining(endDate) {
  const total = endDate.getTime() - Date.now();
  if (total <= 0) return { hours: 0, minutes: 0, seconds: 0, total: 0 };
  return {
    hours: Math.floor((total / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((total / (1000 * 60)) % 60),
    seconds: Math.floor((total / 1000) % 60),
    total,
  };
}

export default function SalesdagSlide({ members }) {
  const endTime = getEndOfSalesdag();
  const [time, setTime] = useState(getTimeRemaining(endTime));

  useEffect(() => {
    const interval = setInterval(() => setTime(getTimeRemaining(endTime)), 1000);
    return () => clearInterval(interval);
  }, []);

  // Rank members by today's sales calls
  const ranked = [...(members || [])].sort(
    (a, b) => (b.salesdagToday?.salesCalls || 0) - (a.salesdagToday?.salesCalls || 0)
  );

  return (
    <div className="w-full max-w-[90vw]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[2.5vh]">
        <div className="flex items-center gap-[0.8vw]">
          <span style={{ fontSize: '3.5vh' }}>{'\uD83D\uDD25'}</span>
          <div>
            <h2 className="text-[4vh] font-bold font-display">
              <span className="text-orange-400">SALESDAG</span>
              <span className="text-white/60 ml-[0.5vw] text-[2.5vh] font-semibold">Double Points!</span>
            </h2>
            <p className="text-[1.8vh] text-white/40 font-body">All outbound Sales Calls earn 2x XP today</p>
          </div>
        </div>

        {/* Countdown to 18:00 */}
        {time.total > 0 && (
          <div className="flex items-center gap-[0.6vw]">
            <Clock className="text-white/40" style={{ width: '2.5vh', height: '2.5vh' }} />
            <div className="flex gap-[0.4vw]">
              {[
                { value: time.hours, label: 'H' },
                { value: time.minutes, label: 'M' },
                { value: time.seconds, label: 'S' },
              ].map(({ value, label }) => (
                <div key={label} className="bg-orange-500/15 backdrop-blur-sm rounded-[0.8vh] px-[0.8vw] py-[0.6vh] text-center border border-orange-500/30 min-w-[3vw]">
                  <div className="text-[2.5vh] font-bold text-orange-400 font-mono">{String(value).padStart(2, '0')}</div>
                  <div className="text-[0.9vh] text-orange-400/50 uppercase tracking-widest font-display">{label}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-7 gap-[1vw]">
        {ranked.map((member, index) => {
          const salesCalls = member.salesdagToday?.salesCalls || 0;
          const doubleXP = member.salesdagToday?.doubleXP || 0;
          const isLeader = index === 0 && salesCalls > 0;

          return (
            <div
              key={member.id}
              className={`bg-mvp-card rounded-[1.5vh] border p-[1.2vh] text-center flex flex-col items-center ${
                isLeader ? 'border-orange-400/50 bg-orange-400/5' : 'border-mvp-border'
              }`}
            >
              {/* Crown for leader */}
              {isLeader && (
                <div className="text-[2vh] mb-[0.3vh]">{'\uD83D\uDC51'}</div>
              )}

              {/* Avatar */}
              <div className="mb-[0.8vh]" style={{ width: '7vh', height: '7vh' }}>
                <Avatar member={member} size="w-full h-full" textSize="text-[2.5vh]" borderWidth="2px" />
              </div>

              {/* Name */}
              <div className="text-[1.8vh] font-bold text-white font-display mb-[0.5vh] truncate w-full">{member.name}</div>

              {/* Sales calls today */}
              <div className="text-[3vh] font-black text-orange-400 font-display leading-none">{salesCalls}</div>
              <div className="text-[0.9vh] text-white/30 uppercase tracking-wider font-display mb-[0.8vh]">sales calls</div>

              {/* Double XP earned */}
              <div className="w-full bg-orange-500/10 rounded-[0.5vh] py-[0.5vh] border border-orange-500/20">
                <div className="text-[1.5vh] font-bold text-orange-400 font-display">+{formatNumber(doubleXP)}</div>
                <div className="text-[0.8vh] text-orange-400/50 uppercase font-display">bonus xp</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
