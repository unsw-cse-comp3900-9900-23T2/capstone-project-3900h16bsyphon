import React, { useEffect } from 'react';
import styles from './Header.module.css';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Button from '@mui/material/Button';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationsModal from '../NotificationsModal';
import { setToken } from '../../utils';

const Header = () => {
  const router = useRouter();
  const logout = () => {
    router.push('/'); 
    setToken('');
  };

  return (
    <div className={styles.header}>
      <h1 className={styles.heading}>
        <Link href="/dashboard">Syphon</Link>
      </h1>
      <div className={styles.right}>
        <NotificationsModal />
        <Avatar onClick={() => router.push('/user-profile/current')} className={styles.profile}>
          <PersonIcon />
        </Avatar>
        <Button className={styles.button} onClick={() => logout()}>Log out</Button>
      </div>
    </div>
  );
};

export default Header;
