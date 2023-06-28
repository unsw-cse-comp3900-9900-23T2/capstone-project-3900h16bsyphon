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

export const getToken = () => getCookie('token');

export const setToken = (token: string) => setCookie('token', token);

export function toCamelCase(obj: any) {
  let rtn = obj;
  if (!rtn) {
    return rtn;
  } else if (typeof (obj) === 'object') {
    if (obj instanceof Array) {
      rtn = obj.map(toCamelCase);
    } else {
      rtn = {};
      for (let key in obj) {
        // eslint-disable-next-line no-prototype-builtins
        if (obj.hasOwnProperty(key)) {
          const newKey = key.replace(/(_\w)/g, k => k[1].toUpperCase());
          rtn[newKey] = toCamelCase(obj[key]);
        }
      }
    }
  }
  return rtn;
}
