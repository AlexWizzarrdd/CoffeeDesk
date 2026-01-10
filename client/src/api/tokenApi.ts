export const getToken = (type: 'access' | 'refresh') => {
  return localStorage.getItem(type);
};

export const setToken = (token: string, type: 'access' | 'refresh') => {
  localStorage.setItem(type, token);
};

export const setTokens = (access: string, refresh: string) => {
  setToken(access, 'access');
  setToken(refresh, 'refresh');
};

export const clearTokens = () => {
  localStorage.removeItem('access');
  localStorage.removeItem('refresh');
};