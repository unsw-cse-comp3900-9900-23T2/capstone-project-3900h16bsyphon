import type { NextPage } from 'next';
import Link from 'next/link';
import styles from './SignUp.module.css';
import { Box, Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import { FormEvent, useState } from 'react';
import { useRouter } from 'next/router';
import Button from '@mui/material/Button';
import { setToken, toCamelCase } from '../../utils';

const LogIn: NextPage = () => {
  const [zid, setZid] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [error, setError] = useState({
    zid: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  const router = useRouter();

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError((oldState) => ({
        ...oldState,
        password: 'Passwords do not match'
      }));
      return;
    } else {
      setError((oldState) => ({
        ...oldState,
        password: ''
      }));
    }

    let res = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: {
          'content-Type': 'application/json',

        },
        body: JSON.stringify({
          first_name : firstName,
          last_name: lastName,
          zid,
          password
        })
      });
    let response = await res.json();
    if (!res.ok) {
      setError(toCamelCase(response));
      return;
    } else {
      setError({
        zid: '',
        password: '',
        firstName: '',
        lastName: ''
      });
    }
    // sign in directly
    let loginRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(zid + ':' + password).toString('base64'),
        }
      });
    let loginResponse = await loginRes.json();
    setToken(loginResponse);
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Typography variant='h1' className={styles.title}>Syphon</Typography>
        <Typography variant='h3'>Sign up to start attending help sessions</Typography>
        <Box component='form' className={styles.form} onSubmit={submit}>
          <TextInput className={styles.formInput} label='First Name' value={firstName} setValue={setFirstName} error={error.firstName} />
          <TextInput className={styles.formInput} label='Last Name' value={lastName} setValue={setLastName} error={error.lastName} />
          <TextInput className={styles.formInput} label='zID' value={zid} setValue={setZid} error={error.zid} />
          <TextInput className={styles.formInput} label='Password' value={password} setValue={setPassword} type='password' error={error.password} />
          <TextInput className={styles.formInput} label='Confirm Password' value={confirmPassword} setValue={setConfirmPassword} type='password' error={error.password} />
          <Button  type='submit' variant='contained' className={styles.button}> Sign up </Button>
        </Box>
        <Typography className={styles.accountText}>Have an account? <Link className={styles.logIn} href='/log-in'>Log in</Link></Typography>
      </main>
    </div>
  );
};

export default LogIn;
