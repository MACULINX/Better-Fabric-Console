import React from 'react';

interface IconProps extends React.SVGProps<SVGSVGElement> {
  size?: number;
}

export const TerminalIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="4 17 10 11 4 5" />
    <line x1="12" y1="19" x2="20" y2="19" />
  </svg>
);

export const ActivityIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
  </svg>
);

export const SlidersIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="4" y1="21" x2="4" y2="14" />
    <line x1="4" y1="10" x2="4" y2="3" />
    <line x1="12" y1="21" x2="12" y2="12" />
    <line x1="12" y1="8" x2="12" y2="3" />
    <line x1="20" y1="21" x2="20" y2="16" />
    <line x1="20" y1="12" x2="20" y2="3" />
    <line x1="1" y1="14" x2="7" y2="14" />
    <line x1="9" y1="8" x2="15" y2="8" />
    <line x1="17" y1="16" x2="23" y2="16" />
  </svg>
);

export const CpuIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="4" y="4" width="16" height="16" rx="2" ry="2" />
    <rect x="9" y="9" width="6" height="6" />
    <line x1="9" y1="1" x2="9" y2="4" />
    <line x1="15" y1="1" x2="15" y2="4" />
    <line x1="9" y1="20" x2="9" y2="23" />
    <line x1="15" y1="20" x2="15" y2="23" />
    <line x1="20" y1="9" x2="23" y2="9" />
    <line x1="20" y1="15" x2="23" y2="15" />
    <line x1="1" y1="9" x2="4" y2="9" />
    <line x1="1" y1="15" x2="4" y2="15" />
  </svg>
);

export const ServerIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
    <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
    <line x1="6" y1="6" x2="6.01" y2="6" />
    <line x1="6" y1="18" x2="6.01" y2="18" />
  </svg>
);

export const PowerIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
    <line x1="12" y1="2" x2="12" y2="12" />
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <line x1="12" y1="5" x2="12" y2="19" />
    <line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);

export const TrashIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export const ShieldAlertIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
    <line x1="12" y1="8" x2="12" y2="12" />
    <line x1="12" y1="16" x2="12.01" y2="16" />
  </svg>
);

export const RefreshIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
  </svg>
);

export const PlayIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <polygon points="5 3 19 12 5 21 5 3" />
  </svg>
);

export const SaveIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

export const UsersIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

export const SunIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

export const CloudIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M19 16.9A5 5 0 0 0 18 7h-1.26a8 8 0 1 0-11.62 8.58" />
  </svg>
);

export const MessageSquareIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

export const LockIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

export const KeyIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
    <path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4" />
  </svg>
);

export const LogoIcon: React.FC<IconProps> = ({ size = 20, ...props }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width={size} height={size} {...props}>
    <defs>
      <radialGradient id="bgGlow" cx="50%" cy="50%" r="70%">
        <stop offset="0%" stop-color="#0a1428"/>
        <stop offset="100%" stop-color="#050914"/>
      </radialGradient>
      <filter id="b" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="c" x="-30%" y="-30%" width="160%" height="160%">
        <feGaussianBlur stdDeviation="2.5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <filter id="d" x="-40%" y="-40%" width="180%" height="180%">
        <feGaussianBlur stdDeviation="5" result="blur"/>
        <feMerge>
          <feMergeNode in="blur"/>
          <feMergeNode in="SourceGraphic"/>
        </feMerge>
      </filter>
      <radialGradient id="a" cx="50%" cy="40%" r="60%">
        <stop offset="0%" stop-color="#00f2fe22"/>
        <stop offset="100%" stop-color="#060913" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="512" height="512" rx="64" fill="url(#bgGlow)"/>
    <rect x="72" y="100" width="368" height="290" rx="14" fill="#0e1e36" stroke="#1e3a5f" stroke-width="2"/>
    <rect x="72" y="100" width="368" height="290" rx="14" fill="url(#a)"/>
    <rect x="72" y="100" width="368" height="290" rx="14" fill="none" stroke="#00f2fe" stroke-width="1.5" opacity=".7" filter="url(#b)"/>
    <rect x="72" y="100" width="368" height="38" rx="14" fill="#0a1628"/>
    <path fill="#0a1628" d="M72 124h368v14H72z"/>
    <circle cx="104" cy="119" r="6" fill="#00f2fe" opacity=".9" filter="url(#c)"/>
    <circle cx="124" cy="119" r="6" fill="#00f2fe" opacity=".5"/>
    <circle cx="144" cy="119" r="6" fill="#00f2fe" opacity=".3"/>
    <rect x="360" y="112" width="52" height="14" rx="7" fill="#10b981" opacity=".85" filter="url(#c)"/>
    <rect x="86" y="138" width="340" height="238" rx="4" fill="#060d1a"/>
    <rect x="102" y="158" width="180" height="5" rx="2.5" fill="#00f2fe" opacity=".8" filter="url(#c)"/>
    <rect x="288" y="158" width="80" height="5" rx="2.5" fill="#10b981" opacity=".6"/>
    <rect x="102" y="174" width="140" height="5" rx="2.5" fill="#00f2fe" opacity=".4"/>
    <rect x="248" y="174" width="60" height="5" rx="2.5" fill="#00f2fe" opacity=".2"/>
    <rect x="102" y="190" width="200" height="5" rx="2.5" fill="#00f2fe" opacity=".3"/>
    <rect x="102" y="206" width="120" height="5" rx="2.5" fill="#1e3a5f" opacity=".9"/>
    <rect x="228" y="206" width="90" height="5" rx="2.5" fill="#1e3a5f" opacity=".9"/>
    <path stroke="#1e3a5f" opacity=".6" d="M102 222h308"/>
    <g filter="url(#d)">
      <rect x="196" y="244" width="16" height="16" rx="2" fill="#10b981" opacity=".95"/>
      <rect x="216" y="244" width="16" height="16" rx="2" fill="#10b981" opacity=".7"/>
      <rect x="236" y="244" width="16" height="16" rx="2" fill="#10b981" opacity=".95"/>
      <rect x="196" y="264" width="16" height="16" rx="2" fill="#10b981" opacity=".6"/>
      <rect x="216" y="264" width="16" height="16" rx="2" fill="#00f2fe" opacity=".9"/>
      <rect x="236" y="264" width="16" height="16" rx="2" fill="#10b981" opacity=".6"/>
      <rect x="196" y="284" width="16" height="16" rx="2" fill="#10b981" opacity=".95"/>
      <rect x="216" y="284" width="16" height="16" rx="2" fill="#10b981" opacity=".7"/>
      <rect x="236" y="284" width="16" height="16" rx="2" fill="#10b981" opacity=".95"/>
    </g>
    <g filter="url(#c)" stroke="#00f2fe" stroke-width="1.5" fill="none" opacity=".7">
      <path d="M440 180h22l16-16"/>
      <circle cx="478" cy="164" r="3" fill="#00f2fe"/>
      <path d="M440 210h28"/>
      <circle cx="468" cy="210" r="3" fill="#00f2fe"/>
      <path d="M440 240h22l16 16"/>
      <circle cx="478" cy="256" r="3" fill="#00f2fe"/>
    </g>
    <g filter="url(#c)" stroke="#00f2fe" stroke-width="1.5" fill="none" opacity=".4">
      <path d="M72 185H54l-12-12"/>
      <circle cx="42" cy="173" r="3" fill="#00f2fe"/>
      <path d="M72 215H46"/>
      <circle cx="46" cy="215" r="3" fill="#00f2fe"/>
    </g>
    <rect x="86" y="352" width="340" height="24" rx="0" fill="#0a1628" opacity=".8"/>
    <circle cx="104" cy="364" r="5" fill="#10b981" filter="url(#c)"/>
    <rect x="115" y="361" width="60" height="5" rx="2.5" fill="#10b981" opacity=".5"/>
    <rect x="360" y="361" width="50" height="5" rx="2.5" fill="#00f2fe" opacity=".3"/>
    <path fill="#0a1628" d="M86 376h340v24H86z"/>
    <rect x="86" y="376" width="340" height="24" rx="0" fill="none" stroke="#1e3a5f"/>
    <rect x="102" y="382" width="2" height="12" rx="1" fill="#00f2fe" opacity=".9" filter="url(#b)"/>
    <rect x="108" y="385" width="80" height="5" rx="2.5" fill="#1e3a5f" opacity=".6"/>
  </svg>
);
