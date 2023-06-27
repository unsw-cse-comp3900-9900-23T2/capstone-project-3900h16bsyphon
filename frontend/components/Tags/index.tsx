/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import style from './Tags.module.css';
import { Autocomplete, Chip, MenuItem, OutlinedInput, Select, TextField, Typography } from '@mui/material';

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
      />
    </div>
  );
};

export default Tags;
