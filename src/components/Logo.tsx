import React from "react";

export function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      {/* Map Pin */}
      <path
        d="M32 58C32 58 14 41.5 14 25 C14 15 22 7 32 7 C42 7 50 15 50 25 C50 41.5 32 58 32 58Z"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Mountain */}
      <path
        d="M22 31L30 22L36 28L42 22"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Route */}
      <path
        d="M32 48 C28 43 28 39 31 35 C34 31 36 29 36 26"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
