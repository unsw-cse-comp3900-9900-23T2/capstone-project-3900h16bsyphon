import React from 'react';
import style from './TagsSelection.module.css';
import { Autocomplete, TextField } from '@mui/material';
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
      return[...oldTags.filter((t) => t.name !== tag.name), tagToChange];
    });
  };

  const onClick = isCreator ? togglePriority : () => { };
  return (
    <div className={style.tags}>
      <Autocomplete
        id="size-small-outlined"
        size="medium"
        onChange={(_, value) => {
          // ensure everything inside value is a Tag type and not string 
          // need to do this bc of create queue >:(
          setTagSelection(value.map((tag) => {
            return (typeof tag === 'string') ? { tagId: -1, name: tag, isPriority: false } : tag;
          }));
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
          value.map((tag, idx) => (
            <TagBox
              onClick={() => onClick(tag)}
              isPriority={tag.isPriority}
              key={idx}
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
