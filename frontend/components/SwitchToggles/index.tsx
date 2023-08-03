import React from 'react';
import { FormGroup, FormControlLabel, Switch, TextField } from '@mui/material';
import style from './SwitchToggles.module.css';

type SwitchTogglesProps = {
    isVisible: boolean,
    setIsVisible: React.Dispatch<React.SetStateAction<boolean>>,
    isAvailable: boolean,
    setIsAvailable: React.Dispatch<React.SetStateAction<boolean>>,
    timeLimit: number,
    setTimeLimit: React.Dispatch<React.SetStateAction<number>>,
}

const SwitchToggles = ({isVisible, setIsVisible, isAvailable, setIsAvailable, timeLimit, setTimeLimit}: SwitchTogglesProps) => {
  return (
    <FormGroup className={style.switchToggles}>
      <FormControlLabel 
        control={<Switch color="primary" />}
        label={'Is this queue visible now?'}
        labelPlacement="start"
        onChange={() => setIsVisible(!isVisible)}
        checked={isVisible}
      />
      <FormControlLabel
        control={<Switch color="primary" />}
        label={'Is this queue available now?'}
        labelPlacement="start"
        onChange={() => setIsAvailable(!isAvailable)}
        checked={isAvailable}
      />
      <TextField 
        value={timeLimit}
        type="number" 
        label="Time limit (minutes)" 
        size="small"
        onChange={(e) => {
          setTimeLimit(Number.parseInt(e.target.value));
        }}
      /> 
    </FormGroup>
  );
};  

export default SwitchToggles;
