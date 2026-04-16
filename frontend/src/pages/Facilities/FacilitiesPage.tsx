import {useState, useEffect, useCallback} from 'react';
import {useParams} from 'react-router-dom';
import {Box, Paper, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import PageBreadcrumbs, {type BreadcrumbItem} from '@components/Common/BreadCrumb.tsx';
import SearchBar from "@components/Common/SearchBar.tsx";
import {fetchCampuses, fetchBuildings, fetchRooms, getBuilding, getCampus} from '@api/facilities.ts';
import CreateCampusModal from "@components/Facilities/CreateCampusModal.tsx";
import {type Campus, type Building, type Room} from '@api/types';
import CampusView from '@components/Facilities/CampusView';
import BuildingView from '@components/Facilities/BuildingView';
import RoomView from '@components/Facilities/RoomView';

interface FacilitiesPageProps {
    view: 'campuses' | 'buildings' | 'rooms';
}

// TODO: add real search functionality, currently it's just a dummy input to show the UI
// TODO: errors (as snackbar?) and empty states in views
// TODO: add loading statuses, so tile gets a bit transpaent when waiting for response, and add circular progress in the middle of tile when loading first time?

export default function FacilitiesPage({view}: FacilitiesPageProps) {
    const {campusId, buildingId} = useParams();
    const intl = useIntl();

    const [data, setData] = useState<(Campus | Building | Room)[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [dummySearch, setDummySearch] = useState('');
    const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
    const [currentCampus, setCurrentCampus] = useState<Campus | null>(null);
    const [currentBuilding, setCurrentBuilding] = useState<Building | null>(null);

    const getBreadcrumbs = () => {
        const items: BreadcrumbItem[] = [{
            label: intl.formatMessage({id: 'facilities.breadcrumbs.facilities'}),
            path: '/facilities'
        }];

        // Widok Budynków lub Sal
        if (campusId) {
            items.push({
                label: currentCampus ? `${intl.formatMessage({id: 'facilities.breadcrumbs.campus'})} ${currentCampus.campus_short}` : `Kampus ${campusId}`,
                path: `/facilities/campus/${campusId}` // campusId pobrane bezpośrednio z URL!
            });
        }

        // Widok Sal
        if (buildingId) {
            items.push({
                label: currentBuilding ? `${intl.formatMessage({id: 'facilities.breadcrumbs.building'})} ${currentBuilding.building_number}` : `Budynek ${buildingId}`
            });
        }
        return items;
    };

    const loadData = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            if (view === 'campuses') {
                const res = await fetchCampuses();
                setData(res.items);
                setCurrentCampus(null);
                setCurrentBuilding(null);

            } else if (view === 'buildings' && campusId) {
                const [buildingsRes, campusData] = await Promise.all([
                    fetchBuildings(Number(campusId)),
                    getCampus(Number(campusId))
                ]);
                setData(buildingsRes.items);
                setCurrentCampus(campusData);
                setCurrentBuilding(null);

            } else if (view === 'rooms' && buildingId && campusId) {
                const [roomsRes, campusData, buildingData] = await Promise.all([
                    fetchRooms(Number(buildingId)),
                    getCampus(Number(campusId)),
                    getBuilding(Number(buildingId))
                ]);
                setData(roomsRes.items);
                setCurrentCampus(campusData);
                setCurrentBuilding(buildingData);
            }

        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [view, campusId, buildingId]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 2, width: '100%'}}>
            <SearchBar
                placeholder={intl.formatMessage({id: 'facilities.searchPlaceholder'})}
                value={dummySearch}
                onChange={setDummySearch}
            />

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Paper elevation={0} sx={{p: 3, border: '1px solid rgba(0,0,0,0.05)', flexGrow: 1, mb: 3}}>

                {loading && <Box sx={{display: 'flex', justifyContent: 'center', py: 4}}><CircularProgress/></Box>}
                {error && <Alert severity="error">{error}</Alert>}
                {!loading && !error && (
                    <>
                        {view === 'campuses' &&
                            <CampusView
                                data={data}
                                onAddClick={() => setIsCampusModalOpen(true)}
                                onRefresh={() => loadData()}
                            />}
                        {view === 'buildings' && (
                            <BuildingView
                                data={data as Building[]}
                                campusId={Number(campusId)}
                                onRefresh={() => loadData()}
                            />
                        )}
                        {view === 'rooms' && <RoomView data={data}/>}
                    </>
                )}
            </Paper>

            <CreateCampusModal
                open={isCampusModalOpen}
                onClose={() => setIsCampusModalOpen(false)}
                onSuccess={() => loadData()}
            />
        </Box>
    );
}