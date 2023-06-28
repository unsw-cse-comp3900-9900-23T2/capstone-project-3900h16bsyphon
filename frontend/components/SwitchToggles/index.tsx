/* eslint-disable no-unused-vars */
import React from 'react';
import { FormGroup, FormControlLabel, Switch, TextField } from '@mui/material';
import style from './SwitchToggles.module.css';

type SwitchTogglesProps = {
    isVisible: boolean,
    setIsVisible: (isVisible: boolean) => void,
    isAvailable: boolean,
    setIsAvailable: (isAvailable: boolean) => void,
    isTimeLimit: boolean,
    setIsTimeLimit: (isTimeLimit: boolean) => void,
    timeLimit: number,
    setTimeLimit: (timeLimit: number) => void,
}

const SwitchToggles = ({isVisible, setIsVisible, isAvailable, setIsAvailable, isTimeLimit, setIsTimeLimit, timeLimit, setTimeLimit}: SwitchTogglesProps) => {
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
      <FormControlLabel
        control={<div style={{gap: '10px'}}> 
          <Switch color="primary" />
          <TextField 
            value={timeLimit}
            type="number" 
            label="Time limit (minutes)" 
            size="small"
            onChange={(e) => setTimeLimit(parseInt(e.target.value))}/> 
        </div>}
        label={'Time limit per student?'}
        labelPlacement="start"
        onChange={() => setIsTimeLimit(!isTimeLimit)}
        checked={isTimeLimit}
      />
    </FormGroup>
  );
};  

export default SwitchToggles;
