import { cn } from '@/lib/utils';
import { labels, LabelKey } from '@/lib/i18n';

interface BilingualLabelProps {
  labelKey: LabelKey;
  className?: string;
  frClassName?: string;
  showFr?: boolean;
}

/**
 * Bilingual label component - English primary, French below smaller/lighter
 * Per spec section 14: No toggle, both displayed simultaneously
 */
export function BilingualLabel({ labelKey, className, frClassName, showFr = true }: BilingualLabelProps) {
  const label = labels[labelKey];
  
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span>{label.en}</span>
      {showFr && (
        <span className={cn("text-[0.7em] text-muted-foreground/70 font-normal", frClassName)}>
          {label.fr}
        </span>
      )}
    </span>
  );
}

interface BilingualTextProps {
  en: string;
  fr: string;
  className?: string;
  frClassName?: string;
  showFr?: boolean;
}

/**
 * Bilingual text for custom strings
 */
export function BilingualText({ en, fr, className, frClassName, showFr = true }: BilingualTextProps) {
  return (
    <span className={cn("inline-flex flex-col", className)}>
      <span>{en}</span>
      {showFr && (
        <span className={cn("text-[0.7em] text-muted-foreground/70 font-normal", frClassName)}>
          {fr}
        </span>
      )}
    </span>
  );
}
