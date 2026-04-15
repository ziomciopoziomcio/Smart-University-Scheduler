import {tilePalette} from '@constants/schedule';
import {BaseScheduleTile} from './BaseScheduleTile.tsx';
import {useIntl} from 'react-intl';

interface ProjectTileProps {
    title: string;
    top: number;
    leftPercent: number;
    widthPercent: number;
    height: number;
}

export function ProjectTile(props: ProjectTileProps) {
    const palette = tilePalette.project;
    const {locale} = useIntl();

    const watermarkChar = locale.startsWith('pl') ? 'P' : 'P';

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