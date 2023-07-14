import { Card, CardContent } from '@mui/material';
import styles from './InformationCard.module.css';

type InformationCardProps = {
    title?: string;
    content: string[];
};

const InformationCard = ({title, content}: InformationCardProps) => {
  return (
    <Card className={styles.card}>
      {title && <CardContent className={styles.title}>
        {title}
      </CardContent>}
      {content.map((item, index) => (
        <CardContent key={index} className={styles.content}>
          {item}
        </CardContent>
      ))}
    </Card>
  );
};

export default InformationCard;
