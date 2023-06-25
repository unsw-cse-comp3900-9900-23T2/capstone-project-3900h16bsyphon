import Card from '@mui/material/Card';
import CardActions from '@mui/material/CardActions';
import CardContent from '@mui/material/CardContent';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import styles from './CourseCard.module.css';
import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

// TODO: add more props in
type CourseCardProps = {
  title: string;
  code: string;
}

const CourseCard = ({ title, code } : CourseCardProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <Card>
      <CardContent>
        <Typography className={styles.heading}>
          {title}
        </Typography>
      </CardContent>
      <CardActions>
        <Button size="small" variant="contained" disableElevation className={styles.queueBtn}>QUEUES</Button>
        <Button size="small" variant="contained" disableElevation className={styles.analyticsBtn}>ANALYTICS</Button>
        <Button size="small" variant="contained" disableElevation className={styles.tutorPageBtn}>TUTOR PAGE</Button>
        <Button onClick={handleOpen} size="small" variant="contained" disableElevation className={styles.tutorLinkBtn}>TUTOR LINK</Button>
        <Modal
          open={open}
          onClose={handleClose}
          aria-labelledby="generate join invite modal"
          aria-describedby="generate join invite modal"
        >
          <Box className={styles.container}>
            <Typography id="title" variant="h6" component="h2">
              Generate tutor invite link
            </Typography>
            <div className={styles.invite}>
              <p>Invite: {code}</p>
              <IconButton onClick={() => copyToClipboard('hi')} size="small" aria-label="copy to clipboard">
                <ContentCopyIcon />
              </IconButton>
            </div>
            <Button onClick={handleClose} size="small" variant="contained">Done</Button>
          </Box>
        </Modal>
      </CardActions>
    </Card>
  );
};

export default CourseCard;
