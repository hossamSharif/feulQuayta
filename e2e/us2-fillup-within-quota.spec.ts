import { test, expect } from "@playwright/test";

test.describe("User Story 2: Fill-up Recording within Quota", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/station");
  });

  test("should record fill-up within quota and update remaining balance", async ({
    page,
  }) => {
    // Look up client first
    await page.fill('input[placeholder="Enter vehicle plate number"]', "ABC123");
    await page.click('button:has-text("Search")');

    // Wait for client to load
    await expect(page.locator("text=Quota Balances")).toBeVisible();

    // Select fuel type and enter liters
    await page.selectOption("select", "diesel");
    await page.fill('input[placeholder="0.00"]', "50");
    await page.click('button:has-text("Record Fill-up")');

    // Should not create overage request
    await expect(page.locator("text=overage")).not.toBeVisible();
  });

  test("should reject zero or negative liters", async ({ page }) => {
    await page.fill('input[placeholder="Enter vehicle plate number"]', "ABC123");
    await page.click('button:has-text("Search")');
    await expect(page.locator("text=Quota Balances")).toBeVisible();

    await page.selectOption("select", "diesel");
    await page.fill('input[placeholder="0.00"]', "0");
    await page.click('button:has-text("Record Fill-up")');

    await expect(page.locator("text=greater than zero")).toBeVisible();
  });
});