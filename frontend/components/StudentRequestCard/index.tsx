import React from 'react';
import { Card, CardContent, Typography } from '@mui/material';
import styles from './StudentRequestCard.module.css';
import TagBox from '../TagBox';
import { determineBackgroundColour, formatZid } from '../../utils';
import { Status, Tag } from '../../types/requests';

type StudentRequestCardProps = {
  zid: number;
  firstName: string;
  lastName: string;
  title: string;
  tags: Tag[];
  status: Status;
  description: string;
  previousRequests: number;
  images: string[];
};

const StudentRequestCard = ({
  zid,
  firstName,
  lastName,
  title,
  description,
  tags,
  status,
  previousRequests,
  images,
}: StudentRequestCardProps) => (
  <Card style={{ backgroundColor: determineBackgroundColour(status) }} className={styles.cardContainer}>
    <CardContent className={styles.cardContent}>
      <div className={styles.cardHeader}>
        <div className={styles.zidNameContainer}>
          <div>
            <TagBox
              text={formatZid(zid)}
              backgroundColor="var(--colour-main-purple-400)"
              color="var(--colour-main-purple-900)"
            />
          </div>
          <div>
            <Typography className={styles.textHeading} variant="h6">
              {firstName + ' ' + lastName}
            </Typography>
          </div>
        </div>
        <div className={styles.previousRequestsContainer}>
          <TagBox
            text={`PREVIOUS TOTAL REQUESTS: ${previousRequests}`}
            backgroundColor="var(--colour-main-purple-400)"
            color="var(--colour-main-purple-900)"
          />
        </div>
      </div>
      <div>
        <Typography className={styles.textHeading} variant="h6">
          {title}
        </Typography>
      </div>
      <div className={styles.tagContainer}>
        {tags?.map((tag, i) => {
          return (
            <TagBox
              text={tag.name}
              key={i}
              isPriority={tag.isPriority}
              backgroundColor="var(--colour-main-yellow-500)"
              color="white"
            />
          );
        })}
      </div>
      <div>
        <Typography variant="body1">{description}</Typography>
      </div>
      <div>
        {
          images?.map((image, i) => {
            return (
              <div key={i}>
                {/*eslint-disable-next-line @next/next/no-img-element*/}
                <img src={`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}${image}`} alt="request" />
              </div>
            );
          })
        }
      </div>
    </CardContent>
  </Card>
);

export default StudentRequestCard;
