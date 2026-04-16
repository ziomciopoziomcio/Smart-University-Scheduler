import {tilePalette} from '@constants/schedule';
import {BaseScheduleTile} from './BaseScheduleTile.tsx';
import {useIntl} from 'react-intl';

interface SeminarTileProps {
    title: string;
    top: number;
    leftPercent: number;
    widthPercent: number;
    height: number;
    onClick?: () => void;
}

export function SeminarTile(props: SeminarTileProps) {
    const palette = tilePalette.seminar;
    const {locale} = useIntl();

    const watermarkChar = locale.startsWith('pl') ? 'S' : 'S';

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