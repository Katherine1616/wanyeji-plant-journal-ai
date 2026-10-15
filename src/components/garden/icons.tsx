import type { SVGProps } from "react";

/**
 * Hand-drawn thin-line icon set for the balcony journal. All icons share a
 * 24px box, 1.5px strokes and round caps so they sit beside the botanical
 * illustrations without breaking the series.
 */
type IconProps = SVGProps<SVGSVGElement>;

function Base({ children, ...props }: IconProps & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    >
      {children}
    </svg>
  );
}

export function LeafIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 20C3 13 5 5 20 3c1 13-6 17-12 13" />
      <path d="M5 21 16 9" />
    </Base>
  );
}

export function DropIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3S5.5 10.5 5.5 15a6.5 6.5 0 0 0 13 0C18.5 10.5 12 3 12 3Z" />
      <path d="M9 14c-1 2 .4 4 2 4" />
    </Base>
  );
}

export function CalendarIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="4" y="5" width="16" height="16" rx="2" />
      <path d="M8 3v4m8-4v4M4 10h16" />
    </Base>
  );
}

export function BookIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 4h14v17H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" />
      <path d="M5 21V4m4 5h6m-6 4h4" />
    </Base>
  );
}

export function FamilyIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="9" cy="8" r="3" />
      <path d="M3 20v-2a6 6 0 0 1 12 0v2" />
      <path d="M16 5a3 3 0 0 1 0 6m2 3c3 0 4 3 4 6" />
    </Base>
  );
}

export function PlusIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 5v14M5 12h14" />
    </Base>
  );
}

export function CloseIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m6 6 12 12M6 18 18 6" />
    </Base>
  );
}

export function CheckIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m5 13 4.5 4.5L19 7" />
    </Base>
  );
}

export function SunIcon({ level = 0, ...props }: IconProps & { level?: 0 | 1 | 2 }) {
  return (
    <Base {...props}>
      <circle cx="12" cy="12" r={4 + level} />
      <path d="M12 2v2m0 16v2M2 12h2m16 0h2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M19.1 4.9l-1.4 1.4M6.3 17.7l-1.4 1.4" />
      {level >= 2 ? <path d="M8.5 12a3.5 3.5 0 0 1 7 0" /> : null}
    </Base>
  );
}

export function ThermometerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M14 14.8V5a2 2 0 1 0-4 0v9.8a4 4 0 1 0 4 0Z" />
      <path d="M12 9v6" />
    </Base>
  );
}

export function PotIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 9h16l-1.6 10a2 2 0 0 1-2 1.7H7.6a2 2 0 0 1-2-1.7Z" />
      <path d="M3 5h18v4H3zm7-2h4" />
    </Base>
  );
}

export function ScissorsIcon(props: IconProps) {
  return (
    <Base {...props}>
      <circle cx="6" cy="18" r="2.6" />
      <circle cx="6" cy="6" r="2.6" />
      <path d="M8.3 7.6 20 18m-11.7-1.6L20 6" />
    </Base>
  );
}

export function FertilizerIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M8 8h8l1.4 11a1.8 1.8 0 0 1-1.8 2H8.4a1.8 1.8 0 0 1-1.8-2Z" />
      <path d="M9 8V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V8M12 12v5m-2.5-2.5h5" />
    </Base>
  );
}

export function NoteIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M5 4h9l5 5v11H5z" />
      <path d="M14 4v5h5M8.5 13h7m-7 4h4" />
    </Base>
  );
}

export function WateringCanIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 11h10v7a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Z" />
      <path d="M4 11 2.5 6.5M14 11l6-4v6l-3 1.5M7 11V8h4v3" />
    </Base>
  );
}

export function ChevronLeftIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="m14 6-6 6 6 6" />
    </Base>
  );
}

export function CameraIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M4 8h3l1.5-2h7L17 8h3v11H4z" />
      <circle cx="12" cy="13" r="3.2" />
    </Base>
  );
}

export function ImageIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m5 17 4.5-5 3.5 3.5L16 12l3 3.5" />
      <circle cx="8.5" cy="9.5" r="1.2" />
    </Base>
  );
}

export function ImagePlaceholderIcon(props: IconProps) {
  return (
    <Base {...props}>
      <rect x="3.5" y="4.5" width="17" height="15" rx="2.5" strokeDasharray="3 2.5" />
      <path d="M12 14.5c2.6 0 4.3-1.6 4.3-4.2-2.7 0-4.5 1.3-4.3 3.4" />
      <path d="M12 14.5c-2.6 0-4.3-1.6-4.3-4.2 2.7 0 4.5 1.3 4.3 3.4" />
      <path d="M12 14.5v-2.4" />
    </Base>
  );
}

export function SparkIcon(props: IconProps) {
  return (
    <Base {...props}>
      <path d="M12 3.5 13.6 9 19 10.6 13.6 12.2 12 17.7 10.4 12.2 5 10.6 10.4 9Z" />
      <path d="M18 16.5l.7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7Z" />
    </Base>
  );
}
