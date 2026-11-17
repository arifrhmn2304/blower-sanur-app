type Props = {
  size?: number;
  className?: string;
};

export default function BrandMark({ size = 26, className }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={className}
      aria-hidden="true"
    >
      <circle
        cx="24"
        cy="24"
        r="18.6"
        stroke="currentColor"
        strokeOpacity="0.32"
        strokeWidth="1.1"
        strokeDasharray="2 4"
      />
      {Array.from({ length: 8 }).map((_, i) => (
        <path
          key={i}
          d="M23.6 20.6c1.4-4.6 4.8-8 8.8-9.2 1.7 3.4.3 7.8-3.2 10.7-1.6 1.3-3.5 2.1-5.6 2.4z"
          fill="currentColor"
          opacity={i % 2 === 0 ? 0.95 : 0.55}
          transform={`rotate(${i * 45} 24 24)`}
        />
      ))}
      <circle cx="24" cy="24" r="4.4" fill="currentColor" />
      <circle cx="24" cy="24" r="1.6" fill="#05080b" />
    </svg>
  );
}
