import { useState } from 'react';

export default function Avatar({ member, size = 'w-12 h-12', textSize = 'text-lg', borderWidth = '2px' }) {
  const [imgError, setImgError] = useState(false);

  if (member.photo && !imgError) {
    return (
      <img
        src={member.photo}
        alt={member.name}
        onError={() => setImgError(true)}
        className={`${size} rounded-full object-cover shrink-0`}
        style={{ border: `${borderWidth} solid ${member.color}40` }}
      />
    );
  }

  return (
    <div
      className={`${size} rounded-full flex items-center justify-center font-bold ${textSize} shrink-0 font-display`}
      style={{ backgroundColor: member.color + '20', color: member.color, border: `${borderWidth} solid ${member.color}40` }}
    >
      {member.avatar}
    </div>
  );
}
