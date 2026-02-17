import { useState } from 'react';
import { Target, Star, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useMissions } from '../hooks/useMissions';
import Avatar from '../components/Avatar';

function ProgressBar({ pct, color }) {
  return (
    <div className="w-full h-2 bg-mvp-dark rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, backgroundColor: color }}
      />
    </div>
  );
}

function MissionCard({ mission }) {
  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg border ${
      mission.completed
        ? 'border-mvp-success/30 bg-mvp-success/5'
        : 'border-mvp-border bg-mvp-dark/30'
    }`}>
      <span className="text-xl w-8 text-center">{mission.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-display font-semibold text-sm">{mission.name}</span>
          {mission.completed && <CheckCircle2 size={14} className="text-mvp-success" />}
        </div>
        <p className="text-xs text-white/30 font-body">{mission.description}</p>
        <div className="mt-1.5 flex items-center gap-2">
          <ProgressBar pct={mission.pct} color={mission.completed ? '#00e676' : '#59D6D6'} />
          <span className="text-xs text-white/40 font-mono shrink-0">
            {mission.current}/{mission.target}
          </span>
        </div>
      </div>
      <div className="text-right shrink-0">
        <span className={`text-sm font-bold font-display ${
          mission.completed ? 'text-mvp-gold' : 'text-white/20'
        }`}>
          +{mission.xp} XP
        </span>
      </div>
    </div>
  );
}

function MemberMissions({ memberData }) {
  const [showAll, setShowAll] = useState(false);
  const categories = ['daily', 'weekly', 'monthly'];
  const displayed = showAll ? memberData.missions : memberData.missions.slice(0, 5);

  return (
    <div className="bg-mvp-card rounded-xl border border-mvp-border overflow-hidden">
      {/* Member header */}
      <div className="p-5 border-b border-mvp-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Avatar member={memberData} size="w-12 h-12" textSize="text-lg" />
          <div>
            <h3 className="text-lg font-bold font-display">{memberData.name}</h3>
            <p className="text-xs text-white/30 font-body">
              {memberData.completedCount}/{memberData.totalMissions} missions completed
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-xl font-bold font-display text-mvp-gold">{memberData.totalXp} XP</div>
          <div className="w-24 h-2 bg-mvp-dark rounded-full overflow-hidden mt-1">
            <div
              className="h-full bg-mvp-gold rounded-full transition-all"
              style={{ width: `${(memberData.completedCount / memberData.totalMissions) * 100}%` }}
            />
          </div>
        </div>
      </div>

      {/* Missions list */}
      <div className="p-5 space-y-2">
        {displayed.map(mission => (
          <MissionCard key={mission.id} mission={mission} />
        ))}
        {memberData.missions.length > 5 && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-sm text-mvp-accent/60 hover:text-mvp-accent font-display transition-colors w-full text-center py-2"
          >
            {showAll ? 'Show less' : `Show ${memberData.missions.length - 5} more`}
          </button>
        )}
      </div>
    </div>
  );
}

export default function Missions() {
  const { missions, loading } = useMissions();
  const [selectedMember, setSelectedMember] = useState(null);

  // Sort by XP earned
  const sorted = [...missions].sort((a, b) => b.totalXp - a.totalXp);
  const displayed = selectedMember
    ? sorted.filter(m => m.name === selectedMember)
    : sorted;

  return (
    <div className="min-h-screen bg-mvp-dark">
      {/* Header */}
      <header className="border-b border-mvp-border bg-mvp-card/50 backdrop-blur sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-4">
          <Link to="/" className="text-white/40 hover:text-white transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <img src="/mvpeople-logo.png" alt="MVPeople" className="h-8" />
          <Target size={20} className="text-mvp-accent" />
          <h1 className="text-xl font-bold font-display">Missions</h1>

          {/* Member filter */}
          <div className="ml-auto flex gap-1">
            <button
              onClick={() => setSelectedMember(null)}
              className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${
                !selectedMember ? 'bg-mvp-accent/20 text-mvp-accent' : 'text-white/30 hover:text-white/50'
              }`}
            >
              All
            </button>
            {sorted.map(m => (
              <button
                key={m.name}
                onClick={() => setSelectedMember(m.name === selectedMember ? null : m.name)}
                className={`px-3 py-1 rounded-md text-xs font-display transition-colors ${
                  selectedMember === m.name ? 'bg-mvp-accent/20 text-mvp-accent' : 'text-white/30 hover:text-white/50'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={32} className="animate-spin text-mvp-accent" />
          </div>
        ) : displayed.length === 0 ? (
          <div className="text-center py-20 text-white/30 font-body">
            No mission data available yet.
          </div>
        ) : (
          <>
            {/* XP Leaderboard summary */}
            {!selectedMember && (
              <div className="grid grid-cols-7 gap-3 mb-6">
                {sorted.map((m, i) => (
                  <button
                    key={m.name}
                    onClick={() => setSelectedMember(m.name)}
                    className="bg-mvp-card rounded-xl border border-mvp-border p-3 text-center hover:border-mvp-accent/30 transition-colors"
                  >
                    <Avatar member={m} size="w-10 h-10 mx-auto" textSize="text-sm" />
                    <div className="text-xs font-display mt-2">{m.name}</div>
                    <div className="text-sm font-bold text-mvp-gold font-display mt-1">{m.totalXp} XP</div>
                    <div className="text-[10px] text-white/30 font-display">
                      {m.completedCount}/{m.totalMissions}
                    </div>
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-6">
              {displayed.map(memberData => (
                <MemberMissions key={memberData.name} memberData={memberData} />
              ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
