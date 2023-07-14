import { useRouter } from 'next/router';
import QueueSettings from '../../../components/QueueSettings';

const CreateQueue = () => {
  const router = useRouter();
  return (
    <>
      <QueueSettings courseOfferingId={router.query.courseid} isEdit={false}/>
    </>
  );
};

export default CreateQueue;
