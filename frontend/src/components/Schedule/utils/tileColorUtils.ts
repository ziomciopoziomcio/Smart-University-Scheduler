import type { ScheduleTileVariant } from '@api/types';
import { tilePalette } from '@constants/schedule';

export function getTilePaletteByVariant(variant: ScheduleTileVariant) {
  return tilePalette[variant];
}