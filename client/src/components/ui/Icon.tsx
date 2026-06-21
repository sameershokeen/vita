'use client';

import {
  Droplet, Activity, BookOpen, Wind, Zap, PiggyBank, Users, CheckCircle2,
  UtensilsCrossed, Car, ShoppingBag, HeartPulse, Tv, GraduationCap, Home,
  CircleDollarSign, Wallet, TrendingUp, Sun, Smile, Meh, CloudRain, Frown,
  type LucideProps,
} from 'lucide-react';

const ICONS: Record<string, React.ComponentType<LucideProps>> = {
  Droplet, Activity, BookOpen, Wind, Zap, PiggyBank, Users, CheckCircle2,
  UtensilsCrossed, Car, ShoppingBag, HeartPulse, Tv, GraduationCap, Home,
  CircleDollarSign, Wallet, TrendingUp, Sun, Smile, Meh, CloudRain, Frown,
};

export function Icon({ name, ...props }: { name: string } & LucideProps) {
  const Cmp = ICONS[name] ?? CheckCircle2;
  return <Cmp {...props} />;
}
