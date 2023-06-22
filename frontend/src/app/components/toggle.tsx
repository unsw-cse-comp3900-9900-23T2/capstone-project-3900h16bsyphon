'use client'
import React, { useState } from 'react';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';

type ToggleProps = {
    label: string;
}

const Toggle = (props: ToggleProps) => {
    const [isToggleOn, setIsToggleOn] = useState(false);
    return (
        <div>
          <FormControlLabel
            control={<Switch color="primary" />}
            label={props.label}
            labelPlacement="start"
            onChange={() => setIsToggleOn(!isToggleOn)}
          />
        </div>
    )
}

export default Toggle;