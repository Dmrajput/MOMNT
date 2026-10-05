import User from "../models/User.js";
import { AppError } from "../utils/errors.js";
import { readUserToken } from "../utils/userToken.js";

export async function userAuth(req, res, next) {
  try {
    const token = req.cookies?.momnt_user;
    const payload = token ? readUserToken(token) : null;
    if (!payload?.sub) {
      throw new AppError("UNAUTHORIZED", "Sign in to reserve your MOMNT.", 401);
    }
    const user = await User.findById(payload.sub);
    if (!user || user.status !== "active" || (user.tokenVersion || 0) !== (payload.tv || 0)) {
      throw new AppError("UNAUTHORIZED", "Sign in to reserve your MOMNT.", 401);
    }
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
}
