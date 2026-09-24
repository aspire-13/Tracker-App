export function HabitIcon({ emoji, color, size = 'md' }: { emoji: string; color: string; size?: 'sm' | 'md' | 'lg' }) {
  const cls = { sm: 'size-8 text-base', md: 'size-11 text-xl', lg: 'size-16 text-3xl' }[size];
  return (
    <span
      className={`${cls} grid shrink-0 place-items-center rounded-2xl`}
      style={{ backgroundColor: `${color}26` }}
      aria-hidden
    >
      {emoji}
    </span>
  );
}
