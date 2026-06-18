export const USER_TOKEN_KEY = 'jobPortalToken'
export const EMPLOYER_TOKEN_KEY = 'employerToken'
export const ADMIN_TOKEN_KEY = 'adminToken'

export const setToken = (key, token) => localStorage.setItem(key, token)
export const getToken = (key) => localStorage.getItem(key)
export const removeToken = (key) => localStorage.removeItem(key)

export const authHeader = (key) => {
  const token = getToken(key)
  return token ? { Authorization: `Bearer ${token}` } : {}
}

export const isTokenExpired = (token) => {
  if (!token) return true
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    return payload.exp * 1000 < Date.now()
  } catch {
    return true
  }
}
