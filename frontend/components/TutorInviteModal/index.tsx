import styles from './TutorInviteModal.module.css';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import Button from '@mui/material/Button';
import React, { useState } from 'react';
import Modal from '@mui/material/Modal';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';

type TutorInviteModalProps = {
  inviteCode: string;
}

const TutorInviteModal = ({ inviteCode }: TutorInviteModalProps) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState('');

  const handleOpen = async () => {
    setOpen(true);
    setCode(inviteCode);
  };
  const handleClose = () => setOpen(false);
  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  return (
    <div>
      <Button
        onClick={handleOpen}
        disableElevation
        className={styles.tutorLinkBtn}
      >
				TUTOR CODE
      </Button>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="generate join invite modal"
        aria-describedby="generate join invite modal"
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}>
            <h2 className={styles.title}>
              Generate tutor invite code
            </h2>
            <IconButton onClick={handleClose} size="small"
              aria-label="close modal button">
              <CloseIcon />
            </IconButton>
          </div>
          <div className={styles.invite}>
            <p>Invite: {code}</p>
            <IconButton
              onClick={() => copyToClipboard(code)}
              size="small"
              aria-label="copy to clipboard button"
            >
              <ContentCopyIcon />
            </IconButton>
          </div>
          <Button onClick={handleClose} className={styles.doneBtn}>
						Done
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default TutorInviteModal;
