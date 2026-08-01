import type { CSSProperties } from 'react';
import { BookOpen, Coins, Scale, Shield, TrendingUp, type LucideIcon } from 'lucide-react';

const TRACK_ICONS: Record<string, LucideIcon> = {
  stocks: TrendingUp,
  general: Scale,
  bonds: Shield,
  shekel: Coins,
  halachic: BookOpen,
};

export function TrackIcon({
  trackId,
  className,
  style,
}: {
  trackId: string;
  className?: string;
  style?: CSSProperties;
}) {
  const Icon = TRACK_ICONS[trackId] ?? Scale;
  return <Icon className={className} style={style} aria-hidden="true" />;
}
