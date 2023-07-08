import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import Button from '@mui/material/Button';
import Modal from '@mui/material/Modal';
import styles from './AddCoursePermissionsModal.module.css';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { CourseOfferingData } from '../../types/courses';

import {
  Autocomplete,
  TextField,
  Typography,
} from '@mui/material';
import UserPermissionsBox from '../UserPermissionBox';
import { authenticatedGetFetch, authenticatedPutFetch, toCamelCase } from '../../utils';

type CoursePermission = {
  courseCode: string,
  courseOfferingId: number,
  title: string,
}

type AddCoursePermissionsModalProps = {
  coursesTutored: CoursePermission[];
  setCoursesTutored: Dispatch<SetStateAction<CoursePermission[]>>;
  tutorId: number;
}

const AddCoursePermissionsModal = ({
  coursesTutored, setCoursesTutored, tutorId
}: AddCoursePermissionsModalProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  
  useEffect(() => {
    setCurrentSelected(coursesTutored);
  }, [coursesTutored]);

  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingData[]>([]);

  const [currentSelected, setCurrentSelected] = useState<CoursePermission[]>([]);

  useEffect(() => {
    const getCourseOfferings = async () => {
      const res = await authenticatedGetFetch('/course/get_courses_admined', {});
      setCourseOfferings(toCamelCase(await res.json()));
    };
    getCourseOfferings();
  }, []);

  const handleSave = () => {
    const saveCoursePermissions = async () => {
      // send the courses that arent already added
      const newCourses = currentSelected.filter((c) => !coursesTutored.includes(c));
      const course_ids = newCourses.map(c => c.courseOfferingId);
      const res = await authenticatedPutFetch('/course/add_tutor_to_courses', { tutor_id: tutorId, course_ids });
      if (!res.ok) {
        console.error('authentication failed, or something broke with adding course permissions, check network tab');
        return;
      }
      // if everything went ok with adding courses, update the list 
      setCoursesTutored([...coursesTutored, ...newCourses]);

    };
    saveCoursePermissions();
    handleClose();
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
          <Autocomplete
            fullWidth
            multiple
            id="tags-standard"
            options={courseOfferings.map(co => {
              const item: CoursePermission = {
                courseCode: co.courseCode, 
                courseOfferingId: co.courseOfferingId, 
                title: co.title};
              return item;
            })}
            isOptionEqualToValue={(option, value) => option.courseOfferingId === value.courseOfferingId}
            value={currentSelected}
            getOptionLabel={(option) => option.courseCode}
            onChange={(_, value) => {
              console.log('the value inside on change rn is', value);
              setCurrentSelected(value);
            }}
            renderInput={(params) => (<TextField {...params} fullWidth />)}
          />
          <div className={styles.userPermissions}>
            {currentSelected?.map((course, i) => (
              <UserPermissionsBox
                key={i}
                permission="Tutor"
                courseOffering={course.courseCode}
              />
            ))}
            {}
          </div>
        
          <div className={styles.buttonContainer} >
            <Button onClick={handleSave} variant='contained' className={styles.text}>
              Save
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default AddCoursePermissionsModal;
