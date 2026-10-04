import { loginAdmin, presentAdmin } from "../services/adminAuthService.js";
import { recordAdminAudit } from "../utils/adminQuery.js";
import { authCookieOptions, createCsrfToken, csrfCookieOptions, signAdminToken } from "../utils/adminToken.js";

const AUTH_COOKIE = "momnt_admin";
const CSRF_COOKIE = "momnt_admin_csrf";

export function setAdminCookies(res, admin) {
  const csrfToken = createCsrfToken();
  res.cookie(AUTH_COOKIE, signAdminToken(admin), authCookieOptions());
  res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  return csrfToken;
}

export function clearAdminCookies(res) {
  const expired = { ...authCookieOptions(), maxAge: 0 };
  res.clearCookie(AUTH_COOKIE, expired);
  res.clearCookie(CSRF_COOKIE, { ...csrfCookieOptions(), maxAge: 0 });
}

export async function postLogin(req, res) {
  const admin = await loginAdmin({ email: req.validated.body.email, password: req.validated.body.password, req });
  const csrfToken = setAdminCookies(res, admin);
  res.json({ success: true, admin: presentAdmin(admin), csrfToken });
}

export async function postLogout(req, res) {
  await recordAdminAudit({
    adminId: req.admin._id,
    action: "ADMIN_LOGOUT",
    resourceType: "admin",
    resourceId: String(req.admin._id),
    req,
  });
  clearAdminCookies(res);
  res.json({ success: true });
}

export function showMe(req, res) {
  let csrfToken = req.cookies?.[CSRF_COOKIE];
  if (!csrfToken) {
    csrfToken = createCsrfToken();
    res.cookie(CSRF_COOKIE, csrfToken, csrfCookieOptions());
  }
  res.json({ success: true, admin: presentAdmin(req.admin), csrfToken });
}
