import type { ReactNode } from "react";

const paths: Record<string, ReactNode> = {
  bell: (<><path d="M6 16v-5a6 6 0 0 1 12 0v5l1.5 2h-15z" /><path d="M10 20.5a2 2 0 0 0 4 0" /></>),
  gear: (<><circle cx="12" cy="12" r="3" /><path d="M12 3v2.5M12 18.5V21M3 12h2.5M18.5 12H21M5.6 5.6l1.8 1.8M16.6 16.6l1.8 1.8M18.4 5.6l-1.8 1.8M7.4 16.6l-1.8 1.8" /></>),
  cal: (<><rect x="4" y="5" width="16" height="15" rx="3" /><path d="M4 10h16M9 3v4M15 3v4" /><circle cx="8.5" cy="14.5" r="0.8" fill="currentColor" /></>),
  home: <path d="M4 11l8-7 8 7v8a2 2 0 0 1-2 2h-3v-6H9v6H6a2 2 0 0 1-2-2z" />,
  card: (<><rect x="3" y="6" width="18" height="12" rx="3" /><path d="M3 10h18M7 15h3" /></>),
  pause: (<><circle cx="12" cy="12" r="9" /><path d="M10 9v6M14 9v6" /></>),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  x: <path d="M6 6l12 12M18 6L6 18" />,
  left: <path d="M15 6l-6 6 6 6" />,
  right: <path d="M9 6l6 6-6 6" />,
  chev: <path d="M9 5l7 7-7 7" />,
  clock: (<><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>),
  trash: (<><path d="M5 7h14M10 7V5h4v2M7 7l1 12h8l1-12" /></>),
  palette: (<><path d="M12 3a9 9 0 1 0 0 18c1.6 0 2.2-1.1 1.5-2.3-.5-1 .1-2.2 1.5-2.2H17a4 4 0 0 0 4-4c0-5-4-9.5-9-9.5z" /><circle cx="7.5" cy="11.5" r="1" fill="currentColor" /><circle cx="10" cy="7.5" r="1" fill="currentColor" /><circle cx="15" cy="7.5" r="1" fill="currentColor" /></>),
};

export function Icon({ name, size = 22, stroke = 2, className }: { name: keyof typeof paths | string; size?: number; stroke?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={stroke}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={className}>
      {paths[name]}
    </svg>
  );
}

/** Renders trusted, static SVG markup from components/art.ts. */
export function Art({ html, className, style }: { html: string; className?: string; style?: React.CSSProperties }) {
  return <div className={className} style={style} aria-hidden="true" dangerouslySetInnerHTML={{ __html: html }} />;
}
