import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  IconButton,
  Typography,
} from '@mui/material';
import styles from './StudentQueueRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';
import { useState } from 'react';
import {
  authenticatedPutFetch,
  formatZid,
  determineBackgroundColour,
} from '../../utils';
import { Status, Tag } from '../../types/requests';
import { ArrowDownward, ArrowUpward } from '@mui/icons-material';

type StudentQueueRequestCardProps = {
  zid: number;
  firstName: string;
  lastName: string;
  title: string;
  tags: Tag[];
  requestId: number;
  status: Status;
  previousRequests: number;
};

const StudentQueueRequestCard = ({
  zid,
  firstName,
  lastName,
  title,
  tags,
  requestId,
  status,
  previousRequests,
}: StudentQueueRequestCardProps) => {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState(
    determineBackgroundColour(status)
  );

  const updateStatus = async (status: Status) => {
    const res = await authenticatedPutFetch('/request/set_status', {
      request_id: requestId,
      status: status,
    });

    if (!res.ok) {
      console.log(
        'error: something went wrong with resolve request; check network tab'
      );
      return;
    }

    // set background colour and redirect
    if (status === Status.NotFound) {
      setBackgroundColor(determineBackgroundColour(Status.NotFound));
    } else if (status === Status.Seen) {
      setBackgroundColor(determineBackgroundColour(Status.Seen));
    } else if (status === Status.Seeing) {
      setBackgroundColor(determineBackgroundColour(Status.Seeing));
      router.push(`/wait/${requestId}`);
    }
  };

  return (
    <>
      <Card className={styles.card} style={{ backgroundColor }}>
        <CardActionArea
          className={styles.cardContent}
          onClick={() => router.push(`/request/${requestId}`)}
        >
          <div className={styles.cardHeader}>
            <div className={styles.zidNameContainer}>
              <TagBox
                text={formatZid(zid)}
                backgroundColor="var(--colour-main-purple-400)"
                color="var(--colour-main-purple-900)"
              />
              <Typography className={styles.textHeading} variant="h6">
                {firstName + ' ' + lastName}
              </Typography>
            </div>
            <div className={styles.previousRequestsContainer}>
              <TagBox
                text={`PREVIOUS TOTAL REQUESTS: ${previousRequests}`}
                backgroundColor="var(--colour-main-purple-400)"
                color="var(--colour-main-purple-900)"
              />
            </div>
          </div>
          <div className={styles.titleContainer}>
            <Typography className={styles.textHeading} variant="h6">
              {title}
            </Typography>
          </div>
          <div className={styles.tagContainer}>
            {tags?.map((tag, i) => {
              return (
                <TagBox
                  text={tag.name}
                  key={i}
                  isPriority={tag.isPriority}
                  backgroundColor="var(--colour-main-yellow-500)"
                  color="white"
                />
              );
            })}
          </div>
          <CardActions className={styles.cardActions}>
            <div className={styles.orderContainer}>
              <IconButton aria-label="move up button">
                <ArrowUpward />
              </IconButton>
              <IconButton aria-label="move down button">
                <ArrowDownward />
              </IconButton>
            </div>
            {status === Status.Unseen && (
              <>
                <Button
                  className={styles.claimButton}
                  variant="contained"
                  onClick={() => updateStatus(Status.Seeing)}
                >
                  Claim
                </Button>
                <Button
                  className={styles.notFoundButton}
                  variant="contained"
                  onClick={() => updateStatus(Status.NotFound)}
                >
                  Not Found
                </Button>
              </>
            )}
            {status === Status.Seeing && (
              <Button
                className={styles.claimButton}
                variant="contained"
                onClick={() => updateStatus(Status.Seen)}
              >
                Resolve
              </Button>
            )}
            { status === Status.Seen && (
              <Button
                className={styles.claimButton}
                variant="contained"
                onClick={() => updateStatus(Status.Unseen)}
              >
                Unresolve
              </Button>
            )}
          </CardActions>
        </CardActionArea>
      </Card>
    </>
  );
};

export default StudentQueueRequestCard;
