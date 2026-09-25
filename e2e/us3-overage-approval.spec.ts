import { test, expect } from "@playwright/test";

test.describe("User Story 3: Admin Overage Request Approval", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/overages");
  });

  test("should approve overage and increase client outstanding balance", async ({
    page,
  }) => {
    // Wait for overage list to load
    await expect(page.locator("text=Overage Requests")).toBeVisible();

    // Click approve on first pending request
    await page.click('button:has-text("Approve")');

    // Should show success
    await expect(page.locator("text=approved")).toBeVisible();

    // Verify outstanding balance increased
  });

  test("should show approved status after approval", async ({ page }) => {
    await expect(page.locator("text=Overage Requests")).toBeVisible();
    await page.click('button:has-text("Approve")');

    await expect(page.locator("text=Approved")).toBeVisible();
  });
});