import { useEffect, useState } from 'react';
import CreateRequestCard from '../../../components/CreateRequestCard';
import Header from '../../../components/Header';
import styles from './EditRequest.module.css';
import { useRouter } from 'next/router';


const EditRequest = () => {
  const router = useRouter();

  const [requestId, setRequestId] = useState(Number.parseInt(`${router.query.requestId}`));
  useEffect(() => {
    setRequestId(Number.parseInt(`${router.query.requestId}`));
  }, [router.query.requestId]);

  return <>
    <Header />
    <div className={styles.pageContainer}>
      <CreateRequestCard requestId={requestId} isEditMode={true} queueId={undefined} />
    </div>  
  </>;
};

export default EditRequest;
