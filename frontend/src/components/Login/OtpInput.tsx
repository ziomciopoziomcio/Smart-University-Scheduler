import {useState, useRef, useEffect} from 'react';
import {Stack, TextField} from '@mui/material';

interface Props {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
}

export function OtpInput({length = 6, value, onChange, disabled = false}: Props) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (value === '') {
            setOtp(new Array(length).fill(''));
        } else if (value && value !== otp.join('')) {
            const newOtp = Array.from({length}, (_, i) => value.charAt(i) || '');
            setOtp(newOtp);
        }
    }, [value, length]);

    const handleChange = (index: number, newValue: string) => {

        if (disabled) return;
        const char = newValue.slice(-1);

        if (!/^\d*$/.test(char)) return;

        const newOtp = [...otp];
        newOtp.splice(index, 1, char);

        setOtp(newOtp);
        onChange(newOtp.join(''));

        if (char && index < length - 1) {
            inputRefs.current.at(index + 1)?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
        const currentDigit = otp.at(index);
        const prevInput = inputRefs.current.at(index - 1);

        if (e.key === 'Backspace' && !currentDigit && index > 0 && prevInput) {
            prevInput.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;

        const pasteData = e.clipboardData.getData('text').slice(0, length).split('');

        if (pasteData.some((char) => isNaN(Number(char)))) return;

        const newOtp = [...pasteData, ...otp.slice(pasteData.length)];
        setOtp(newOtp);
        onChange(newOtp.join(''));

        const focusIndex = Math.min(length - 1, pasteData.length - 1);
        inputRefs.current.at(focusIndex)?.focus();
    };

    return (
        <Stack direction="row" spacing={1} justifyContent="center" width="100%">
            {otp.map((digit, index) => (
                <TextField
                    key={index}
                    inputRef={(el) => {
                        inputRefs.current.splice(index, 1, el);
                    }}
                    value={digit}
                    onChange={(e) => {
                        handleChange(index, e.target.value);
                    }}
                    onKeyDown={(e) => {
                        handleKeyDown(index, e);
                    }}
                    onPaste={handlePaste}
                    disabled={disabled}
                    sx={{
                        width: '45px',
                        '& .MuiInputBase-input': {
                            textAlign: 'center',
                            fontSize: '1.25rem',
                            padding: '12px 0',
                        },
                    }}
                    slotProps={{
                        htmlInput: {
                            inputMode: 'numeric',
                            pattern: '[0-9]*',
                            maxLength: 2,
                        },
                    }}
                />
            ))}
        </Stack>
    );
}

export default OtpInput;