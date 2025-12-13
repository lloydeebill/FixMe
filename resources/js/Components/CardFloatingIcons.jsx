// resources/js/Components/CardFloatingIcons.jsx
import React, { useMemo } from "react";

const CardFloatingIcons = ({ icon, count = 15 }) => {
  // Generate random positions/speeds
  const particles = useMemo(() => {
    return Array.from({ length: count }).map((_, i) => ({
      id: i,
      left: Math.random() * 100 + '%',
      top: Math.random() * 100 + '%',
      size: Math.random() * 6 + 3 + 'rem', 
      duration: Math.random() * 20 + 20 + 's', 
      delay: Math.random() * -30 + 's',
      rotation: Math.random() * 360 + 'deg',
      dir: Math.random() > 0.5 ? 1 : -1,
    }));
  }, [count]);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      <style>{`
        @keyframes subtle-float {
          /* Increased opacity range (0.3 to 0.5) so icons are sharper/clearer */
          0% { transform: translateY(20px) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.5; }
          100% { transform: translateY(20px) rotate(360deg); opacity: 0.3; }
        }
      `}</style>

      {particles.map((p) => (
        <div
          key={p.id}
          
          className="absolute flex items-center justify-center text-white select-none subpixel-antialiased"
          style={{
            left: p.left,
            top: p.top,
            fontSize: p.size,
            // Base opacity set higher
            opacity: 0.4, 
            transform: `rotate(${p.rotation}) translateZ(0)`, 
            animation: `subtle-float ${p.duration} linear infinite`,
            animationDelay: p.delay,
            animationDirection: p.dir === 1 ? 'normal' : 'reverse',
            filter: 'blur(0px)',
          }}
        >
          {icon}
        </div>
      ))}
    </div>
  );
};

export default CardFloatingIcons;