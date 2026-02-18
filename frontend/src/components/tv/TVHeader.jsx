import { useState, useEffect } from 'react';

export default function TVHeader({ currentSlide, totalSlides }) {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center justify-between px-[2vw] py-[1.5vh]">
      <div className="flex items-center gap-[1vw]">
        <img src="/mvpeople-logo.png" alt="MVPeople" className="h-[5vh] w-auto" />
        <span className="text-[2.5vh] font-bold font-display gradient-text">MVPeople</span>
      </div>

      <div className="flex items-center gap-[1.5vw]">
        <div className="flex items-center gap-[0.5vw]">
          <div className="w-[1vh] h-[1vh] rounded-full bg-mvp-success animate-pulse" />
          <span className="text-[1.5vh] font-display font-semibold text-mvp-success">LIVE</span>
        </div>
        <div className="text-[3.5vh] font-mono font-bold text-white/80">
          {time.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </div>
      </div>
    </div>
  );
}
