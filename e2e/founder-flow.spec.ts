import { test, expect } from "@playwright/test";

test("landing page loads", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("data-backed fundraise");
});

test("health endpoint returns ok", async ({ request }) => {
  const response = await request.get("/api/health");
  expect(response.ok()).toBeTruthy();
  const body = await response.json();
  expect(body.status).toBe("ok");
});

test("onboarding page loads", async ({ page }) => {
  await page.goto("/onboarding");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("fundraise profile");
});
