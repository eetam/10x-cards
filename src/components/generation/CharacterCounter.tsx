import { useMemo } from "react";

interface CharacterCounterProps {
  current: number;
  min: number;
  max: number;
}

/**
 * Character counter component that displays current character count
 * and changes color based on whether the text meets requirements
 */
export function CharacterCounter({ current, min, max }: CharacterCounterProps) {
  const isValid = useMemo(() => current >= min && current <= max, [current, min, max]);

  const colorClass = isValid ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400";

  return (
    <span className={`text-sm ${colorClass}`}>
      {current} / {min}-{max} znaków
    </span>
  );
}
