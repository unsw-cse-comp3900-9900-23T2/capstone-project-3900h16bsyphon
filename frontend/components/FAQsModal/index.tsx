import React, { useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import styles from './FAQsModal.module.css';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { FAQ } from '../../types/faqs';
import {
  Typography,
} from '@mui/material';
import { authenticatedGetFetch, toCamelCase } from '../../utils';

type FAQsModalProps = {
  courseOfferingId?: string
}

const defaultData : FAQ[] = [
  { id: 100, 
    question: 'What did one wall say to the other wall?',
    answer: 'I\'ll meet you at the corner!' },
  { id: 101,
    question: 'What do you call a fake noodle?',
    answer: 'An Impasta!' },
  { id: 102,
    question: 'Why did the math book look so sad?',
    answer: 'The math book had been feeling down lately, burdened by the weight of numbers and equations that seemed to stretch endlessly across its pages. It had grown tired of being seen as a mere tool for solving problems, longing to be appreciated for the beauty and elegance hidden within its mathematical realm. Each day, as it watched novels being read with delight and poetry being recited with passion, the math book couldn\'t help but feel left out, confined to a world where its true potential went unnoticed. It yearned for the day when someone would open its cover not out of obligation, but with genuine curiosity and a desire to explore the intricacies of numbers. The math book dreamt of being embraced, not for its ability to calculate, but for its power to unlock the secrets of the universe and inspire minds. So, as it sat on the shelf, a tinge of sadness permeated its pages, silently hoping that one day, someone would see beyond its numerical facade and discover the wonders that lay within.'
  }];

const FAQsModal = ({ courseOfferingId }: FAQsModalProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [faqData, setFaqData] = useState(defaultData);
  
  // fetch faq data
  // useEffect(() => {
  //   const getFAQData = async () => {
  //     if (!courseOfferingId) return;
  //     let res = await authenticatedGetFetch('/faqs/list', {
  //       course_offering_id: `${courseOfferingId}`,
  //     });
  //     let d = await res.json();
  //     setFaqData(toCamelCase(d));
  //   };
  //   getFAQData();
  // }, [courseOfferingId]);


  return (
    <div>
      <Button
        onClick={handleOpen}
        className={styles.modalButton}
        color='secondary'
        variant='contained'
        size='medium'
      >
        FAQs
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='add tutor permission for chosen course modal'
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}>
            <Typography variant='h4'>FAQs</Typography>
            <IconButton
              onClick={handleClose}
              size='small'
              aria-label='close modal button'
            >
              <CloseIcon />
            </IconButton>
          </div>

          {/* Faq question answer component */}
          <div className={styles.questionAnswerContainer}>
            {/* question div */}
            <div className={styles.questionContainer}>
              <Typography variant='h6'>{defaultData[0].question}</Typography>
            </div>
            {/* answer div */}
            <div className={styles.answerContainer}>
              <Typography variant='body1'>{defaultData[0].answer}</Typography>
            </div>
          </div>
          <div className={styles.buttonContainer} >
            <Button onClick={handleClose} variant='contained'>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default FAQsModal;
