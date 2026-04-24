import {type ScheduleTileVariant} from '@api';
import {tilePalette} from '@constants/schedule';

export function getTilePaletteByVariant(variant: ScheduleTileVariant) {
    return tilePalette[variant];
}