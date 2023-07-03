import { Box } from '@mui/material';
import styles from './UserPermissionBox.module.css';

type UserPermissionsBoxProps = {
  courseOffering: string;
  permission: string;
}

export default function UserPermissionsBox({
  courseOffering,
  permission,
}: UserPermissionsBoxProps) {
  return (
    <Box className={styles.cardBox}>
      <div className={styles.courseOfferingContainer}>{courseOffering}</div>
      <div className={styles.permissionTag}>{permission.toUpperCase()}</div>
    </Box>
  );
}
