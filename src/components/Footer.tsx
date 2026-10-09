'use client';

import React from 'react';

interface FooterProps {
  title: string;
}

export default function Footer({ title }: FooterProps) {
  return (
    <footer id="footer-anchor" className="mt-auto border-t py-5" style={{ borderColor: 'var(--border)', background: 'var(--bg-elevated)' }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-4 sm:flex-row sm:px-6">
        {/* Left side — Brand */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md"
            style={{ background: 'linear-gradient(135deg, #E8590C, #C2410C)' }}
          >
            <svg className="h-3.5 w-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
            </svg>
          </div>
          <span className="text-[11px] font-bold" style={{ color: 'var(--navy)' }}>{title}</span>
        </div>

        {/* Right — Trust badges */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-8">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--emerald)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--navy)' }}>Secure & Reliable</span>
              <span className="text-[9px] leading-tight" style={{ color: 'var(--text-muted)' }}>Data from official sources</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--navy)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--navy)' }}>Always Updated</span>
              <span className="text-[9px] leading-tight" style={{ color: 'var(--text-muted)' }}>Real-time information</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5" style={{ color: 'var(--accent)' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
            <div className="flex flex-col">
              <span className="text-[11px] font-bold leading-tight" style={{ color: 'var(--navy)' }}>Made for Citizens</span>
              <span className="text-[9px] leading-tight" style={{ color: 'var(--text-muted)' }}>Simple. Accessible. Inclusive.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Tricolor bottom bar */}
      <div className="mt-4" style={{ height: '2px', background: 'linear-gradient(90deg, #E8590C 0%, #E8590C 33%, #FFFFFF 33%, #FFFFFF 66%, #059669 66%, #059669 100%)' }} />
    </footer>
  );
}
