import { useState, useEffect } from 'react';

export default function TVHeader({ currentSlide, totalSlides }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-10 py-5">
      <div className="flex items-center gap-4">
        <img src="/mvpeople-logo.png" alt="MVPeople" className="h-10 w-auto" />
        <span className="text-2xl font-bold font-display gradient-text">MVPeople</span>
      </div>

      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-mvp-success animate-pulse" />
          <span className="text-sm font-display font-semibold text-mvp-success">LIVE</span>
        </div>
        <div className="text-3xl font-mono font-bold text-white/80">
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
