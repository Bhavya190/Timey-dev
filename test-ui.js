const { chromium } = require('playwright');
const assert = require('assert');

(async () => {
    // Setup
    const browser = await chromium.launch();
    const page = await browser.newPage();

    try {
        // Go to login page
        await page.goto('http://localhost:3000');

        // Log in
        await page.fill('input[type="email"]', 'admin@timey.com');
        await page.fill('input[type="password"]', 'password123');
        await page.click('button[type="submit"]');

        // Wait for redirect to admin dash
        await page.waitForTimeout(2000);

        // Go to Employees
        await page.goto('http://localhost:3000/admin/employees');
        await page.waitForTimeout(1000);

        // Click Add Employee
        await page.click('text="+ Add Employee"');
        await page.waitForTimeout(1000);

        // Basic Info
        await page.fill('input[placeholder="email@example.com"]', 'newguy@timey.com');
        await page.fill('input:below(:text("First Name"))', 'New');
        await page.fill('input:below(:text("Last Name"))', 'Guy');
        await page.fill('input:below(:text("Department"))', 'Tester');

        // Next
        await page.click('text="Next"');
        await page.waitForTimeout(500);

        // Next
        await page.click('button:has-text("Next")');
        await page.waitForTimeout(500);

        // Save
        await page.click('button:has-text("Save")');
        await page.waitForTimeout(2000);

        console.log("Done interactions.");
    } catch (e) {
        console.error("Playwright error:", e);
    }

    await browser.close();
})();
