'use client';

import React from 'react';

interface FooterProps {
  title: string;
}

export default function Footer({ title }: FooterProps) {
  return (
    <footer id="footer-anchor" className="mt-auto border-t" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-5 sm:flex-row sm:px-6">
        <div className="flex items-center gap-4">
          <span className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{title}</span>
          <span className="text-[11px] font-medium text-[var(--text-muted)]">
            © 2026 Digital Government Services. Verified Official Source.
          </span>
        </div>
        <div className="flex items-center gap-5 text-[11px] font-medium text-[var(--text-secondary)]">
          <span>Official Portal Assistance</span>
          <span>Verified Government Scheme AI</span>
        </div>
      </div>
    </footer>
  );
}
