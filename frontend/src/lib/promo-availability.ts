import { Promo, RateType } from '@/types';
import { getManilaDate } from '@/lib/manila-time';

const datePart = (value?: string) => value ? value.slice(0, 10) : '';

export function getPromoValidity(promo: Promo) {
  const today = getManilaDate();
  if (promo.maxUses != null && promo.currentUses >= promo.maxUses) return 'Expired' as const;
  if (promo.endDate && datePart(promo.endDate) < today) return 'Expired' as const;
  if (promo.startDate && datePart(promo.startDate) > today) return 'Scheduled' as const;
  return 'Available' as const;
}

export function getPromoAvailability(promo: Promo, rateType?: RateType) {
  if (!promo.isActive) return 'Inactive' as const;
  const validity = getPromoValidity(promo);
  if (validity !== 'Available') return validity;
  if (rateType && promo.appliesTo && promo.appliesTo !== rateType) return 'Unavailable' as const;
  return 'Available' as const;
}

export const isPromoAvailable = (promo: Promo, rateType?: RateType) =>
  getPromoAvailability(promo, rateType) === 'Available';
