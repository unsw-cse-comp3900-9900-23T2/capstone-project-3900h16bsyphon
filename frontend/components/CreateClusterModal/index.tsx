import { Button, Card, CardActionArea, Modal, TextField, Typography } from '@mui/material';
import styles from './CreateClusterModal.module.css';
import { useEffect, useState } from 'react';
import { ClusterRequest, Tag, UserRequest, isCluster } from '../../types/requests';
import { authenticatedGetFetch, authenticatedPostFetch, formatZid } from '../../utils';
import { toast } from 'react-toastify';
import TagsSelection from '../TagsSelection';
import TagBox from '../TagBox';

type CreateClusterModalProps = {
  queueId: number;
  requests: (UserRequest | ClusterRequest)[];
};


const CreateClusterModal = (
  { queueId, requests }: CreateClusterModalProps
) => {

  const [open, setOpen] = useState(false);
  const [selectedClustering, setSelectedClustering] = useState<(UserRequest)[]>([]);
  const [clusterableUserRequests, setClusterableUserRequests] = useState<UserRequest[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);

  useEffect(() => {
    const userReqs = requests.filter((r) => !isCluster(r)) as UserRequest[];
    setClusterableUserRequests(userReqs.filter((r) => r.isClusterable));
  }, [requests]);

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

  const handleClusterSubmit = async () => {
    console.log('selectedClustering', selectedClustering);
    if (selectedClustering.length < 2) return;
    let res = await authenticatedPostFetch('/queue/cluster/create', {
      queue_id: queueId,
      request_ids: selectedClustering.map((r) => !isCluster(r) && r.requestId),
    });
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
    setSelectedClustering([]);
  };

  useEffect(() => {
    setSelectedClustering(clusterableUserRequests.filter((r) => r.tags.some((t) => selectedTags.some((st) => st.name === t.name))));
  }, [selectedTags, clusterableUserRequests]);

  return (
    <div>
      <div className={styles.buttonContainer}>
        <Button onClick={() => setOpen(true)} className={styles.genericButton}> Create Cluster</Button>
      </div>
      <Modal 
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}> 
            <Typography variant="h4" className={styles.title}>Create Cluster</Typography>
          </div>
          <div className={styles.searchBarContainer}>
            <TagsSelection 
              tags={tags} 
              isCreator={false} 
              tagSelection={selectedTags} 
              setTagSelection={setSelectedTags} 
            />
            <TextField 
              className={styles.searchBar}
              label="Search"
              variant="outlined"
              fullWidth
              onChange={(e) => {
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
          {clusterableUserRequests.length > 0 ? clusterableUserRequests.map((request, index) => (
            <CardActionArea 
              key={`${index}`}
              onClick={() => {
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
          {clusterableUserRequests.length > 0 && <Button onClick={handleClusterSubmit} className={styles.submitButton}>Create Cluster</Button>}
        </div>
      </Modal>
    </div>
  );
};

export default CreateClusterModal;

