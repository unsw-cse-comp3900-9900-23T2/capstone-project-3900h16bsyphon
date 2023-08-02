import { useEffect, useState } from 'react';
import CreateRequestCard from '../../../components/CreateRequestCard';
import Header from '../../../components/Header';
import styles from './EditRequest.module.css';
import { useRouter } from 'next/router';

const EditRequest = () => {
  const router = useRouter();

  const [requestId, setRequestId] = useState(Number.parseInt(`${router.query.requestid}`));
  useEffect(() => {
    setRequestId(Number.parseInt(`${router.query.requestid}`));
  }, [router.query.requestid]);

  return <>
    <Header />
    <div className={styles.pageContainer}>
      <CreateRequestCard requestId={requestId} isEditMode={true} queueId={undefined} />
    </div>  
  </>;
};

export default EditRequest;
