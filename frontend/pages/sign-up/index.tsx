import type { NextPage } from 'next';
import Link from 'next/link';
import styles from './SignIn.module.css';
import { FormGroup, Typography } from '@mui/material';
import TextInput from '../../components/TextInput';
import { useState } from 'react';
import Button from '../../components/Button';
import { useRouter } from 'next/router';
import { authenticatedGetFetch, authenticatedPostFetch, setToken } from '../../utils';

const SignIn: NextPage = () => {
  let [zid, setZid] = useState('');
  let [password, setPassword] = useState('');
  let [confirmPassword, setConfirmPassword] = useState('');
  let [firstName, setFirstName] = useState('');
  let [lastName, setLastName] = useState('');
  let [error, setError] = useState({
    zid: '',
    password: '',
    firstName: '',
    lastName: ''
  });
  let router = useRouter();

  const submit = async () => {
    if (password !== confirmPassword) {
      setError((oldState) => ({
        ...oldState,
        password: 'Passwords do not match'
      }));
      return;
    }

    let res = await authenticatedPostFetch('/auth/signup', {
      first_name : firstName,
      last_name: lastName,
      zid,
      password
    });
    if (!res.ok) {
      let response = await res.json();
      if (response.zid.includes('User Already Exists')) {
        setError((oldState) => ({
          ...oldState,
          zid: 'User with this zid already exists.'
        }));
      }
      setError((oldState) => ({
        ...oldState})
      );

      return;
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
        <FormGroup className={styles.form}>
          <TextInput className={styles.formInput} label='First Name' value={firstName} setValue={setFirstName} error={error.firstName} />
          <TextInput className={styles.formInput} label='Last Name' value={lastName} setValue={setLastName} error={error.lastName} />
          <TextInput className={styles.formInput} label='zId' value={zid} setValue={setZid} error={error.zid} />
          <TextInput className={styles.formInput} label='Password' value={password} setValue={setPassword} type='password' error={error.password} />
          <TextInput className={styles.formInput} label='Confirm Password' value={confirmPassword} setValue={setConfirmPassword} type='password' error={error.password} />
        </FormGroup>
        <Button onClick={submit} variant='contained'> Sign up </Button>
        <Typography className={styles.accountText}>Have an account? <Link className={styles.logIn} href='/log-in'>Log in</Link></Typography>
      </main>
    </div>
  );
};

export default SignIn;
