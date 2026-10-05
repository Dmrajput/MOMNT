import { loginUser, presentUser, registerUser } from "../services/userAuthService.js";
import { authCookieOptions, createCsrfToken, csrfCookieOptions, signUserToken } from "../utils/userToken.js";

const AUTH_COOKIE = "momnt_user";
const CSRF_COOKIE = "momnt_user_csrf";

function setUserCookies(res, user) {
  const csrfToken = createCsrfToken();
  res.cookie(AUTH_COOKIE, signUserToken(user), authCookieOptions());
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  return csrfToken;
}

export function clearUserCookies(res) {
  res.clearCookie(AUTH_COOKIE, { ...authCookieOptions(), maxAge: 0 });
  res.clearCookie(CSRF_COOKIE, { ...csrfCookieOptions(), maxAge: 0 });
}

export async function postSignup(req, res) {
  const user = await registerUser(req.validated.body);
  const csrfToken = setUserCookies(res, user);
  res.status(201).json({ success: true, user: presentUser(user), csrfToken });
}

export async function postLogin(req, res) {
  const user = await loginUser(req.validated.body);
  const csrfToken = setUserCookies(res, user);
  res.json({ success: true, user: presentUser(user), csrfToken });
}

export function postLogout(req, res) {
  clearUserCookies(res);
  res.json({ success: true });
}

export function showMe(req, res) {
  let csrfToken = req.cookies?.[CSRF_COOKIE];
  if (!csrfToken) {
    csrfToken = createCsrfToken();
    res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  }
  res.json({ success: true, user: presentUser(req.user), csrfToken });
}
