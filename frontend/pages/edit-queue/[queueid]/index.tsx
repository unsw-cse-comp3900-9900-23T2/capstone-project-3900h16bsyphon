import { useRouter } from 'next/router';
import QueueSettings from '../../../components/QueueSettings';
import { useEffect, useState } from 'react';
import { authenticatedGetFetch, toCamelCase } from '../../../utils';

const EditQueue = () => {
  const router = useRouter();
  const [courseid, setCourseId] = useState<string>('');

  useEffect(() => {
    if (!router.query.queueid) return;
    let getQueue = async () => {
      let res = await authenticatedGetFetch('/queue/get', {queue_id: router.query.queueid as string});
      let data = await res.json();
      data = toCamelCase(data);
      setCourseId(data.courseOfferingId);   
    };
    getQueue();
  }, [router.query.queueid]);

  return (
    <>
      <QueueSettings courseOfferingId={courseid} queueId={router.query.queueid as string} isEdit={true}/>
    </>
  );
};

export default EditQueue;
