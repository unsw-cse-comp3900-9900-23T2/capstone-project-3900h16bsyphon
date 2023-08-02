import { NextPage, NextPageContext } from 'next';
import styles from './Error.module.css';
import Button from '@mui/material/Button';
import router from 'next/router';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

// this will only work in prod
// https://nextjs.org/docs/advanced-features/custom-error-page#customizing-the-error-page
type Props = {
  statusCode?: number
}

const Error: NextPage<Props> = ({ statusCode }) => {
  const handleOpen = () => router.push('/');
  return (
    <div className={styles.container}>
      <div className={styles.contentContainer}>
        <ErrorOutlineIcon />
        <h1>{statusCode}</h1>
        <Button
          onClick={handleOpen}
          className={styles.redirectBtn}
          color='secondary'
          variant='contained'
          size='medium'
        >
          Back to home
        </Button>
      </div>
    </div>
  );
};
  
Error.getInitialProps = ({ res, err }: NextPageContext) => {
  const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
  return { statusCode };
};
  
export default Error;
