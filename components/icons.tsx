export function BellIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M15 17H9m6 0h1.5a.5.5 0 0 0 .5-.5V16a2 2 0 0 1-.6-1.4V11a5 5 0 1 0-10 0v3.6A2 2 0 0 1 5 16v.5a.5.5 0 0 0 .5.5H9m6 0a3 3 0 1 1-6 0"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function TrophyIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <path
        d="M8 5h8v4.5A4 4 0 0 1 12 13.5 4 4 0 0 1 8 9.5V5Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <path
        d="M8 6H6.5A2.5 2.5 0 0 0 4 8.5 3.5 3.5 0 0 0 7.5 12M16 6h1.5A2.5 2.5 0 0 1 20 8.5 3.5 3.5 0 0 1 16.5 12"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
      <path
        d="M12 13.5V16M9 19h6M10 16h4v2.5a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V16Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ProfileIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden>
      <circle cx="12" cy="12" r="8.25" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="12" cy="10" r="2.4" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M7.4 17.2c.9-1.8 2.6-2.8 4.6-2.8s3.7 1 4.6 2.8"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}
