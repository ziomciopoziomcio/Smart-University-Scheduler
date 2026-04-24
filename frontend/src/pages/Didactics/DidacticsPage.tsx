import {useState, useEffect} from 'react';
import {useParams} from 'react-router-dom';
import {Box, CircularProgress, Alert} from '@mui/material';
import {useIntl} from 'react-intl';

import {PageBreadcrumbs, SearchBar} from '@components/Common';
import {
    fetchFaculties,
    getFaculty,
    fetchUnits,
    getUnit,
    fetchStudyFields,
    getStudyField,
    type Faculty,
    type Unit,
    type StudyField
} from '@api';

import {
    DidacticsDashboardView,
    FieldDashboardView,
    MajorView,
    BlockView,
    DidacticsFacultyView,
    DidacticsStudyFieldView,
    DidacticsUnitView
} from '@components/Didactics';


export default function DidacticsPage({view}: { view: string }) {
    const {facultyId, fieldId, unitId} = useParams();
    const intl = useIntl();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState('');
    const [data, setData] = useState<any[]>([]);

    const [currentFaculty, setCurrentFaculty] = useState<Faculty | null>(null);
    const [currentField, setCurrentField] = useState<StudyField | null>(null);
    const [currentUnit, setCurrentUnit] = useState<Unit | null>(null);

    const loadData = async () => {
        setLoading(true);
        setError(null);
        try {
            if (facultyId && (!currentFaculty || currentFaculty.id !== Number(facultyId)))
                setCurrentFaculty(await getFaculty(Number(facultyId)));
            if (fieldId && (!currentField || currentField.id !== Number(fieldId)))
                setCurrentField(await getStudyField(Number(fieldId)));
            if (unitId && (!currentUnit || currentUnit.id !== Number(unitId)))
                setCurrentUnit(await getUnit(Number(unitId)));

            if (view === 'faculties_for_fields' || view === 'faculties_for_courses') {
                let res;
                try {
                    res = await (fetchFaculties as any)({limit: 100, offset: 0});
                } catch {
                    res = await (fetchFaculties as any)();
                }
                setData(res?.items || res?.data || (Array.isArray(res) ? res : []));
            } else if (view === 'fields') {
                const res = await fetchStudyFields(100, 0, {faculty: Number(facultyId), field_name: search});
                setData(res?.items || (Array.isArray(res) ? res : []));
            } else if (view === 'units_for_courses') {
                let res;
                try {
                    res = await (fetchUnits as any)({faculty_id: Number(facultyId), limit: 100, offset: 0});
                } catch {
                    res = await (fetchUnits as any)(100, 0, {faculty_id: Number(facultyId)});
                }
                setData(res?.items || res?.data || (Array.isArray(res) ? res : []));
            }
        } catch (err: any) {
            console.error(err);
            setError(intl.formatMessage({id: 'didactics.common.noData'}));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, [view, facultyId, fieldId, unitId, search]);

    const getBreadcrumbs = () => {
        const breadcrumbs = [{label: intl.formatMessage({id: 'didactics.breadcrumbs.main'}), path: '/didactics'}];

        if (['faculties_for_fields', 'fields', 'field_dashboard', 'majors', 'blocks'].includes(view)) {
            breadcrumbs.push({
                label: intl.formatMessage({id: 'didactics.breadcrumbs.fields'}),
                path: '/didactics/fields'
            });

            if (facultyId) {
                breadcrumbs.push({
                    label: currentFaculty?.faculty_short || currentFaculty?.faculty_name || `${intl.formatMessage({id: 'didactics.common.faculty'})} ${facultyId}`,
                    path: `/didactics/fields/faculty/${facultyId}`
                });
            }

            if (fieldId) {
                breadcrumbs.push({
                    label: currentField?.field_name || `${intl.formatMessage({id: 'didactics.breadcrumbs.fields'})} ${fieldId}`,
                    path: `/didactics/fields/faculty/${facultyId}/field/${fieldId}`
                });
            }

            if (view === 'majors') breadcrumbs.push({
                label: intl.formatMessage({id: 'didactics.breadcrumbs.majors'}),
                path: '#'
            });
            if (view === 'blocks') breadcrumbs.push({
                label: intl.formatMessage({id: 'didactics.breadcrumbs.blocks'}),
                path: '#'
            });
        }

        if (['faculties_for_courses', 'units_for_courses', 'catalog'].includes(view)) {
            breadcrumbs.push({
                label: intl.formatMessage({id: 'didactics.breadcrumbs.courses'}),
                path: '/didactics/courses'
            });

            if (facultyId) {
                breadcrumbs.push({
                    label: currentFaculty?.faculty_short || currentFaculty?.faculty_name || `${intl.formatMessage({id: 'didactics.common.faculty'})} ${facultyId}`,
                    path: `/didactics/courses/faculty/${facultyId}`
                });
            }

            if (unitId) {
                breadcrumbs.push({
                    label: currentUnit?.unit_short || currentUnit?.unit_name || `${intl.formatMessage({id: 'didactics.common.unit'})} ${unitId}`,
                    path: '#'
                });
            }
        }

        return breadcrumbs;
    };

    return (
        <Box sx={{display: 'flex', flexDirection: 'column', gap: 3, width: '100%'}}>
            {['fields', 'majors', 'blocks', 'catalog', 'units_for_courses'].includes(view) && (
                <SearchBar value={search} onChange={setSearch}
                           placeholder={intl.formatMessage({id: 'didactics.common.search'})}/>
            )}

            <PageBreadcrumbs items={getBreadcrumbs()}/>

            <Box sx={{flexGrow: 1}}>
                {loading ? (
                    <Box sx={{display: 'flex', justifyContent: 'center', py: 8}}><CircularProgress/></Box>
                ) : (
                    <Box sx={{
                        width: '100%',
                        display: 'flex',
                        flexDirection: 'column',
                        background: '#ffffff',
                        boxShadow: '0 2px 12px rgba(0, 0, 0, 0.06)',
                        borderRadius: 2,
                        overflow: 'hidden',
                        p: {xs: 1, md: 2}
                    }}>
                        {error && <Alert severity="error" sx={{mb: 3}}>{error}</Alert>}

                        {view === 'dashboard' && <DidacticsDashboardView/>}
                        {view === 'faculties_for_fields' &&
                            <DidacticsFacultyView data={data} basePath="/didactics/fields/faculty"/>}
                        {view === 'fields' && <DidacticsStudyFieldView data={data} facultyId={Number(facultyId)}
                                                                       onRefresh={() => void loadData()}/>}

                        {view === 'field_dashboard' && <FieldDashboardView/>}
                        {view === 'majors' && <MajorView fieldId={Number(fieldId)}/>}
                        {view === 'blocks' && <BlockView fieldId={Number(fieldId)}/>}

                        {view === 'faculties_for_courses' &&
                            <DidacticsFacultyView data={data} basePath="/didactics/courses/faculty"/>}
                        {view === 'units_for_courses' && <DidacticsUnitView data={data} facultyId={Number(facultyId)}/>}
                    </Box>
                )}
            </Box>
        </Box>
    );
}