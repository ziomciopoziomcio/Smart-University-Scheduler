import {tilePalette} from '@constants/schedule';
import {BaseScheduleTile} from './BaseScheduleTile.tsx';
import {useIntl} from 'react-intl';

interface LectureTileProps {
    title: string;
    top: number;
    leftPercent: number;
    widthPercent: number;
    height: number;
}

export function LectureTile(props: LectureTileProps) {
    const palette = tilePalette.lecture;
    const {locale} = useIntl();

    const watermarkChar = locale.startsWith('pl') ? 'W' : 'L';

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