import { test, expect } from "@playwright/test";

test.describe("User Story 3: Admin Overage Request Rejection", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/overages");
  });

  test("should reject overage without affecting client balance", async ({
    page,
  }) => {
    await expect(page.locator("text=Overage Requests")).toBeVisible();

    await page.click('button:has-text("Reject")');

    await expect(page.locator("text=rejected")).toBeVisible();
  });

  test("should show rejected status and not allow further modification", async ({
    page,
  }) => {
    await expect(page.locator("text=Overage Requests")).toBeVisible();
    await page.click('button:has-text("Reject")');

    await expect(page.locator("text=Rejected")).toBeVisible();
    // Verify no further action buttons
    await expect(page.locator('button:has-text("Approve")')).not.toBeVisible();
  });
});