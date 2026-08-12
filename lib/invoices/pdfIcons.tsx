import { Svg, Circle, Path, Rect } from "@react-pdf/renderer";

// Small, self-contained vector icons for the PDF footer's contact line —
// no external image/font dependency, so they render identically everywhere
// @react-pdf/renderer runs.

export function WhatsAppIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={12} fill="#25D366" />
      <Path
        d="M12 5.5c-3.6 0-6.5 2.9-6.5 6.5 0 1.2.3 2.3.9 3.3l-1 3.6 3.7-1c1 .5 2 .8 3.1.8v-1.9c0 0 0 0 0 0h.2c2.9 0 5.2-2.4 5.2-5.3s-2.9-5.5-5.6-6zM9.9 8.9c.2 0 .3 0 .4.2l.6 1.5c.1.2 0 .4-.1.5l-.4.4c-.1.1-.1.3 0 .4.3.6.9 1.2 1.5 1.5.1.1.3.1.4 0l.4-.4c.1-.1.3-.2.5-.1l1.5.6c.2.1.3.4.2.6-.3.7-1.1 1.2-1.8 1.1-1.6-.2-3.4-1.9-3.6-3.6-.1-.8.4-1.5 1.1-1.8.1 0 .2 0 .3 0z"
        fill="#ffffff"
      />
    </Svg>
  );
}

export function EmailIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Rect x={1} y={4} width={22} height={16} rx={2.5} fill="#072F5F" />
      <Path d="M2.5 6 L12 13 L21.5 6" stroke="#ffffff" strokeWidth={1.6} fill="none" />
    </Svg>
  );
}

export function MapPinIcon({ size = 12 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M12 2c-4.1 0-7.5 3.4-7.5 7.5C4.5 15.5 12 22 12 22s7.5-6.5 7.5-12.5C19.5 5.4 16.1 2 12 2z"
        fill="#072F5F"
      />
      <Circle cx={12} cy={9.5} r={3} fill="#ffffff" />
    </Svg>
  );
}
