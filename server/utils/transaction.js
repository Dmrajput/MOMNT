import mongoose from "mongoose";

export function withSession(session) {
  return session ? { session } : {};
}

export async function withTransaction(work) {
  let session;
  try {
    session = await mongoose.startSession();
    let result;
    await session.withTransaction(async () => {
      result = await work(session);
    });
    return result;
  } catch (error) {
    const message = String(error?.message || "");
    if (
      message.includes("replica set") ||
      message.includes("Transaction numbers are only allowed")
    ) {
      return work(null);
    }
    throw error;
  } finally {
    if (session) await session.endSession();
  }
}
