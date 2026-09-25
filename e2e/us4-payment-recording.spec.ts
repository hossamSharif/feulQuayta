import { test, expect } from "@playwright/test";

test.describe("User Story 4: Payment Recording", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/admin/payments");
  });

  test("should reduce outstanding balance by payment amount", async ({
    page,
  }) => {
    await page.fill('input[placeholder=""]', "client-123");
    await page.fill('input[type="number"]', "200");
    await page.selectOption("select", "cash");
    await page.click('button:has-text("Record Payment")');

    await expect(page.locator("text=outstanding balance")).toBeVisible();
  });

  test("should set outstanding balance to zero for overpayment", async ({
    page,
  }) => {
    await page.fill('input[placeholder=""]', "client-123");
    await page.fill('input[type="number"]', "150");
    await page.selectOption("select", "card");
    await page.click('button:has-text("Record Payment")');

    await expect(page.locator("text=credit")).toBeVisible();
  });
});