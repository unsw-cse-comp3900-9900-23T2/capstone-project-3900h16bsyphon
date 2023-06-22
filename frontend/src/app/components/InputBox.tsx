'use client'
import React, { useState } from 'react';
import { FormControl, FormControlLabel, InputLabel, TextField } from '@mui/material';

interface InputBoxProps {
    label: string;
    value: string;
    type: string;
}
const InputBox = (props: InputBoxProps) => {
    const [value, setValue] = useState(props.value);
    const handleSubmit = () => {
        console.log(value);
    }
    return (
        <div> 
            <FormControl>
                <FormControlLabel 
                    value={props.label} 
                    control=
                        {<TextField
                            value={value}
                            onChange={(e) => setValue(e.target.value)}
                            type={props.type}
                            variant="outlined"
                            margin="normal"
                        />}
                    labelPlacement='start'
                    label={props.label}
                />
            </FormControl>
        </div>
    )
}

export default InputBox;