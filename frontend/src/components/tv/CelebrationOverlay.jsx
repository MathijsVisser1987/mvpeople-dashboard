import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Avatar from '../Avatar';

export default function CelebrationOverlay({ celebration, onDismiss }) {
  useEffect(() => {
    const colors = ['#59D6D6', '#ffd700', '#ff6b35', '#00e676', '#ff5ecc', '#6c5ce7', celebration.recruiterColor];

    // Continuous confetti from both sides for the full duration
    const duration = 7000;
    const end = Date.now() + duration;
    let animId;
    const frame = () => {
      confetti({
        particleCount: 6,
        angle: 60,
        spread: 65,
        origin: { x: 0, y: 0.5 },
        colors,
        startVelocity: 45,
      });
      confetti({
        particleCount: 6,
        angle: 120,
        spread: 65,
        origin: { x: 1, y: 0.5 },
        colors,
        startVelocity: 45,
      });
      if (Date.now() < end) {
        animId = requestAnimationFrame(frame);
      }
    };
    frame();

    // Big center burst at start
    confetti({
      particleCount: 150,
      spread: 120,
      origin: { x: 0.5, y: 0.4 },
      colors,
      startVelocity: 45,
      gravity: 0.8,
    });

    // Firework bursts at different positions
    const bursts = [
      { delay: 800, x: 0.3, y: 0.3 },
      { delay: 1500, x: 0.7, y: 0.25 },
      { delay: 2200, x: 0.5, y: 0.5 },
      { delay: 3000, x: 0.2, y: 0.4 },
      { delay: 3800, x: 0.8, y: 0.35 },
      { delay: 4500, x: 0.5, y: 0.3 },
      { delay: 5500, x: 0.4, y: 0.45 },
      { delay: 6200, x: 0.6, y: 0.4 },
    ];

    const burstTimers = bursts.map(({ delay, x, y }) =>
      setTimeout(() => {
        confetti({
          particleCount: 80,
          spread: 360,
          origin: { x, y },
          colors,
          startVelocity: 35,
          gravity: 1,
          ticks: 200,
          scalar: 1.2,
        });
      }, delay)
    );

    // Falling stars / sparkle effect
    const sparkleTimer = setTimeout(() => {
      confetti({
        particleCount: 200,
        spread: 180,
        origin: { x: 0.5, y: 0 },
        colors,
        startVelocity: 10,
        gravity: 0.4,
        ticks: 400,
        scalar: 0.8,
        drift: 0,
      });
    }, 1000);

    // Try to play sound
    try {
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}

    return () => {
      cancelAnimationFrame(animId);
      burstTimers.forEach(clearTimeout);
      clearTimeout(sparkleTimer);
    };
  }, [celebration.recruiterColor]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.4 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-mvp-dark/95 cursor-pointer"
      onClick={onDismiss}
    >
      <div className="text-center">
        {/* Title */}
        <motion.div
          initial={{ y: -40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="text-[6vh] font-black font-display text-mvp-accent mb-[3vh]"
        >
          NEW DEAL CLOSED!
        </motion.div>

        {/* Avatar */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
          className="mx-auto mb-[3vh] glow-teal"
          style={{ width: '20vh', height: '20vh' }}
        >
          <Avatar
            member={{ name: celebration.recruiterName, avatar: celebration.recruiterAvatar, photo: celebration.recruiterPhoto, color: celebration.recruiterColor }}
            size="w-full h-full"
            textSize="text-[7vh]"
            borderWidth="4px"
          />
        </motion.div>

        {/* Name */}
        <motion.div
          initial={{ y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
        >
          <h2 className="text-[8vh] font-black font-display text-white mb-[1.5vh]">
            {celebration.recruiterName}
          </h2>
          <div className="text-[3.5vh] text-mvp-accent font-display font-semibold">
            Deal #{celebration.dealCount}
          </div>
        </motion.div>
      </div>
    </motion.div>
  );
}
