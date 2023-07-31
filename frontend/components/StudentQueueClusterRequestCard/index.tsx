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
import React, { useEffect, useState } from 'react';
import { authenticatedPutFetch, formatZid } from '../../utils';
import { ClusterRequest, Status, UserRequest } from '../../types/requests';
import ClusterModal from '../ClusterModal';

type StudentQueueRequestCardProps = {
  clusterId: number;
  requests: UserRequest[];
  isTutorView: boolean;
  joinClusterAction?: () => void;
  leaveClusterAction?: () => void;
  allRequests: (UserRequest | ClusterRequest)[];
};

const StudentQueueRequestCard = ({
  clusterId,
  requests,
  isTutorView,
  joinClusterAction,
  leaveClusterAction,
  allRequests
}: StudentQueueRequestCardProps) => {
  const router = useRouter();
  const [tagsOfFirstRequest, setTagsOfFirstRequest] = useState(requests[0]?.tags ?? []);

  useEffect(() => {
    if (requests.length === 0) return;
    setTagsOfFirstRequest(requests[0]?.tags ?? []);
  }, [requests]);

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
    if (requests.length === 0) return;
    if (requests[0].status === Status.NotFound) return;
    if (requests[0].status === Status.Seen) router.push(`/request-summary/${requests[0].requestId}`);
    else router.push(isTutorView ? `/cluster/${clusterId}`: `/cluster-student-view/${clusterId}`);
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
          <div className={styles.tagContainer}>
            {tagsOfFirstRequest?.map((tag, i) => {
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
                { requests.length > 0 && requests[0].status === Status.NotFound && (
                  <>
                    <Button
                      className={styles.claimButton}
                      variant="contained"
                      onClick={(e) => updateStatus(Status.Unseen, e)}
                    >
                      Unresolve
                    </Button>
                  </>
                )}
                { requests.length > 0 && requests[0].status === Status.Unseen && (
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
                { requests.length > 0 && requests[0].status === Status.Seeing && (
                  <Button
                    className={styles.claimButton}
                    variant="contained"
                    onClick={(e) => updateStatus(Status.Seen, e)}
                  >
                  Resolve
                  </Button>
                )}
                { requests.length > 0 && requests[0].status === Status.Seen && (
                  <Button
                    className={styles.claimButton}
                    variant="contained"
                    onClick={(e) => updateStatus(Status.Unseen, e)}
                  >
                  Unresolve
                  </Button>
                )}
              </div>
              <ClusterModal queueId={Number.parseInt(`${router.query.queueid}`)} button={
                <Button
                  className={styles.editButton}
                  variant="contained"
                >
                  Edit
                </Button>
              }
              requests={allRequests}
              clusterId={clusterId}
              selectedRequests={requests}
              />
            </CardActions>
          )}
        </CardActionArea>
        {!isTutorView && joinClusterAction && (
          <CardActions className={styles.clusterCardActions}>
            <div className={styles.statusActionButtons}>
              <Button
                className={styles.joinClusterButton}
                variant="contained"
                onClick={joinClusterAction}
              >
                Join Cluster
              </Button>
            </div>
          </CardActions>
        )}

        {!isTutorView && leaveClusterAction && (
          <CardActions className={styles.clusterCardActions}>
            <div className={styles.statusActionButtons}>
              <Button
                className={styles.leaveClusterButton}
                variant="contained"
                onClick={leaveClusterAction}
              >
                Leave Cluster
              </Button>
            </div>
          </CardActions>
        )}

      </Card>
    </>
  );
};

export default StudentQueueRequestCard;
