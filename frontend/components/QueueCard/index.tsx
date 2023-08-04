import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import styles from './QueueCard.module.css';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import TagBox from '../TagBox';
import { CardActionArea } from '@mui/material';
import { useRouter } from 'next/router';
import { authenticatedGetFetch } from '../../utils';
import React from 'react';
import Error from '../../pages/_error';

type QueueCardProps = {
  title: string;
  queueId: number;
  seen?: number;
  unseen?: number;
  location: String[];
  courseAdmins?: String[];
  isEdit?: boolean;
  isTutor: boolean;
  isPrevious?: boolean;
  isUpcoming?: boolean;
  isQueueAnalyticsLive?: boolean;
  overrideRedirect?: (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
};

export default function QueueCard({
  title,
  seen,
  unseen,
  location,
  courseAdmins,
  isEdit,
  queueId,
  isTutor,
  isPrevious,
  isUpcoming,
  isQueueAnalyticsLive,
  overrideRedirect,
}: QueueCardProps) {
  const router = useRouter();
  const findWhereToGo = async () => {
    if (isQueueAnalyticsLive) {
      router.push(`/queue-analytics/${queueId}`);
    } else if (isTutor && isUpcoming) {
      router.push(`/edit-queue/${queueId}`);
    } else if (isTutor && !isPrevious && !isUpcoming) {
      router.push(`/active-queue/${queueId}`);
    } else if (isTutor && isPrevious) {
      router.push(`/queue-summary/${queueId}`);
    }
    // if student, we need to find if the queue is open or not
    let res = await authenticatedGetFetch('/queue/is_open', {
      queue_id: queueId.toString(),
    });
    let value = await res.json();
    if (value.is_open) {
      if (!isTutor && !isPrevious && !isUpcoming) {
        router.push(`/create-request/${queueId}`);
        return;
      }
    }
    return <Error statusCode={res.status} />;
  };

  const redirect = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    if (overrideRedirect !== undefined) {
      return overrideRedirect(e);
    }
    await findWhereToGo();
  };

  return (
    <Card className={styles.card}>
      <CardActionArea onClick={e => redirect(e)}>
        <CardContent>
          <div className={styles.chipContainer}>
            {courseAdmins?.map((c, index) => (
              <TagBox
                key={index}
                text={c.toString()}
                backgroundColor="var(--colour-main-purple-200)"
                color="var(--colour-main-purple-900)"
                bold={false}
              />
            ))}
            {location?.map((l, index) => (
              <TagBox
                key={index}
                text={l.toString()}
                backgroundColor="var(--colour-main-yellow-300)"
                color="white"
              />
            ))}
          </div>
          <Typography className={styles.heading}>{title}</Typography>
          <div className={styles.cardAction}>
            <div className={styles.chipContainer}>
              {seen && (
                <TagBox
                  text={`${seen} seen`}
                  backgroundColor="var(--colour-main-green-200)"
                  color="var(--colour-main-green-900)"
                  bold={false}
                />
              )}
              {unseen && (
                <TagBox
                  text={`${unseen} unseen`}
                  backgroundColor="var(--colour-main-red-200)"
                  color="var(--colour-main-red-900)"
                  bold={false}
                />
              )}
            </div>
            {isEdit && <Button className={styles.editBtn}>Edit</Button>}
          </div>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}
