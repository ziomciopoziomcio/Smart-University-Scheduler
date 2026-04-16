import {tilePalette} from '@constants/schedule';
import {BaseScheduleTile} from './BaseScheduleTile.tsx';
import {useIntl} from 'react-intl';

interface ExerciseTileProps {
    title: string;
    top: number;
    leftPercent: number;
    widthPercent: number;
    height: number;
    onClick?: () => void;
}

export function ExerciseTile(props: ExerciseTileProps) {
    const palette = tilePalette.exercise;
    const {locale} = useIntl();

    const watermarkChar = locale.startsWith('pl') ? 'Ć' : 'E';

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