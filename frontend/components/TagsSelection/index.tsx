/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import style from './TagsSelection.module.css';
import { Autocomplete, TextField, Typography } from '@mui/material';
import TagBox from '../TagBox';

const Tags = () => {
  const [tags, setTags] = useState<string[]>(['Assignment', 'Lab', 'General']);
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
          value.map((content, index) => (<TagBox key={index} text={content} color='#3E368F' backgroundColor='#E9E6FD' bold={false}/>))
        }
      />
    </div>
  );
};

export default Tags;
