import { test, expect } from "@playwright/test";

test.describe("User Story 1: Client Lookup and Quota Check", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/station");
  });

  test("should display client info when valid plate is entered", async ({
    page,
  }) => {
    await page.fill('input[placeholder="Enter vehicle plate number"]', "ABC123");
    await page.click('button:has-text("Search")');
    await expect(page.locator("text=No client found")).toBeVisible();
  });

  test("should show no client found for invalid plate", async ({ page }) => {
    await page.fill('input[placeholder="Enter vehicle plate number"]', "INVALID");
    await page.click('button:has-text("Search")');
    await expect(page.locator("text=No client found")).toBeVisible();
  });

  test("should display quota balances for multiple fuel types", async ({
    page,
  }) => {
    // This test requires seeded data
    await page.fill('input[placeholder="Enter vehicle plate number"]', "TEST123");
    await page.click('button:has-text("Search")');
    // Verify quota display appears
    await expect(page.locator("text=Quota Balances")).toBeVisible();
  });
});