import { useEffect } from 'react';
import { motion } from 'framer-motion';
import confetti from 'canvas-confetti';
import Avatar from '../Avatar';

export default function CelebrationOverlay({ celebration, onDismiss }) {
  useEffect(() => {
    // Fire confetti from both sides
    const duration = 5000;
    const end = Date.now() + duration;
    const colors = ['#59D6D6', '#ffd700', '#ff6b35', '#00e676', celebration.recruiterColor];

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.6 },
        colors,
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.6 },
        colors,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();

    // Also fire a big burst from the center
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 100,
        origin: { x: 0.5, y: 0.5 },
        colors,
        startVelocity: 30,
      });
    }, 500);

    // Try to play sound (may be blocked by autoplay policy)
    try {
      const audio = new Audio('/sounds/celebration.mp3');
      audio.volume = 0.5;
      audio.play().catch(() => {});
    } catch {}
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
