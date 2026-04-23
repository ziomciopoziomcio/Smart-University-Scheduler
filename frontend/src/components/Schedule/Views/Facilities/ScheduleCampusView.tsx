import {useNavigate} from 'react-router-dom';

import {TileView} from '@components/Common';
// @ts-expect-error: some internal issue with svgr types, but it works
import ApartmentIcon from '@assets/icons/buildings.svg?react';
import type {Campus} from '@api';

interface ScheduleCampusViewProps {
    data: Campus[];
}

export function ScheduleCampusView({data}: ScheduleCampusViewProps) {
    const navigate = useNavigate();

    return (
        <TileView<Campus>
            items={data}
            icon={ApartmentIcon}
            variant="flat"
            iconSize={52}
            hideAdd
            hideMenu
            getTitle={(item) => item.campus_short}
            getSubtitle={(item) => item.campus_name || undefined}
            onItemClick={(item) => navigate(`/schedules/rooms/campus/${item.id}/building`)}
        />
    );
}