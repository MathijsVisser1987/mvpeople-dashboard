import { Phone, Clock } from 'lucide-react';
import { formatNumber, formatTalkTime } from '../../utils/formatters';
import Avatar from '../Avatar';

export default function CallStatsTodaySlide({ members }) {
  if (!members || members.length === 0) {
    return <div className="text-[3vh] text-white/30 font-display">Loading call stats...</div>;
  }

  // Sort by today's calls descending
  const ranked = [...members].sort(
    (a, b) => (b.callsToday || 0) - (a.callsToday || 0)
  );

  const totalCalls = ranked.reduce((s, m) => s + (m.callsToday || 0), 0);
  const totalTalkTime = ranked.reduce((s, m) => s + (m.talkTimeToday || 0), 0);

  return (
    <div className="w-full max-w-[90vw]">
      {/* Header */}
      <div className="flex items-center justify-between mb-[2.5vh]">
        <div className="flex items-center gap-[0.8vw]">
          <Phone className="text-mvp-accent" style={{ width: '3.5vh', height: '3.5vh' }} />
          <div>
            <h2 className="text-[4vh] font-bold font-display">
              <span className="text-mvp-accent">Call Stats</span>
              <span className="text-white/60 ml-[0.5vw] text-[2.5vh] font-semibold">Today</span>
            </h2>
            <p className="text-[1.8vh] text-white/40 font-body">8x8 Calls &amp; Talk Time</p>
          </div>
        </div>

        {/* Team totals */}
        <div className="flex gap-[1.5vw]">
          <div className="bg-mvp-card rounded-[1vh] border border-mvp-border px-[1.2vw] py-[1vh] text-center">
            <div className="text-[3vh] font-bold text-mvp-accent font-display">{formatNumber(totalCalls)}</div>
            <div className="text-[1vh] text-white/30 uppercase tracking-wider font-display">Total Calls</div>
          </div>
          <div className="bg-mvp-card rounded-[1vh] border border-mvp-border px-[1.2vw] py-[1vh] text-center">
            <div className="text-[3vh] font-bold text-mvp-fire font-display">{formatTalkTime(totalTalkTime)}</div>
            <div className="text-[1vh] text-white/30 uppercase tracking-wider font-display">Total Talk Time</div>
          </div>
        </div>
      </div>

      {/* Member cards */}
      <div className="grid grid-cols-7 gap-[1vw]">
        {ranked.map((member, index) => {
          const calls = member.callsToday || 0;
          const talkTime = member.talkTimeToday || 0;
          const isLeader = index === 0 && calls > 0;

          return (
            <div
              key={member.id}
              className={`bg-mvp-card rounded-[1.5vh] border p-[1.2vh] text-center flex flex-col items-center ${
                isLeader ? 'border-mvp-accent/50 bg-mvp-accent/5' : 'border-mvp-border'
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

              {/* Calls today */}
              <div className="flex items-center justify-center gap-[0.3vw] mb-[0.3vh]">
                <Phone className="text-mvp-accent" style={{ width: '1.8vh', height: '1.8vh' }} />
                <span className="text-[3vh] font-black text-mvp-accent font-display leading-none">{calls}</span>
              </div>
              <div className="text-[0.9vh] text-white/30 uppercase tracking-wider font-display mb-[0.8vh]">calls</div>

              {/* Talk time */}
              <div className="w-full bg-mvp-fire/10 rounded-[0.5vh] py-[0.5vh] border border-mvp-fire/20">
                <div className="flex items-center justify-center gap-[0.2vw]">
                  <Clock className="text-mvp-fire" style={{ width: '1.4vh', height: '1.4vh' }} />
                  <span className="text-[1.5vh] font-bold text-mvp-fire font-display">{formatTalkTime(talkTime)}</span>
                </div>
                <div className="text-[0.8vh] text-mvp-fire/50 uppercase font-display">talk time</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
