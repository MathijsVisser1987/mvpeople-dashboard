import { useState, useEffect, useMemo, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useLeaderboard } from '../hooks/useLeaderboard';
import { useCelebrations } from '../hooks/useCelebrations';
import { useYTD } from '../hooks/useYTD';
import TVHeader from '../components/tv/TVHeader';
import LeaderboardSlide from '../components/tv/LeaderboardSlide';
import TopPerformerSlide from '../components/tv/TopPerformerSlide';
import CompetitionSlide from '../components/tv/CompetitionSlide';
import RecentWinsSlide from '../components/tv/RecentWinsSlide';
import TeamTargetsSlide from '../components/tv/TeamTargetsSlide';
import IndividualSlide from '../components/tv/IndividualSlide';
import MVPOfYearSlide from '../components/tv/MVPOfYearSlide';
import SalesdagSlide from '../components/tv/SalesdagSlide';
import CallStatsTodaySlide from '../components/tv/CallStatsTodaySlide';
import SalesdashSlide from '../components/tv/SalesdashSlide';
import CelebrationOverlay from '../components/tv/CelebrationOverlay';

const SLIDE_DURATION = 12000; // 12 seconds per slide
const CELEBRATION_REPLAY_HOURS = 4; // Re-show celebrations for this many hours

export default function TVSlideshow() {
  const { data } = useLeaderboard();
  const { celebrations, unseen, markSeen } = useCelebrations();
  const { standings: ytdStandings } = useYTD();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showCelebration, setShowCelebration] = useState(null);
  const lastReplayRef = useRef({}); // track last replay time per celebration id

  const leaderboard = data?.leaderboard || [];
  const teamStats = data?.teamStats || {};

  const slides = useMemo(() => {
    const base = ['leaderboard', 'top-performer', 'salesdash', 'call-stats-today', 'competition', 'recent-wins', 'team-targets', 'mvp-of-year'];
    if (data?.isSalesdag) base.push('salesdag');
    return base;
  }, [data?.isSalesdag]);

  // Add tv-mode class to body
  useEffect(() => {
    document.body.classList.add('tv-mode');
    return () => document.body.classList.remove('tv-mode');
  }, []);

  // Auto-rotate slides
  useEffect(() => {
    if (showCelebration) return; // Pause rotation during celebration
    const timer = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % slides.length);
    }, SLIDE_DURATION);
    return () => clearInterval(timer);
  }, [slides.length, showCelebration]);

  // Pick up unseen celebrations (first-time detection only)
  const shownUnseenRef = useRef(new Set());
  useEffect(() => {
    if (unseen.length > 0 && !showCelebration) {
      const cel = unseen.find(c => !shownUnseenRef.current.has(c.id));
      if (cel) {
        shownUnseenRef.current.add(cel.id);
        lastReplayRef.current[cel.id] = Date.now();
        setShowCelebration(cel);
        markSeen([cel.id]);
      }
    }
  }, [unseen, showCelebration, markSeen]);

  // Re-show recent celebrations at start of each slide rotation
  useEffect(() => {
    if (currentSlide !== 0 || showCelebration) return;
    const now = Date.now();
    const cutoff = now - CELEBRATION_REPLAY_HOURS * 60 * 60 * 1000;
    const recent = celebrations.filter(c => {
      const ts = new Date(c.timestamp).getTime();
      if (ts < cutoff) return false;
      // Don't replay if shown less than 1 full rotation ago
      const lastShown = lastReplayRef.current[c.id] || 0;
      return now - lastShown > slides.length * SLIDE_DURATION;
    });
    if (recent.length > 0) {
      const cel = recent[0];
      lastReplayRef.current[cel.id] = now;
      setShowCelebration(cel);
    }
  }, [currentSlide, showCelebration, celebrations, slides.length]);

  // Auto-dismiss celebration after 8 seconds
  useEffect(() => {
    if (!showCelebration) return;
    const timer = setTimeout(() => setShowCelebration(null), 8000);
    return () => clearTimeout(timer);
  }, [showCelebration]);

  const renderSlide = () => {
    const slideName = slides[currentSlide];
    switch (slideName) {
      case 'leaderboard':
        return <LeaderboardSlide members={leaderboard} />;
      case 'top-performer':
        return <TopPerformerSlide member={leaderboard[0]} />;
      case 'salesdash':
        return <SalesdashSlide members={leaderboard} />;
      case 'call-stats-today':
        return <CallStatsTodaySlide members={leaderboard} />;
      case 'competition':
        return <CompetitionSlide members={leaderboard} />;
      case 'recent-wins':
        return <RecentWinsSlide celebrations={celebrations} activityWins={data?.recentActivityWins} />;
      case 'team-targets':
        return <TeamTargetsSlide stats={teamStats} members={leaderboard} />;
      case 'mvp-of-year':
        return <MVPOfYearSlide standings={ytdStandings} />;
      case 'salesdag':
        return <SalesdagSlide members={leaderboard} />;
      default:
        if (slideName?.startsWith('individual-')) {
          const index = parseInt(slideName.split('-')[1], 10);
          return <IndividualSlide member={leaderboard[index]} />;
        }
        return null;
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen bg-mvp-dark overflow-hidden flex flex-col">
      <TVHeader currentSlide={currentSlide} totalSlides={slides.length} />

      <div className="flex-1 relative min-h-0">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0 flex items-center justify-center px-[2vw] py-[2vh] overflow-hidden"
          >
            {renderSlide()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Slide indicators */}
      <div className="flex justify-center gap-[0.5vw] pb-[1vh]">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-[0.3vh] rounded-full transition-all duration-500 ${
              i === currentSlide ? 'w-[2vw] bg-mvp-accent' : 'w-[0.8vw] bg-mvp-border'
            }`}
          />
        ))}
      </div>

      {/* Celebration overlay */}
      <AnimatePresence>
        {showCelebration && (
          <CelebrationOverlay
            celebration={showCelebration}
            onDismiss={() => setShowCelebration(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
