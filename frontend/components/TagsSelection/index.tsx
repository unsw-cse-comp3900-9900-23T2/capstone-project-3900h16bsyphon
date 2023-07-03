/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import style from './TagsSelection.module.css';
import { Autocomplete, TextField, Typography } from '@mui/material';
import TagBox from '../TagBox';

type TagsProps = {
  tags: string[],
  setTags?: (tags: string[]) => void,
  backgroundColor?: string,
  color?: string,
}

const TagsSelection = ({tags, setTags, color='var(--colour-main-purple-900)', backgroundColor='var(--colour-main-purple-200)'}: TagsProps) => {
  return (
    <div className={style.tags}>
      <Typography variant='body1' className={style.tagLabel}>Tags</Typography>
      <Autocomplete
        id="size-small-outlined"
        size="medium"
        options={tags}
        multiple={true}
        renderInput={(params) => (
          <TextField {...params} />
        )}
        renderTags={(value) =>
          value.map((content, index) => (<TagBox key={index} text={content} color={color} backgroundColor={backgroundColor} bold={false}/>))
        }
      />
    </div>
  );
};

export default TagsSelection;
