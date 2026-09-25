import { test, expect } from "@playwright/test";

test.describe("User Story 2: Fill-up Exceeding Quota (Overage)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/station");
  });

  test("should create overage request when fill-up exceeds quota", async ({
    page,
  }) => {
    await page.fill('input[placeholder="Enter vehicle plate number"]', "ABC123");
    await page.click('button:has-text("Search")');
    await expect(page.locator("text=Quota Balances")).toBeVisible();

    await page.selectOption("select", "petrol");
    await page.fill('input[placeholder="0.00"]', "1000");
    await page.click('button:has-text("Record Fill-up")');

    await expect(page.locator("text=overage")).toBeVisible();
  });

  test("should still record transaction even when overage", async ({ page }) => {
    await page.fill('input[placeholder="Enter vehicle plate number"]', "ABC123");
    await page.click('button:has-text("Search")');
    await expect(page.locator("text=Quota Balances")).toBeVisible();

    await page.selectOption("select", "petrol");
    await page.fill('input[placeholder="0.00"]', "1000");
    await page.click('button:has-text("Record Fill-up")');

    await expect(page.locator("text=Fill-up recorded")).toBeVisible();
  });
});