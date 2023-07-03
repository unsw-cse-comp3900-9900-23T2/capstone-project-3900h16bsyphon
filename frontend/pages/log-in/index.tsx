import type { NextPage } from 'next';
import styles from './LogIn.module.css';
import { Box, Link, Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import { FormEvent, useState } from 'react';
import Button from '@mui/material/Button';
import { useRouter } from 'next/router';
import { setToken } from '../../utils';

const LogIn: NextPage = () => {
  let [zid, setZid] = useState('');
  let [password, setPassword] = useState('');
  let [error, setError] = useState({
    zid: '',
    password: '',
  });
  let router = useRouter();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const basicAuth = Buffer.from(`${zid}:${password}`).toString('base64');
    let res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
        }
      });
    let response = await res.json();
    if (!res.ok) {
      setError(response);
      return;
    }
    setError({
      zid: '',
      password: '',
    });
    setToken(response);
    router.push('/dashboard');

  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Typography variant='h1' className={styles.title}>Log in to Syphon</Typography>
        <Box component='form' className={styles.form} onSubmit={submit}>
          <TextInput className={styles.formInput} label='zID' value={zid} setValue={setZid} error={error.zid} />
          <TextInput className={styles.formInput} label='Password' value={password} setValue={setPassword} type='password' error={error.password} />
          <Button type='submit' variant='contained' className={styles.button}> Log in </Button>
        </Box>
        <Typography className={styles.accountText}>Don’t have an account? <Link className={styles.signUp} href='/sign-up'></Link></Typography>
      </main>
    </div>
  );
};

export default LogIn;
