import { useEffect, useState } from 'react';
import CreateRequestCard from '../../../components/CreateRequestCard';
import Header from '../../../components/Header';
import styles from './EditRequest.module.css';
import { useRouter } from 'next/router';
import MetaData from '../../../components/MetaData';

const EditRequest = () => {
  const router = useRouter();

  const [requestId, setRequestId] = useState(Number.parseInt(`${router.query.requestid}`));
  useEffect(() => {
    setRequestId(Number.parseInt(`${router.query.requestid}`));
  }, [router.query.requestid]);

  return <>
    <MetaData />
    <Header />
    <div className={styles.pageContainer}>
      <CreateRequestCard requestId={requestId} isEditMode={true} queueId={undefined} />
    </div>  
  </>;
};

export default EditRequest;
