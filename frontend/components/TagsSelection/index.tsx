import React from 'react';
import style from './TagsSelection.module.css';
import { Autocomplete, TextField, Typography } from '@mui/material';
import TagBox from '../TagBox';
import { Tag } from '../../types/requests';
import { FireplaceSharp } from '@mui/icons-material';

type TagsProps = {
  tags: Tag[],
  isCreator?: boolean,
  tagSelection: Tag[],
  setTagSelection: React.Dispatch<React.SetStateAction<Tag[]>>,
  backgroundColor?: string,
  color?: string,
}

const TagsSelection = ({ tags, tagSelection, isCreator, setTagSelection, color = 'var(--colour-main-purple-900)', backgroundColor = 'var(--colour-main-purple-200)' }: TagsProps) => {
  const togglePriority = (index: number) => {
    setTagSelection((oldTags) => {
      const newTags = [...oldTags];
      newTags[index].isPriority = !newTags[index].isPriority;
      return newTags;
    });
  };
  const onClick = isCreator ? togglePriority : () => { };
  return (
    <div className={style.tags}>
      <Typography variant='body1'>Tags (you must choose at least one)</Typography>
      <Autocomplete
        id="size-small-outlined"
        size="medium"
        onChange={(_, value) => setTagSelection((oldTagSelection) =>
          value.map((tagString) => {
            const alreadySelected = oldTagSelection.find((tag) => tag.name === tagString);
            if (alreadySelected) return alreadySelected;
            const tag = tags.find((tag) => tag.name === tagString);
            if (tag) return tag;
            return { tagId: -1, name: tagString, isPriority: false };
          }))}
        options={tags.map((option) => option.name)}
        multiple={true}
        renderInput={(params) => <TextField {...params} />}
        freeSolo={isCreator}
        renderOption={(props, option) => (
          <li {...props} style={{columnGap: 5}}>
            {option}
            {tags.find((tag) => tag.name === option)?.isPriority ? <FireplaceSharp />: <></>}
          </li>
        )}
        renderTags={(value) =>
          value.map((content, index) => (
            <TagBox
              onClick={() => onClick(index)}
              isPriority={tagSelection[index].isPriority}
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
