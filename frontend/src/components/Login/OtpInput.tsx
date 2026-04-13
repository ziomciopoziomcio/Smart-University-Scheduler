import { useState, useRef } from 'react';
import { Stack, TextField } from '@mui/material';

type Props = {
    length?: number;
    value: string;
    onChange: (value: string) => void;
    disabled?: boolean;
};

function OtpInput({ length = 6, onChange, disabled = false }: Props) {
    const [otp, setOtp] = useState<string[]>(new Array(length).fill(''));

    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    const handleChange = (index: number, newValue: string) => {
        if (disabled) return;

        if (newValue && isNaN(Number(newValue))) return;

        const newOtp = [...otp];
        newOtp[index] = newValue.substring(newValue.length - 1);
        setOtp(newOtp);

        onChange(newOtp.join(''));

        if (newValue && index < length - 1 && inputRefs.current[index + 1]) {
            inputRefs.current[index + 1]?.focus();
        }
    };

    const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0 && inputRefs.current[index - 1]) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (disabled) return;

        const pasteData = e.clipboardData.getData('text').slice(0, length).split('');

        if (pasteData.some((char) => isNaN(Number(char)))) return;

        const newOtp = [...otp];
        pasteData.forEach((char, i) => {
            newOtp[i] = char;
        });

        setOtp(newOtp);
        onChange(newOtp.join(''));

        const focusIndex = Math.min(length - 1, pasteData.length - 1);
        inputRefs.current[focusIndex]?.focus();
    };

    return (
        <Stack direction="row" spacing={1} justifyContent="center" width="100%">
            {otp.map((digit, index) => (
                <TextField
                    key={index}
                    inputRef={(el) => (inputRefs.current[index] = el)}
                    value={digit}
                    onChange={(e) => handleChange(index, e.target.value)}
                    onKeyDown={(e) => handleKeyDown(index, e)}
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