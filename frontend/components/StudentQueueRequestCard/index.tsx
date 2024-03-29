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
import React, { useEffect, useState } from 'react';
import {
  authenticatedPostFetch,
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
  isTutorView: boolean; 
  onClickAction?: () => void;
  createClusterAction?: () => void;
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
  isTutorView,
  onClickAction,
  createClusterAction,
}: StudentQueueRequestCardProps) => {
  const router = useRouter();
  const [backgroundColor, setBackgroundColor] = useState(
    determineBackgroundColour(status)
  );


  useEffect(() => {
    setBackgroundColor(determineBackgroundColour(status));
  }, [status]);

  const updateStatus = async (status: Status, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
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
    setBackgroundColor(determineBackgroundColour(status));
    if (status === Status.Seeing) {
      router.push(`/request/${requestId}`);
    }
  };

  const handleMove = async (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, direction: 'up' | 'down') => {
    e.stopPropagation();
    const requestUrl = (direction === 'up') ? '/request/move_up' : '/request/move_down';
    console.log('requestUrl', requestUrl);
    const res = await authenticatedPostFetch(requestUrl, {
      request_id: requestId,
    });
    if (!res.ok) {
      console.log(
        'error: something went wrong with moving request up; check network tab'
      );
      return;
    }
  };

  const handleOpenCard = () => {
    if (status === Status.NotFound) return;
    if (status === Status.Seen) router.push(`/request-summary/${requestId}`);
    if (isTutorView) {
      router.push(`/request/${requestId}`);
    } else {
      router.push(`/request-student-view/${requestId}`);
    }
  };


  return (
    <>
      <Card className={styles.card} style={{ backgroundColor }}>
        <CardActionArea
          className={styles.cardContent}
          onClick={onClickAction ? onClickAction : handleOpenCard}
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
            {isTutorView && (
              <div className={styles.previousRequestsContainer}>
                <TagBox
                  text={`PREVIOUS TOTAL REQUESTS: ${previousRequests}`}
                  backgroundColor="var(--colour-main-purple-400)"
                  color="var(--colour-main-purple-900)"
                />
              </div>
            )}
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
          {isTutorView && (
            <CardActions className={styles.cardActions}>
              <div className={styles.statusActionButtons}>
                {
                  status === Status.NotFound && (
                    <>
                      <Button
                        className={styles.claimButton}
                        variant="contained"
                        onClick={(e) => updateStatus(Status.Unseen, e)}
                      >
                      Unresolve
                      </Button>
                    </>
                  )
                }
                {status === Status.Unseen && (
                  <>
                    <Button
                      className={styles.claimButton}
                      variant="contained"
                      onClick={(e) => updateStatus(Status.Seeing, e)}
                    >
                    Claim
                    </Button>
                    <Button
                      className={styles.notFoundButton}
                      variant="contained"
                      onClick={(e) => updateStatus(Status.NotFound, e)}
                    >
                    Not Found
                    </Button>
                  </>
                )}
                {status === Status.Seeing && (
                  <Button
                    className={styles.claimButton}
                    variant="contained"
                    onClick={(e) => updateStatus(Status.Seen, e)}
                  >
                  Resolve
                  </Button>
                )}
                { status === Status.Seen && (
                  <Button
                    className={styles.claimButton}
                    variant="contained"
                    onClick={(e) => updateStatus(Status.Unseen, e)}
                  >
                  Unresolve
                  </Button>
                )}
              </div>
              <div className={styles.orderContainer}>
                <IconButton aria-label="move up button"
                  onClick={(e) => handleMove(e, 'up')}
                >
                  <ArrowUpward />
                </IconButton>
                <IconButton aria-label="move down button"
                  onClick={(e) => handleMove(e, 'down')}
                >
                  <ArrowDownward />
                </IconButton>
              </div>
            </CardActions>
          )}
        </CardActionArea>
        {!isTutorView && createClusterAction && (
          <CardActions className={styles.clusterCardActions}>
            <Button
              className={styles.createClusterButton}
              variant="contained"
              onClick={createClusterAction}
            >
              Create Cluster
            </Button>
          </CardActions>
        )}
      </Card>
    </>
  );
};

export default StudentQueueRequestCard;
