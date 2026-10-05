import request from "supertest";

const password = "MomntGuest!2026";

export async function asMember(app, customer) {
  const agent = request.agent(app);
  let response = await agent.post("/api/auth/signup").send({ ...customer, password });
  if (response.status === 409) {
    response = await agent.post("/api/auth/login").send({ email: customer.email, password });
  }
  if (response.status !== 201 && response.status !== 200) {
    throw new Error(`Member sign-in failed with status ${response.status}`);
  }
  return { agent, csrf: response.body.csrfToken };
}
