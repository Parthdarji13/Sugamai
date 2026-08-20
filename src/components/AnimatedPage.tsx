'use client';

import React, { useEffect, useState } from 'react';

interface AnimatedPageProps {
  children: React.ReactNode;
}

export default function AnimatedPage({ children }: AnimatedPageProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
    <div
      className={`transition-all duration-700 ease-out ${
        isMounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
    >
      {children}
    </div>
  );
}
