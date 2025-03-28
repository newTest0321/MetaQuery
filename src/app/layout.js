'use client';

import { useState, useEffect } from 'react';

export default function RootLayout({ children }) {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  return (
    <html lang="en" className={isHydrated ? 'hydrated' : ''}>
      <body>{children}</body>
    </html>
  );
} 