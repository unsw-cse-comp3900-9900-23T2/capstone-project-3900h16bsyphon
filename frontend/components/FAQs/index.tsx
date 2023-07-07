import React, { useCallback, useEffect } from 'react';
import { DataGrid, GridCellEditStopParams, GridRowSpacingParams, MuiEvent } from '@mui/x-data-grid';
import style from './FAQs.module.css';
import { Typography } from '@mui/material';
import { authenticatedGetFetch, authenticatedPostFetch } from '../../utils';
import { useRouter } from 'next/router';

type FAQ = {
  id: number;
  Question: string;
  Answer: string;
};

type FAQsProps = {
  course_offering_id: String;
};

const defaultData : FAQ[] = [
  { id: 100, 
    Question: 'What did one wall say to the other wall?',
    Answer: 'I\'ll meet you at the corner!' },
  { id: 101,
    Question: 'What do you call a fake noodle?',
    Answer: 'An Impasta!' },
  { id: 102,
    Question: 'Why did the math book look so sad?',
    Answer: 'The math book had been feeling down lately, burdened by the weight of numbers and equations that seemed to stretch endlessly across its pages. It had grown tired of being seen as a mere tool for solving problems, longing to be appreciated for the beauty and elegance hidden within its mathematical realm. Each day, as it watched novels being read with delight and poetry being recited with passion, the math book couldn\'t help but feel left out, confined to a world where its true potential went unnoticed. It yearned for the day when someone would open its cover not out of obligation, but with genuine curiosity and a desire to explore the intricacies of numbers. The math book dreamt of being embraced, not for its ability to calculate, but for its power to unlock the secrets of the universe and inspire minds. So, as it sat on the shelf, a tinge of sadness permeated its pages, silently hoping that one day, someone would see beyond its numerical facade and discover the wonders that lay within.'
  }];

const FAQs = ({ course_offering_id }: FAQsProps) => {
  const [data, setData] = React.useState(defaultData);
  useEffect(() => {
    authenticatedGetFetch('/queue/get_faqs', {
      course_offering_id: course_offering_id.toString(),
    })
      .then((res) => res.json())
      .then((res) => {setData(res);})
      .catch((err) => {
        console.error(err);
      });
  }, []);
  const getRowSpacing = useCallback((params: GridRowSpacingParams) => {
    return {
      top: params.isFirstVisible ? 0 : 5,
      bottom: params.isLastVisible ? 0 : 5,
    };
  }, []);
    
  return (
    <div>
      <Typography variant="h6" className={style.pageTitle}>Frequently Asked Questions</Typography>
      <DataGrid 
        columns={[{ field: 'Question', width: 500, editable: true, headerAlign: 'center'}, 
          { field: 'Answer', width: 500, editable: true, headerAlign: 'center'}]}
        rows={data}
        className={style.grid}
        getRowHeight={() => 'auto'} 
        autoHeight={true}
        pageSizeOptions={[5, 10, 20]}
        getRowSpacing={getRowSpacing}
        editMode='cell'
        onCellEditStop={() => {
          authenticatedPostFetch('/queue/add_faqs', data)
            .then((res) => {console.log(res);})
            .catch((err) => {
              console.error(err);
            });
        }}
        sx={{
          border: 0.5,
          '&.MuiDataGrid-root--densityCompact .MuiDataGrid-cell': { py: '8px' },
          '&.MuiDataGrid-root--densityStandard .MuiDataGrid-cell': { py: '15px' },
          '&.MuiDataGrid-root--densityComfortable .MuiDataGrid-cell': { py: '22px' },
        }}
      />
    </div>
  );
};

export default FAQs;
