import styles from './DurationBox.module.css';
import { Duration } from '../../types/requests';
import TagBox from '../TagBox';
import { changeBackgroundColour, changeTextColour } from '../../utils';

type DurationBoxProps = {
  duration?: Duration,
  backgroundColor?: string,
  color?: string,
  text?: string,
};

const DurationBox = ({ duration, backgroundColor, color, text }: DurationBoxProps) => {
  const getDurationString = () => {
    return (
      'Duration: ' +
      duration?.hours.toString() +
      ' hours ' +
      duration?.minutes.toString() +
      ' mins ' +
      duration?.seconds.toString() +
      ' seconds'
    );
  };

  return (
    <>
      <TagBox
        text={text ? text : getDurationString()}
        backgroundColor={backgroundColor ? backgroundColor : changeBackgroundColour(duration)}
        color={color ? color : changeTextColour(duration)}
      />
    </>
  );
};

export default DurationBox;
