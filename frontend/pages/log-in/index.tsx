import type { NextPage } from 'next';
import styles from './SignIn.module.css';
import { FormGroup, Link, Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import { useState } from 'react';
import Button from '../../components/Button';
import { useRouter } from 'next/router';
import { setToken } from '../../utils';

const SignIn: NextPage = () => {
  let [zid, setZid] = useState('');
  let [password, setPassword] = useState('');
  let [error, setError] = useState('');
  let router = useRouter();

  const submit = async () => {
    const basicAuth = Buffer.from(`${zid}:${password}`).toString('base64');
    let res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${basicAuth}`,
        }
      });
    let response = await res.text();
    if (!res.ok) {
      setError(response);
      return;
    }
    setError('');
    setToken(response);
    router.push('/dashboard');

  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Typography variant='h1' className={styles.title}>Log in to Syphon</Typography>
        <FormGroup className={styles.form}>
          <TextInput label='zId' value={zid} setValue={setZid} />
          <TextInput label='Password' value={password} setValue={setPassword} type='password' />
        </FormGroup>
        {error && <Typography className={styles.error}>{error}</Typography>}
        <Button onClick={submit} variant='contained'> Log in </Button>
        <Typography className={styles.accountText}>Don’t have an account? <Link className={styles.signUp} href='/sign-up'>Sign up</Link></Typography>
      </main>
    </div>
  );
};

export default SignIn;
