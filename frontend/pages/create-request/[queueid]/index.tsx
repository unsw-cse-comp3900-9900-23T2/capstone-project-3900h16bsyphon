import React, { useEffect, useState } from 'react';
import styles from './CreateRequest.module.css';
import { useRouter } from 'next/router';
import Header from '../../../components/Header';
import CreateRequestCard from '../../../components/CreateRequestCard';

export default function CreateRequest() {
  const router = useRouter();

  const [queueId, setQueueId] = useState(Number.parseInt(`${router.query.queueid}`));
  useEffect(() => {
    setQueueId(Number.parseInt(`${router.query.queueid}`));
  }, [router.query.queueid]);

  return (
    <>
      <Header/>
      <div className={styles.pageContainer}>
        <CreateRequestCard queueId={queueId} />
      </div>
    </>
  );
}
