import type { ReactNode } from 'react';

export function Splash({ children }: { children: ReactNode }) {
  return (
    <div className="splash">
      <div className="splash-card">
        <div className="splash-logo">🏝️ 🌊 🏝️</div>
        <h1>Hy's Resort</h1>
        {children}
      </div>
    </div>
  );
}
