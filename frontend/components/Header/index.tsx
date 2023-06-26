import React from 'react';
import styles from './Header.module.css';
import Avatar from '@mui/material/Avatar';
import PersonIcon from '@mui/icons-material/Person';
import Button from '@mui/material/Button';
import { useRouter } from 'next/router';
import Link from 'next/link';
import NotificationsModal from '../NotificationsModal';

const Header = () => {
  let router = useRouter();
  return (
    <div className={styles.header}>
      <h1 className={styles.heading}>
        <Link href="/dashboard">Syphon</Link>
      </h1>
      <div className={styles.right}>
        {/* TODO: replace with actual user profile route */}
        <NotificationsModal />
        <Avatar onClick={() => router.push('/user')}>
          <PersonIcon />
        </Avatar>
        {/* TODO: replace with actual logout functionality */}
        <Button className={styles.button} onClick={() => router.push('/')}>Log out</Button>
      </div>
    </div>
  );
};

export default Header;
