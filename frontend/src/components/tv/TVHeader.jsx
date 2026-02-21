import { useState, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';

export default function TVHeader({ currentSlide, totalSlides, apiStatus }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const vincereDown = apiStatus && apiStatus.vincere === false;

  return (
    <div className="flex items-center justify-between px-[2vw] py-[1.5vh]">
      <div className="flex items-center gap-[1vw]">
        <img src="/mvpeople-logo.png" alt="MVPeople" className="h-[5vh] w-auto" />
        <span className="text-[2.5vh] font-bold font-display gradient-text">MVPeople</span>
      </div>

      <div className="flex items-center gap-[1.5vw]">
        {vincereDown && (
          <div className="flex items-center gap-[0.4vw] bg-red-500/15 border border-red-500/30 rounded-full px-[0.8vw] py-[0.4vh]">
            <AlertTriangle className="text-red-400" style={{ width: '1.8vh', height: '1.8vh' }} />
            <span className="text-[1.3vh] font-display font-semibold text-red-400">Vincere disconnected</span>
          </div>
        )}
        <div className="flex items-center gap-[0.5vw]">
          <div className={`w-[1vh] h-[1vh] rounded-full animate-pulse ${vincereDown ? 'bg-amber-400' : 'bg-mvp-success'}`} />
          <span className={`text-[1.5vh] font-display font-semibold ${vincereDown ? 'text-amber-400' : 'text-mvp-success'}`}>LIVE</span>
        </div>
        <div className="text-[3.5vh] font-mono font-bold text-white/80">
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
