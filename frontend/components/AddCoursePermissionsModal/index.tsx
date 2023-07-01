import React, { useState } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import styles from './AddCoursePermissionsModal.module.css';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import {
  FormControl,
  MenuItem,
  OutlinedInput,
  Select,
  SelectChangeEvent,
  Typography,
} from '@mui/material';
import UserPermissionsBox from '../UserPermissionBox';

const courses = [
  'COMP1511',
  'COMP1521',
  'COMP2041',
  'COMP1531',
  'COMP1541',
  'COMP1551',
  'COMP2511',
  'COMP2521',
  'COMP2531',
];

type CoursePermission = {
  courseCode: string,
  courseOfferingId: number,
  title: string,
}

type AddCoursePermissionsModalProps = {
  tutor: CoursePermission[];
}

const AddCoursePermissionsModal = ({
  tutor,
}: AddCoursePermissionsModalProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [tutorPermissionList, setTutorPermissionList] =
    useState<string[]>(tutor?.map((x) => x.courseCode));

  const handleChange = (event: SelectChangeEvent<string>) => {
    const {
      target: { value },
    } = event;
    setTutorPermissionList(
      // On autofill we get a stringified value.
      typeof value === 'string' ? value.split(',') : value
    );
  };

  return (
    <div>
      <Button
        onClick={handleOpen}
        className={styles.permissionManagementButton}
        color='secondary'
        variant='contained'
        size='medium'
      >
        Add more courses
      </Button>

      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby='add tutor permission for chosen course modal'
      >
        <div className={styles.container}>
          <div className={styles.titleContainer}>
            <Typography className={styles.text} variant='h4'>Edit Course Permissions</Typography>
            <IconButton
              onClick={handleClose}
              size='small'
              aria-label='close modal button'
            >
              <CloseIcon />
            </IconButton>
          </div>

          <FormControl className={styles.formContainer} >
            <Select
              multiple
              displayEmpty
              value={tutorPermissionList as unknown as string}
              onChange={handleChange}
              input={<OutlinedInput />}
              renderValue={(selected) => {
                if (selected.length === 0) {
                  return <em>Select courses</em>;
                }

                return (selected as unknown as string[]).join(', ');
              }}
              inputProps={{ 'aria-label': 'Without label' }}
            >
              {courses?.map((course) => (
                <MenuItem key={course} value={course}>
                  {course}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <div className={styles.userPermissions}>
            {tutorPermissionList?.map((course, i) => (
              <UserPermissionsBox
                key={i}
                permission="Tutor"
                courseOffering={course}
              />
            ))}
          </div>
        
          <div className={styles.buttonContainer} >
            <Button onClick={handleClose} variant='contained' className={styles.text}>
              Add courses
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddCoursePermissionsModal;
