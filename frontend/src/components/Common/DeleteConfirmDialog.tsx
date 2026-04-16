import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress
} from '@mui/material';
import {useIntl} from 'react-intl';
import {theme} from "../../theme/theme.ts";

interface DeleteConfirmDialogProps {
    open: boolean;
    loading?: boolean;
    title: string;
    description: string;
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteConfirmDialog({
                                                open,
                                                loading,
                                                title,
                                                description,
                                                onClose,
                                                onConfirm
                                            }: DeleteConfirmDialogProps) {
    const intl = useIntl();

    return (
        <Dialog
            open={open}
            onClose={loading ? undefined : onClose}
            PaperProps={{
                sx: {
                    borderRadius: '16px',
                    p: 1,
                    minWidth: '350px'
                }
            }}
        >
            <DialogTitle fontWeight="bold">
                <DialogContent sx={{p: 0, textAlign: 'center', fontSize: '1.25rem', color: "#000"}}>
                    {title}
                </DialogContent>
            </DialogTitle>
            <DialogContent>
                <Typography sx={{p: 0, textAlign: 'center', fontSize: theme.fontSizes.medium, color: "text.secondary"}}>
                    {description}
                </Typography>
            </DialogContent>
            <DialogActions sx={{p: 2, pt: 0}}>
                <Button
                    onClick={onClose}
                    disabled={loading}
                    sx={{
                        color: 'text.secondary',
                        textTransform: 'none',
                        fontWeight: 600
                    }}
                >
                    {intl.formatMessage({id: 'facilities.deleteConfirm.cancel'})}
                </Button>
                <Button
                    onClick={onConfirm}
                    disabled={loading}
                    variant="contained"
                    color="error"
                    sx={{
                        borderRadius: '8px',
                        textTransform: 'none',
                        fontWeight: 600,
                        boxShadow: 'none',
                        minWidth: '80px'
                    }}
                >
                    {loading ? (
                        <CircularProgress size={20} color="inherit"/>
                    ) : (
                        intl.formatMessage({id: 'facilities.deleteConfirm.confirm'})
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}