import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    CircularProgress
} from '@mui/material';
import {theme} from "../../theme/theme.ts";

interface DeleteConfirmDialogProps {
    open: boolean;
    loading?: boolean;
    title: string;
    description: string;
    cancelButtonLabel: string,
    confirmButtonLabel: string,
    onClose: () => void;
    onConfirm: () => void;
}

export default function DeleteConfirmDialog({
                                                open,
                                                loading,
                                                title,
                                                description,
                                                cancelButtonLabel,
                                                confirmButtonLabel,
                                                onClose,
                                                onConfirm
                                            }: DeleteConfirmDialogProps) {

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
                    {cancelButtonLabel}
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
                        confirmButtonLabel
                    )}
                </Button>
            </DialogActions>
        </Dialog>
    );
}