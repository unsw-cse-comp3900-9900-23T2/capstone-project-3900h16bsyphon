import React, { useEffect, useState } from 'react';
import TagBox from '../TagBox';

const calculateTimeElapsed = (startDate: Date) => {
  const difference = +new Date() - +new Date(startDate);
  let timeElapsed: { [key: string]: number } = {};

  if (difference > 0) {
    timeElapsed = {
      mins: Math.floor((difference / (1000 * 60)) % 60),
    };
  }
  return timeElapsed;
};

type timerProps = {
  startTime: Date;
};

export default function Timer({ startTime }: timerProps) {
  const [timeElapsed, setTimeElapsed] = useState(calculateTimeElapsed(startTime));

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(calculateTimeElapsed(startTime));
    }, 1000);

    return () => {
      clearInterval(timer);
    };
  }, [startTime]);

  const timerComponents: React.ReactNode[] = [];

  Object.keys(timeElapsed).forEach((interval) => {
    if (!timeElapsed[interval]) {
      return;
    }

    timerComponents.push(
      <span key={interval}>
        {timeElapsed[interval]} {interval}{' '}
      </span>
    );
  });

  const changeBackgroundColour = () => {
    if (timeElapsed.mins < 10) {
      return 'var(--colour-main-green-200)';
    } else if (timeElapsed.mins < 15) {
      return 'var(--colour-main-yellow-200)';
    } else if (timeElapsed.mins < 20) {
      return 'var(--colour-main-orange-200)';
    } else {
      return 'var(--colour-main-red-200)';
    }
  };

  const changeTextColour = () => {
    if (timeElapsed.mins < 10) {
      return 'var(--colour-main-green-900)';
    } else if (timeElapsed.mins < 15) {
      return 'var(--colour-main-yellow-900)';
    } else if (timeElapsed.mins < 20) {
      return 'var(--colour-main-orange-900)';
    } else {
      return 'var(--colour-main-red-900)';
    }
  };

  return (
    <TagBox
      text={timerComponents.length ? <span>Time elapsed: {timerComponents}</span> : 'Timer not started'}
      backgroundColor={changeBackgroundColour()}
      color={changeTextColour()}
    />
  );
}
