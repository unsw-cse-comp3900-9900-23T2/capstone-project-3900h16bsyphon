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

export const getToken = () => getCookie('token');

export const setToken = (token: string) => setCookie('token', token);
