import { Sparkle } from 'lucide-react';

/**
 * Petit badge "Powered by Macerti" flottant en bas à droite.
 *
 * Reprend le langage visuel neo-brutaliste déjà utilisé partout ailleurs
 * dans l'app (border-2 border-border, shadow-xs, coins vifs — voir
 * AuditorPanel.tsx / ProcessPanel.tsx pour le même pattern) plutôt que de
 * reproduire le style visuel propre à Lovable — c'est votre outil, sous
 * votre marque, donc il porte le design system de l'app elle-même.
 *
 * z-40 (sous les dialogs qui sont en z-50) : une fenêtre modale ouverte
 * recouvre correctement le badge au lieu de flotter par-dessus.
 */
export function MacertiWatermark() {
  return (
    <a
      href="https://macerti.com"
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 border-2 border-border bg-card px-3 py-1.5 shadow-xs text-[10px] sm:text-xs font-bold uppercase tracking-wide text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
      aria-label="Powered by Macerti — ouvre macerti.com dans un nouvel onglet"
    >
      <Sparkle className="w-3 h-3 shrink-0" />
      <span className="whitespace-nowrap">Powered by Macerti</span>
    </a>
  );
}
