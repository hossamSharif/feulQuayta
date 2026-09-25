import { test, expect } from "@playwright/test";

test.describe("User Story 2: Offline Fill-up Queue and Sync", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/station");
  });

  test("should queue fill-up when offline for single-station client", async ({
    page,
  }) => {
    // Simulate offline
    await page.context().setOffline(true);

    await page.fill('input[placeholder="Enter vehicle plate number"]', "ABC123");
    await page.click('button:has-text("Search")');
    await expect(page.locator("text=Quota Balances")).toBeVisible();

    await page.selectOption("select", "diesel");
    await page.fill('input[placeholder="0.00"]', "25");
    await page.click('button:has-text("Record Fill-up")');

    // Should show offline queue message
    await expect(page.locator("text=queued")).toBeVisible();

    // Go back online
    await page.context().setOffline(false);
  });

  test("should sync queued fill-ups when reconnected", async ({ page }) => {
    // This test requires previous queued items
    await page.goto("/station");

    // Check for sync indicator
    await expect(page.locator("text=sync")).toBeVisible();
  });
});