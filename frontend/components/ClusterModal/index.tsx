import { Button, Card, CardActionArea, IconButton, Modal, TextField, Typography } from '@mui/material';
import styles from './ClusterModal.module.css';
import React, { ReactElement, useEffect, useState } from 'react';
import { ClusterRequest, Tag, UserRequest, isCluster } from '../../types/requests';
import { authenticatedGetFetch, authenticatedPostFetch, authenticatedPutFetch, formatZid } from '../../utils';
import { toast } from 'react-toastify';
import TagsSelection from '../TagsSelection';
import TagBox from '../TagBox';
import CloseIcon from '@mui/icons-material/Close';

type CreateClusterModalProps = {
  queueId: number;
  requests: (UserRequest | ClusterRequest)[];
  button: ReactElement;
  // both only provided only when editing a cluster
  clusterId?: number;
  selectedRequests?: UserRequest[];
};


const ClusterModal = (
  { queueId, requests, button, clusterId, selectedRequests }: CreateClusterModalProps
) => {

  const [open, setOpen] = useState(false);
  const [selectedClustering, setSelectedClustering] = useState<(UserRequest)[]>(selectedRequests ?? []);
  const [clusterableUserRequests, setClusterableUserRequests] = useState<UserRequest[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    const userReqs = requests.filter((r) => !isCluster(r) || r.clusterId === clusterId);
    setClusterableUserRequests(userReqs.flatMap((r) => isCluster(r) ? r.requests : [r]));
  }, [clusterId, requests]);

  useEffect(() => { 
    const getTags = async () => {
      let res = await authenticatedGetFetch('/queue/tags', { queue_id: queueId.toString() });
      if (res.ok) {
        let data = await res.json();
        setTags(data);
      }
    };
    getTags();
  }, [queueId]);

  const decideBackgroundColor = (request: UserRequest | ClusterRequest) => {
    if (selectedClustering.some((r) => isCluster(r) ? r.clusterId === request.clusterId : r.requestId === (request as UserRequest).requestId)) {
      return 'var(--colour-seeing)';
    } else {
      return 'white';
    }
  };

  const handleClusterSubmit = async (e: { stopPropagation: () => void; }) => {
    e.stopPropagation();
    console.log('selectedClustering', selectedClustering);
    if (selectedClustering.length < 2) {
      if (clusterId) {
        await authenticatedPutFetch('/queue/cluster/edit', {
          cluster_id: clusterId,
          request_ids: [],
        });
        setSelectedClustering([]);
      } else {
        toast('Need more than one request in cluster', {
          position: 'bottom-left',
          autoClose: 5000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: 'light',
          className: styles.toast,
        });
      }
      return;
    }
    let res;
    if (!clusterId) {
      res = await authenticatedPostFetch('/queue/cluster/create', {
        queue_id: queueId,
        request_ids: selectedClustering.map((r) => !isCluster(r) && r.requestId),
      });
    } else {
      res = await authenticatedPutFetch('/queue/cluster/edit', {
        cluster_id: clusterId,
        request_ids: selectedClustering.map((r) => !isCluster(r) && r.requestId),
      });
    }
    if (!res.ok) {
      let err = await res.json();
      toast(err, {
        position: 'bottom-left',
        autoClose: 5000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
        className: styles.toast,
      });
    }
    setOpen(false);
  };

  useEffect(() => {
    if (selectedTags.length === 0) return;
    setSelectedClustering(clusterableUserRequests.filter((r) => r.tags.some((t) => selectedTags.some((st) => st.name === t.name))));
  }, [selectedTags, clusterableUserRequests]);

  return (
    <div onClick={e => e.stopPropagation()}>
      <div className={styles.buttonContainer} onClick={(e) => {e.stopPropagation(); setOpen(true);} }>
        {button}
      </div>
      <Modal 
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className={styles.container} onClick={e => e.stopPropagation()}>
          <IconButton
            onClick={(e) => {e.stopPropagation(); setOpen(false);}}
            size="small"
            aria-label="close modal button"
            className={styles.closeButton}
          >
            <CloseIcon />
          </IconButton>
          <div className={styles.titleContainer}> 
            <Typography variant="h4" >{clusterId ? 'Edit' : 'Create'} Cluster</Typography>
          </div>
          <div className={styles.searchBarContainer}>
            <TagsSelection 
              tags={tags} 
              isCreator={false} 
              tagSelection={selectedTags}
              setTagSelection={setSelectedTags} 
            />
            <TextField
              label="Search"
              variant="outlined"
              fullWidth
              onClick={e => e.stopPropagation()}
              onChange={(e) => {
                e.stopPropagation();
                let search = e.target.value.toLowerCase();
                if (search === '') {
                  setSelectedClustering([]);
                  return;
                }
                try {
                  const regex = new RegExp(search);
                  setSelectedClustering(clusterableUserRequests.filter((r) => regex.test(r.title.toLowerCase()) || regex.test(r.description.toLowerCase())));
                } catch (e) {
                  console.log('invalid regex');
                  console.log(e);
                  setSelectedClustering([]);
                }
              }}
            />
          </div>
          {clusterableUserRequests.length > 0 ? clusterableUserRequests.filter(r => r.isClusterable).map((request, index) => (
            <CardActionArea
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                if (selectedClustering.some((r) => isCluster(r) ? r.clusterId === request.clusterId : r.requestId === (request as UserRequest).requestId)) {
                  setSelectedClustering(selectedClustering.filter((r) => isCluster(r) ? r.clusterId !== request.clusterId : r.requestId !== (request as UserRequest).requestId));
                } else {
                  setSelectedClustering([...selectedClustering, request]);
                }
              }}
            >
              <Card 
                className={styles.requestCard} 
                style={{ backgroundColor: decideBackgroundColor(request) }}
              >
                <TagBox text={formatZid(request.zid)} backgroundColor='var(--colour-main-purple-200)' color='var(--colour-main-purple-900)' />
                <Typography variant="body1">{!isCluster(request) && `${request.firstName} ${request.lastName}`}</Typography>
                <Typography variant="h6">{!isCluster(request) && request.title}</Typography>
                {request.tags.map((tag, index) => (
                  <TagBox key={`${index}`} text={tag.name} backgroundColor='var(--colour-main-yellow-500)' color='white' />
                ))}
              </Card>
            </CardActionArea>
          )) :
            <Typography variant="body1">No requests to cluster</Typography>
          }
          {clusterableUserRequests.length > 0 && <Button onClick={handleClusterSubmit} className={styles.createClusterButton}>
            {clusterId ? 'Edit' : 'Create'} Cluster
          </Button>}
        </div>
      </Modal>
    </div>
  );
};

export default ClusterModal;

