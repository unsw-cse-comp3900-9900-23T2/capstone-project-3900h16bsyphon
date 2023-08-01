import { useRouter } from 'next/router';
import QueueSettings from '../../../components/QueueSettings';
import style from './CreateQueue.module.css';
import { FormGroup, Box, Typography, Button, Card} from '@mui/material';
import Header from '../../../components/Header';

const CreateQueue = () => {
  const router = useRouter();
  return (
    <>
      <Header/>
      <QueueSettings courseOfferingId={router.query.courseid} isEdit={false}/>
    </>
  );
};

export default CreateQueue;
