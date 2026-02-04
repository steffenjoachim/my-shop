const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Collect console messages
  page.on("console", (msg) => {
    console.log("[BROWSER CONSOLE]", msg.type(), msg.text());
  });

  page.on("pageerror", (err) => {
    console.error("[PAGE ERROR]", err.toString());
  });

  try {
    await page.goto("http://localhost:52312/product-management", {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for product cards to appear
    await page.waitForSelector("app-product-management-card", {
      timeout: 15000,
    });

    // Click the first Bearbeiten button
    const editButton = await page.$("app-product-management-card button");
    if (!editButton) {
      console.error("No edit button found");
      await browser.close();
      process.exit(2);
    }

    console.log("Clicking edit button...");
    await editButton.click();

    // Wait for navigation to product form - look for product form heading
    await page.waitForSelector("app-product-form h1", { timeout: 15000 });
    console.log("Product form loaded");

    // Let any async console errors appear
    await page.waitForTimeout(2000);
  } catch (err) {
    console.error("Test failed", err);
    await browser.close();
    process.exit(1);
  }

  await browser.close();
  console.log("Test completed successfully");
  process.exit(0);
})();
