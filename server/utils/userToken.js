import jwt from "jsonwebtoken";
import { authCookieOptions, createCsrfToken, csrfCookieOptions, getJwtSecret } from "./adminToken.js";

const TOKEN_TTL = "8h";

export function signUserToken(user) {
  return jwt.sign(
    { sub: String(user._id), tv: user.tokenVersion || 0 },
    getJwtSecret(),
    { expiresIn: TOKEN_TTL, issuer: "momnt-user" },
  );
}

export function readUserToken(token) {
  try {
    return jwt.verify(token, getJwtSecret(), { issuer: "momnt-user" });
  } catch {
    return null;
  }
}

export { authCookieOptions, createCsrfToken, csrfCookieOptions };
