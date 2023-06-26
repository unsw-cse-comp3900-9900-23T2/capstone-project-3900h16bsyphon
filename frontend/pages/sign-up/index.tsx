import type { NextPage } from 'next';
import Link from 'next/link';
import styles from './SignIn.module.css';
import { FormGroup, Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import { useState } from 'react';
import Button from '../../components/Button';
import { useRouter } from 'next/router';
import { setToken } from '../../utils';

const SignIn: NextPage = () => {
  let [zid, setZid] = useState('');
  let [password, setPassword] = useState('');
  let [confirmPassword, setConfirmPassword] = useState('');
  let [firstName, setFirstName] = useState('');
  let [lastName, setLastName] = useState('');
  let [error, setError] = useState('');
  let router = useRouter();

  const submit = async () => {
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
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
    let response = await res.text();
    if (!res.ok) {
      setError(response);
      return;
    }
    setError('');
    // sign in directly
    let loginRes = await fetch(
      `${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          Authorization: 'Basic ' + Buffer.from(zid + ':' + password).toString('base64'),
        }
      });

    if (!loginRes.ok) {
      setError('Failed to sign in, please try signing in manually');
      return;
    }
    let loginResponse = await loginRes.text();
    setToken(loginResponse.replace(/"/g, ''));
    router.push('/dashboard');
  };

  return (
    <div className={styles.container}>
      <main className={styles.main}>
        <Typography variant='h1' className={styles.title}>Syphon</Typography>
        <Typography variant='h3'>Sign up to start attending help sessions</Typography>
        <FormGroup className={styles.form}>
          <TextInput label='First Name' value={firstName} setValue={setFirstName} />
          <TextInput label='Last Name' value={lastName} setValue={setLastName} />
          <TextInput label='zId' value={zid} setValue={setZid} />
          <TextInput label='Password' value={password} setValue={setPassword} type='password' />
          <TextInput label='Confirm Password' value={confirmPassword} setValue={setConfirmPassword} type='password' />
        </FormGroup>
        {error && <Typography className={styles.error}>{error}</Typography>}
        <Button onClick={submit} variant='contained'> Sign up </Button>
        <Typography className={styles.accountText}>Have an account? <Link className={styles.logIn} href='/log-in'>Log in</Link></Typography>
      </main>
    </div>
  );
};

export default SignIn;
