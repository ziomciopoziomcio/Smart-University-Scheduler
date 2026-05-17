import {useState} from "react";
import {Box, Typography} from '@mui/material';
import {useIntl} from 'react-intl';
import BookIcon from '@mui/icons-material/Book';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import ClassOutlinedIcon from '@mui/icons-material/ClassOutlined';
import ExtensionOutlinedIcon from '@mui/icons-material/ExtensionOutlined';
import {ListView} from '@components/Common';
import {type CurriculumCourse} from '@api';
import {CurriculumModal} from '../Modals/CurriculumModal';

interface ProgramCurriculumViewProps {
    data: CurriculumCourse[];
    programId: number;
    semesterId: number;
    fieldId: number;
    fieldName: string;
    onRefresh: () => void;
}

export function ProgramCurriculumView({data, programId, semesterId, fieldId, fieldName, onRefresh}: ProgramCurriculumViewProps) {
    const intl = useIntl();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const mappedData = data.map((item, idx) => ({
        ...item,
        // Ensure unique ID even if some fields are missing
        id: `${item.study_program || programId}-${item.course || idx}-${item.semester || semesterId}`
    }));

    return (
        <Box>
            <ListView<CurriculumCourse & { id: string }>
                items={mappedData}
                icon={BookIcon}
                getTitle={(item) => item.course_details?.course_name || intl.formatMessage({id: 'didactics.programs.curriculum.courseIdFallback'}, {id: item.course})}
                titleWidth="400px"
                columns={[
                    {
                        render: (item) => (
                            <Typography variant="body2" fontWeight={600}>
                                {item.course_details?.ects_points ?? 0} ECTS
                            </Typography>
                        ),
                        width: '100px'
                    },
                    {
                        render: (item) => {
                            if (item.major) {
                                return (
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <ClassOutlinedIcon sx={{fontSize: 18, color: 'primary.main', opacity: 0.8}}/>
                                        <Typography variant="body2">
                                            {item.major_details?.major_name || intl.formatMessage({id: 'didactics.programs.curriculum.majorIdFallback'}, {id: item.major})}
                                        </Typography>
                                    </Box>
                                );
                            }
                            if (item.elective_block) {
                                return (
                                    <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                        <ExtensionOutlinedIcon sx={{fontSize: 18, color: 'secondary.main', opacity: 0.8}}/>
                                        <Typography variant="body2">
                                            {item.elective_block_details?.elective_block_name || intl.formatMessage({id: 'didactics.programs.curriculum.blockIdFallback'}, {id: item.elective_block})}
                                        </Typography>
                                    </Box>
                                );
                            }
                            return (
                                <Box sx={{display: 'flex', alignItems: 'center', gap: 1}}>
                                    <AutoStoriesIcon sx={{fontSize: 18, color: 'text.secondary', opacity: 0.6}}/>
                                    <Typography variant="body2" color="text.secondary">
                                        {fieldName || intl.formatMessage({id: 'didactics.programs.groups.chip.general'})}
                                    </Typography>
                                </Box>
                            );
                        },
                        width: '350px'
                    }
                ]}
                onAddClick={() => {
                    setIsModalOpen(true);
                }}
                addLabel={intl.formatMessage({id: 'didactics.programs.addCourse'})}
                emptyMessage={intl.formatMessage({id: 'didactics.programs.noData'})}
                hideDividerOnLastItem
            />

            <CurriculumModal
                open={isModalOpen}
                programId={programId}
                semesterId={semesterId}
                fieldId={fieldId}
                onClose={() => {
                    setIsModalOpen(false);
                }} onSuccess={onRefresh}
            />
        </Box>
    );
}