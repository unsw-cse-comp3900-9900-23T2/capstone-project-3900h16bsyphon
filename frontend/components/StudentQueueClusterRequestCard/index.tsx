import {
  Button,
  Card,
  CardActionArea,
  CardActions,
  Typography,
} from '@mui/material';
import styles from './StudentQueueClusterRequestCard.module.css';
import { useRouter } from 'next/router';
import TagBox from '../TagBox';
import React from 'react';
import { authenticatedPutFetch, formatZid } from '../../utils';
import { Status, UserRequest } from '../../types/requests';

type StudentQueueRequestCardProps = {
  clusterId: number;
  requests: UserRequest[];
};

const StudentQueueRequestCard = ({
  clusterId,
  requests,
}: StudentQueueRequestCardProps) => {
  const router = useRouter();

  const updateStatus = async (status: Status, e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
    e.stopPropagation();
    await Promise.all(requests.map((request) => {
      authenticatedPutFetch('/request/set_status', {
        request_id: request.requestId,
        status,
      });
    }));

    if (status === Status.Seeing) {
      router.push(`/cluster/${clusterId}`);
    }
  };

  const handleOpenCard = () => {
    if (requests[0].status === Status.NotFound) return;
    if (requests[0].status === Status.Seen) router.push(`/request-summary/${requests[0].requestId}`);
    else router.push(`/cluster/${clusterId}`);
  };

  return (
    <>
      <Card className={styles.card} style={{ backgroundColor: 'var(--colour-main-yellow-100)' }}>
        <CardActionArea
          className={styles.cardContent}
          onClick={handleOpenCard}
        >
          <div className={styles.cardHeader}>
            <div className={styles.titleContainer}>
              <Typography className={styles.textHeading} variant="h6">
                {requests[0].title + ' cluster'}
              </Typography>
            </div>
          </div>
          <div className={styles.tagContainer}>
            {requests?.map((request, i) => {
              return (
                <TagBox
                  text={formatZid(request.zid)}
                  key={i}
                  backgroundColor="var(--colour-main-purple-400)"
                  color="var(--colour-main-purple-900)"
                />
              );
            })}
          </div>
          <CardActions className={styles.cardActions}>
            <div className={styles.statusActionButtons}>
              {
                requests[0].status === Status.NotFound && (
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
              {requests[0].status === Status.Unseen && (
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
              {requests[0].status === Status.Seeing && (
                <Button
                  className={styles.claimButton}
                  variant="contained"
                  onClick={(e) => updateStatus(Status.Seen, e)}
                >
                  Resolve
                </Button>
              )}
              { requests[0].status === Status.Seen && (
                <Button
                  className={styles.claimButton}
                  variant="contained"
                  onClick={(e) => updateStatus(Status.Unseen, e)}
                >
                  Unresolve
                </Button>
              )}
            </div>
          </CardActions>
        </CardActionArea>
      </Card>
    </>
  );
};

export default StudentQueueRequestCard;
