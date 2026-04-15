import {tilePalette} from '@constants/schedule';
import {BaseScheduleTile} from './BaseScheduleTile.tsx';
import {useIntl} from 'react-intl';

interface LabTileProps {
    title: string;
    top: number;
    leftPercent: number;
    widthPercent: number;
    height: number;
}

export function LabTile(props: LabTileProps) {
    const palette = tilePalette.lab;
    const {locale} = useIntl();

    const watermarkChar = locale.startsWith('pl') ? 'L' : 'L';

    return (
        <BaseScheduleTile
            {...props}
            background={palette.background}
            border={palette.border}
            watermarkColor={palette.watermark}
            watermarkText={watermarkChar}
        />
    );
}