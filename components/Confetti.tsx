import React from 'react';

const Confetti: React.FC = () => {
  const confettiCount = 150;
  const colors = ['#10b981', '#8b5cf6', '#38bdf8', '#f43f5e', '#eab308'];

  return (
    <div className="confetti-container" aria-hidden="true">
      {Array.from({ length: confettiCount }).map((_, i) => (
        <div key={i} className="confetti-piece" style={{
          left: `${Math.random() * 100}%`,
          animation: `drop ${2 + Math.random() * 3}s ${Math.random() * 2}s linear infinite`,
          transform: `rotate(${Math.random() * 360}deg)`,
          backgroundColor: colors[i % colors.length],
          width: `${5 + Math.random() * 5}px`,
          height: `${10 + Math.random() * 10}px`,
        }}></div>
      ))}
    </div>
  );
};

export default Confetti;