import {useState, useEffect} from 'react';
import {
    Dialog, DialogContent, DialogTitle, DialogActions, Box,
    Button, TextField, CircularProgress, FormControl, InputLabel, Select, MenuItem, Typography
} from '@mui/material';
import {useIntl} from 'react-intl';
import {
    createGroup,
    updateGroup,
    fetchMajors,
    fetchElectiveBlocks,
    type Group,
    type Major,
    type ElectiveBlock
} from '@api';

interface ProgramGroupModalProps {
    open: boolean;
    group: Group | null;
    programId: number;
    semesterId: number;
    fieldId: number;
    onClose: () => void;
    onSuccess: () => void;
}

export function ProgramGroupModal({
                                      open,
                                      group,
                                      programId,
                                      semesterId,
                                      fieldId,
                                      onClose,
                                      onSuccess
                                  }: ProgramGroupModalProps) {
    const intl = useIntl();
    const isEditMode = Boolean(group);

    const [groupName, setGroupName] = useState('');
    const [majorId, setMajorId] = useState<number | ''>('');
    const [blockId, setBlockId] = useState<number | ''>('');

    const [majors, setMajors] = useState<Major[]>([]);
    const [blocks, setBlocks] = useState<ElectiveBlock[]>([]);

    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (open && fieldId) {
            fetchMajors(1, 100, undefined,
                {
                    study_field: fieldId
                }
            )
                .then(res => {
                    setMajors(res.items || []);
                }).catch(console.error);

            fetchElectiveBlocks(1, 100, undefined, {study_field: fieldId})
                .then(res => {
                    setBlocks(res.items || []);
                })
                .catch(console.error);
        }
    }, [open, fieldId]);

    useEffect(() => {
        if (open) {
            if (group) {
                setGroupName(group.group_name);
                setMajorId(group.major || '');
                setBlockId(group.elective_block || '');
            } else {
                setGroupName('');
                setMajorId('');
                setBlockId('');
            }
        }
    }, [open, group]);

    const handleSubmit = async () => {
        if (!groupName) return;
        setIsSubmitting(true);
        try {
            const payload = {
                group_name: groupName,
                study_program: programId,
                semester: semesterId,
                major: majorId !== '' ? Number(majorId) : null,
                elective_block: blockId !== '' ? Number(blockId) : null
            };

            if (isEditMode && group) {
                await updateGroup(group.id, payload);
            } else {
                await createGroup(payload);
            }
            onSuccess();
            onClose();
        } catch (err) {
            console.error(err);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onClose={isSubmitting ? undefined : onClose} maxWidth="sm" fullWidth
                PaperProps={{sx: {borderRadius: '16px'}}}>
            <DialogTitle fontWeight={700}>
                {isEditMode ? intl.formatMessage({id: 'programs.groups.edit'}) : intl.formatMessage({id: 'programs.groups.add'})}
            </DialogTitle>

            <DialogContent sx={{display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1}}>
                <TextField
                    label={intl.formatMessage({id: 'programs.groups.modal.nameLabel'})}
                    placeholder={intl.formatMessage({id: 'programs.groups.modal.namePlaceholder'})}
                    value={groupName}
                    onChange={(e) => {
                        setGroupName(e.target.value);
                    }}
                    fullWidth
                    disabled={isSubmitting}
                    autoFocus
                    required
                />

                <Box sx={{display: 'flex', gap: 2}}>
                    <FormControl fullWidth disabled={isSubmitting || blockId !== ''}>
                        <InputLabel
                            id="major-label">{intl.formatMessage({id: 'programs.groups.modal.majorLabel'})}</InputLabel>
                        <Select
                            labelId="major-label"
                            value={majorId}
                            label={intl.formatMessage({id: 'programs.groups.modal.majorLabel'})}
                            onChange={(e) => {
                                setMajorId(e.target.value as number | '');
                            }}
                        >
                            <MenuItem
                                value=""><em>{intl.formatMessage({id: 'programs.groups.modal.none'})}</em></MenuItem>
                            {majors.map(m => <MenuItem key={m.id} value={m.id}>{m.major_name}</MenuItem>)}
                        </Select>
                    </FormControl>

                    <FormControl fullWidth disabled={isSubmitting || majorId !== ''}>
                        <InputLabel
                            id="block-label">{intl.formatMessage({id: 'programs.groups.modal.blockLabel'})}</InputLabel>
                        <Select
                            labelId="block-label"
                            value={blockId}
                            label={intl.formatMessage({id: 'programs.groups.modal.blockLabel'})}
                            onChange={(e) => {
                                setBlockId(e.target.value as number | '');
                            }}
                        >
                            <MenuItem
                                value=""><em>{intl.formatMessage({id: 'programs.groups.modal.none'})}</em></MenuItem>
                            {blocks.map(b => <MenuItem key={b.id} value={b.id}>{b.elective_block_name}</MenuItem>)}
                        </Select>
                    </FormControl>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{mt: -1}}>
                    {intl.formatMessage({id: 'programs.groups.modal.exclusivityHint'})}
                </Typography>
            </DialogContent>

            <DialogActions sx={{p: 3}}>
                <Button onClick={onClose} disabled={isSubmitting} sx={{fontWeight: 600, color: 'text.secondary'}}>
                    {intl.formatMessage({id: 'common.cancel'})}
                </Button>
                <Button onClick={handleSubmit} variant="contained" disabled={isSubmitting || !groupName}
                        sx={{borderRadius: '10px', px: 4, fontWeight: 600}}>
                    {isSubmitting ?
                        <CircularProgress size={24} color="inherit"/> : intl.formatMessage({id: 'common.save'})}
                </Button>
            </DialogActions>
        </Dialog>
    );
}