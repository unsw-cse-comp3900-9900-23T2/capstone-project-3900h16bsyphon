import dayjs, { Dayjs } from 'dayjs';
import { Status, Duration } from './types/requests';

const setCookie = (cookieName: string, cookieValue: string) => {
  document.cookie = `${cookieName}=${cookieValue};path=/`;
};

const getCookie = (cookieName: string) => {
  const name = `${cookieName}=`;
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookieArray = decodedCookie.split(';');
  for (let i = 0; i < cookieArray.length; i++) {
    let cookie = cookieArray[i];
    while (cookie.charAt(0) === ' ') {
      cookie = cookie.substring(1);
    }
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length, cookie.length);
    }
  }
  return '';
};

export const authenticatedPostFetch = async (route: string, body: any) => {
  console.log(JSON.stringify(body));
  return fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}${route}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
};

export const authenticatedGetFetch = async (route: string, queryStrings: Record<string, string>) => {
  return fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}${route}?${new URLSearchParams(queryStrings)}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};

export const authenticatedPutFetch = async (route: string, body: any) => {
  return fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}${route}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
    },
    body: JSON.stringify(body),
  });
};

export const authenticatedDeleteFetch = async (route: string, queryStrings: Record<string, string>) => {
  return fetch(`${process.env.NEXT_PUBLIC_BACKEND_API_BASE_URL}${route}?${new URLSearchParams(queryStrings)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
  });
};


export const getToken = () => getCookie('token');

export const setToken = (token: string) => setCookie('token', token);

export const toCamelCase = (obj: any) : any => {
  let rtn = obj;
  if (!rtn || typeof (obj) !== 'object') {
    return rtn;
  }

  if (obj instanceof Array) {
    return obj?.map(toCamelCase);
  }
  // is an object
  rtn = {};
  for (let key in obj) {
    // eslint-disable-next-line no-prototype-builtins
    if (obj.hasOwnProperty(key)) {
      const newKey = key.replace(/(_\w)/g, k => k[1].toUpperCase());
      rtn[newKey] = toCamelCase(obj[key]);
    }
  }
  return rtn;
};

export const formatZid = (id: number) =>`z${id}`.padEnd(8, '0');

export const determineBackgroundColour = (status: Status) => {
  switch (status) {
  case Status.Seen:
    return 'var(--colour-seen)';
  case Status.Unseen:
    return 'white';
  case Status.Seeing:
    return 'var(--colour-seeing)';
  case Status.NotFound:
    return 'var(--colour-notfound)';
  default:
    return 'white';
  }
};

export const changeBackgroundColour = (timeElapsed?: Duration) => {
  if (!timeElapsed) return 'var(--colour-main-red-200)';

  if (timeElapsed.minutes < 10) {
    return 'var(--colour-main-green-200)';
  } else if (timeElapsed.minutes < 15) {
    return 'var(--colour-main-yellow-200)';
  } else if (timeElapsed.minutes < 20) {
    return 'var(--colour-main-orange-200)';
  } else {
    return 'var(--colour-main-red-200)';
  }
};

export const changeTextColour = (timeElapsed?: Duration) => {
  if (!timeElapsed) return 'var(--colour-main-red-200)';

  if (timeElapsed.minutes < 10) {
    return 'var(--colour-main-green-900)';
  } else if (timeElapsed.minutes < 15) {
    return 'var(--colour-main-yellow-900)';
  } else if (timeElapsed.minutes < 20) {
    return 'var(--colour-main-orange-900)';
  } else {
    return 'var(--colour-main-red-900)';
  }
};

export const convertTime = (time?: Date) => {
  if (!time) return '';
  return dayjs(time).format('h:mm A');
};

export const getActualDuration = (duration?: Duration) => {
  if (!duration) return duration;
  const result: Duration = {
    hours: duration.hours,
    minutes: Math.floor(duration.seconds / 60) - (duration.hours * 60),
    seconds: duration.seconds % 60
  };
  return result;
};

export const toBase64 = (file: File) => new Promise((resolve, reject) => {
  const reader = new FileReader();
  reader.readAsDataURL(file);
  reader.onload = () => resolve(reader.result?.toString().split('base64,')[1]);
  reader.onerror = reject;
});

export const createTimeInterval = (startTime: Dayjs, endTime: Dayjs) => {
  const hoursArray = [];
  let currentTime = startTime;

  while (currentTime.isBefore(endTime) || currentTime.isSame(endTime)) {
    hoursArray.push(currentTime.format('h:mm A'));
    currentTime = currentTime.add(1, 'hour');
  }
  return hoursArray;
};
