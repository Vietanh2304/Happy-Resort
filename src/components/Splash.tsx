import type { ReactNode } from 'react';

export function Splash({ children }: { children: ReactNode }) {
  return (
    <div className="splash">
      <div className="splash-card">
        <div className="splash-logo">🏝️ 🌊 🏝️</div>
        <h1>Resort hai bờ</h1>
        {children}
      </div>
    </div>
  );
}
