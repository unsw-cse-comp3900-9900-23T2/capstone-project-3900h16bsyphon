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
import { authenticatedGetFetch, toCamelCase } from '../../utils';

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
  coursesTutored: CoursePermission[];
  setCoursesTutored: Dispatch<SetStateAction<CoursePermission[]>>;
}

const AddCoursePermissionsModal = ({
  coursesTutored, setCoursesTutored
}: AddCoursePermissionsModalProps) => {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [tutorPermissionList, setTutorPermissionList] =
    useState<string[]>(coursesTutored?.map((x) => x.courseCode));

  const [courseOfferings, setCourseOfferings] = useState<CourseOfferingData[]>([]);

  useEffect(() => {
    const getCourseOfferings = async () => {
      const res = await authenticatedGetFetch('/course/get_courses_admined', {});
      setCourseOfferings(await res.json());
      console.log('the course offerings in the modal are ', courseOfferings);
    };
    getCourseOfferings();
  }, []);

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
              return {course_code: co.course_code, course_offering_id: co.course_offering_id, title: co.title};
            })}
            getOptionLabel={(option) => option.course_code}
            onChange={(_, value) => {
              console.log('the value inside on change rn is', value);
              // setAdmins(matches?.map((user) => user.zid));
            }}
            renderInput={(params) => (<TextField {...params} fullWidth />)}
          />
            
          <div className={styles.userPermissions}>
            {tutorPermissionList?.map((course, i) => (
              <UserPermissionsBox
                key={i}
                permission="Tutor"
                courseOffering={course}
              />
            ))}
            {}
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
