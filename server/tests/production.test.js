import assert from "node:assert/strict";
import test from "node:test";
import request from "supertest";

process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test-admin-secret-value";
process.env.CLIENT_URL = "http://localhost:5173";
process.env.MONGODB_URI = "mongodb://localhost:27017/momnt";
process.env.UPI_ID = "test-business@upi";

const { createApp } = await import("../app.js");
const app = createApp();

test("liveness does not depend on the database", async () => {
  const response = await request(app).get("/api/health/live");
  assert.equal(response.status, 200);
  assert.equal(response.body.status, "ok");
  assert.equal(JSON.stringify(response.body).includes("mongodb"), false);
});

test("health reports the environment without secrets", async () => {
  const response = await request(app).get("/api/health");
  assert.equal(response.status, 200);
  assert.equal(response.body.success, true);
  assert.equal(response.body.environment, "test");
  assert.equal(response.body.version, "1.0.0");
  assert.equal(JSON.stringify(response.body).includes("JWT"), false);
});

test("readiness is unavailable until MongoDB is connected", async () => {
  const response = await request(app).get("/api/health/ready");
  assert.equal(response.status, 503);
  assert.equal(response.body.checks.database, "unavailable");
  assert.equal(JSON.stringify(response.body).includes("mongodb://"), false);
});

test("unknown API routes use the shared not-found response", async () => {
  const response = await request(app).get("/api/does-not-exist");
  assert.equal(response.status, 404);
  assert.equal(response.body.error.code, "NOT_FOUND");
  assert.equal(JSON.stringify(response.body).includes("stack"), false);
});

test("admin dashboard is closed to anonymous requests", async () => {
  const response = await request(app).get("/api/admin/dashboard");
  assert.equal(response.status, 401);
  assert.equal(response.body.error.code, "UNAUTHORIZED");
});

test("production CORS allows only configured origins", async () => {
  const previous = process.env.NODE_ENV;
  const previousClient = process.env.CLIENT_URL;
  process.env.NODE_ENV = "production";
  process.env.CLIENT_URL = "https://momnt.example";
  process.env.ADMIN_CLIENT_URL = "https://admin.momnt.example";
  try {
    const productionApp = createApp();
    const blocked = await request(productionApp).get("/api/health/live").set("Origin", "https://evil.example");
    const allowed = await request(productionApp).get("/api/health/live").set("Origin", "https://momnt.example");
    assert.equal(blocked.headers["access-control-allow-origin"], undefined);
    assert.equal(allowed.headers["access-control-allow-origin"], "https://momnt.example");
    assert.equal(Boolean(allowed.headers["strict-transport-security"]), true);
  } finally {
    process.env.NODE_ENV = previous;
    process.env.CLIENT_URL = previousClient;
  }
});
