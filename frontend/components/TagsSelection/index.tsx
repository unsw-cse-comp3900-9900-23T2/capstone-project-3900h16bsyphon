import React from 'react';
import style from './TagsSelection.module.css';
import { Autocomplete, TextField, Typography } from '@mui/material';
import TagBox from '../TagBox';
import { Tag } from '../../types/requests';

type TagsProps = {
  tags: Tag[],
  isCreator?: boolean,
  tagSelection: Tag[],
  setTagSelection: React.Dispatch<React.SetStateAction<Tag[]>>,
  backgroundColor?: string,
  color?: string,
}

const TagsSelection = ({ tags, tagSelection, isCreator, setTagSelection, color = 'var(--colour-main-purple-900)', backgroundColor = 'var(--colour-main-purple-200)' }: TagsProps) => {
  
  const togglePriority = (tag: Tag) => {
    setTagSelection((oldTags) => {
      const tagToChange = {...tag, isPriority: !tag.isPriority};
      return[...oldTags, tagToChange];
    });
  };

  // this is so silly but we need to have this to deal with how create queue uses this 
  // https://stackoverflow.com/questions/23130292/test-for-array-of-string-type-in-typescript
  const  isStringArray = (value: any): value is string[] => {
    if (value instanceof Array) {
      for (const item of value) {
        if (typeof item !== 'string') {
          return false;
        }
      }
      return true;
    }
    return false;
  };
  

  const onClick = isCreator ? togglePriority : () => { };
  return (
    <div className={style.tags}>
      <Typography variant='body1'>Tags (you must choose at least one)</Typography>
      <Autocomplete
        id="size-small-outlined"
        size="medium"
        onChange={(_, value) => {
          console.log('the value inside the onchange tagselection is', value );
          if (isStringArray(value)) {
            setTagSelection(value.map((tagName) => {
              return { tagId: -1, name: tagName, isPriority: false };
            }));
          } else {
            setTagSelection(value as Tag[]);
          }
        }}       
        options={tags}
        multiple
        value={tagSelection}
        getOptionLabel={(option) => typeof option === 'string' ? option : option.name}
        isOptionEqualToValue={(option, value) => option.tagId === value.tagId}
        renderInput={(params) => <TextField {...params} />}
        freeSolo={isCreator}
        renderOption={(props, option) => (
          <li {...props} style={{columnGap: 5}}>
            {option.name}
            {option.isPriority ? '🔥': ''}
          </li>
        )}
        renderTags={(value) =>
          value.map((tag) => (
            <TagBox
              onClick={() => onClick(tag)}
              isPriority={tag.isPriority}
              key={tag.tagId}
              text={tag.name}
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
