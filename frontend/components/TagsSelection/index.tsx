/* eslint-disable no-unused-vars */
import React, { useState } from 'react';
import style from './TagsSelection.module.css';
import { Autocomplete, TextField, Typography } from '@mui/material';
import TagBox from '../TagBox';
import { Tag } from '../../types/requests';

type TagsProps = {
  tags: Tag[],
  isCreator?: boolean,
  setTagSelection: (tags: Tag[]) => void,
  backgroundColor?: string,
  color?: string,
}

const TagsSelection = ({tags, isCreator, setTagSelection, color='var(--colour-main-purple-900)', backgroundColor='var(--colour-main-purple-200)'}: TagsProps) => {
  return (
    <div className={style.tags}>
      <Typography variant='body1' className={style.tagLabel}>Tags (you must choose at least one)</Typography>
      <Autocomplete
        id="size-small-outlined"
        size="medium"
        onChange={(_, value) => setTagSelection(value.map((tagString) => {
          const tag = tags.find((tag) => tag.name === tagString);
          if (tag) return tag;
          return {tagId: -1, name: tagString, isPriority: false};
        }))}
        options={tags.map((option) => option.name)}
        multiple={true}
        renderInput={(params) => <TextField {...params} />}
        freeSolo={isCreator}
        renderTags={(value) =>
          value.map((content, index) => (
            <TagBox
              key={index}
              text={content}
              color={color}
              backgroundColor={backgroundColor}
              bold={false}
            />
          ))
        }
      />
    </div>
  );
};

export default TagsSelection;
