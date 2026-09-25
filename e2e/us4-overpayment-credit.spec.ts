import { test, expect } from "@playwright/test";

test.describe("User Story 4: Overpayment Creates Credit", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/payments");
  });

  test("should create credit when payment exceeds outstanding balance", async ({
    page,
  }) => {
    await page.fill('input[placeholder=""]', "client-123");
    await page.fill('input[type="number"]', "500");
    await page.selectOption("select", "bank_transfer");
    await page.click('button:has-text("Record Payment")');

    await expect(page.locator("text=credit")).toBeVisible();
  });
});