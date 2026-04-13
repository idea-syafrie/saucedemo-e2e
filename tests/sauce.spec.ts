import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { ProductDetailsPage } from '../pages/ProductDetailsPage';
import { CheckoutOverviewPage } from '../pages/CheckoutOverviewPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutCompletePage } from '../pages/CheckoutCompletePage';
import { CheckoutStepTwoPage } from '../pages/CheckoutStepTwoPage';
import { CheckoutStepOnePage } from '../pages/CheckoutStepOnePage';
import data from '../test-data.json';
// import { UserData } from '../utils/TestData';

/**
 * E2E Suite: Validates core functionality of the SauceDemo application.
 * Uses descriptive test blocks for better reporting visibility.
 */
test.describe('SauceDemo E2E Workflow', () => {

    // Global setup: ensure the page is at the correct URL before every test.
    test.beforeEach(async ({ page }) => {
        await page.goto('/');
    });

    test('TC-01: Valid Login', async ({ page }) => {
        // setup pages
        const loginPage = new LoginPage(page);

        // login
        await loginPage.login(data.users.standard.username, data.users.standard.password);

        // Asserting the URL is a standard way to verify navigation.
        await expect(page).toHaveURL(/.*inventory.html/);
    });

    test('TC-02: Verify Inventory Items', async ({ page }) => {
        // setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);

        await test.step('Login to Web', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
        });

        // Asserting the inventory items are visible
        await test.step('Show All Inventory Items', async () => {
            await expect(inv.inventoryItems.first()).toBeVisible();
            expect(await inv.inventoryItems.count()).toBeGreaterThan(0);
        });
    });

    test('TC-03: Add Item to Cart', async ({ page }) => {
        // setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);

        // login
        await test.step('Login to Web', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
        });

        await test.step('Add Items to Cart', async () => {
            // Add item to cart with specific name
            const backpackButton = inv.getAddToCartButton('Sauce Labs Backpack');
            await backpackButton.click();

            // Verify the cart badge
            await expect(inv.cartBadge).toHaveText('1');

            const bikeLightButton = inv.getAddToCartButton('Sauce Labs Bike Light');
            await bikeLightButton.click();

            // Verify the cart badge
            await expect(inv.cartBadge).toHaveText('2');
        });
    });

    test('TC-04: Product Sorting - Price (Low to High)', async ({ page }) => {
        // setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);

        // login
        await test.step('Login and Select Sort Option', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
            // Select the 'lohi' option (Price low to high)
            await inv.sortDropdown.selectOption(data.sorting.lowToHigh);
        });

        // verify price order
        await test.step('Verify Price Order', async () => {
            // Capture all prices from the page
            const priceElements = await inv.itemPrices.allTextContents();

            // Clean the strings (remove '$') and convert to numbers
            const prices = priceElements.map(p => parseFloat(p.replace('$', '')));

            // Create a sorted copy of the array to compare against
            const sortedPrices = [...prices].sort((a, b) => a - b);

            // Assert that the page order matches the mathematically sorted order
            expect(prices).toEqual(sortedPrices);
        });
    });

    test('TC-05: Purchase Flow', async ({ page }) => {
        // setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);
        const checkoutStepOnePage = new CheckoutStepOnePage(page);
        const cartPage = new CartPage(page);
        const checkoutStepTwoPage = new CheckoutStepTwoPage(page);
        const checkoutCompletePage = new CheckoutCompletePage(page);

        //login
        await test.step('Login to Web', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
        });

        // select product
        const product = data.products.backpack;

        //add item to cart
        await test.step('Add Items to Cart', async () => {
            const backpackButton = inv.getAddToCartButton(product.name);
            await backpackButton.click();
        });

        //go to cart
        await test.step('Checkout Cart', async () => {
            await inv.cartLink.click();
            const item = cartPage.getCartItem(product.name);

            // --- VERIFY CART CONTENT ---
            // 1. Verify we are actually on the Cart page
            await expect(page).toHaveURL(/.*cart.html/);

            // 2. Validate Sauce Labs Backpack (Name and Price)
            await expect(item.locator('[data-test="inventory-item-name"]')).toHaveText(product.name);
            await expect(item.locator('[data-test="inventory-item-price"]')).toHaveText(`$${product.price}`);

            // 3. Validate quantity is 1
            await expect(item.locator('[data-test="item-quantity"]')).toHaveText('1');

            // 4. Proceed to checkout
            await cartPage.proceedToCheckout();
        });

        //verify checkout step one
        await test.step('Checkout Step One', async () => {
            await expect(page).toHaveURL(/.*checkout-step-one.html/);
            await checkoutStepOnePage.firstNameInput.waitFor({ state: 'visible' });

            // Simulating user input for the checkout form.
            await checkoutStepOnePage.fillForm(
                data.checkout.firstName,
                data.checkout.lastName,
                data.checkout.postalCode
            );
        });

        // Confirm successful navigation to the final step of checkout.
        await test.step('Checkout Step Two and Finish Purchase', async () => {
            await expect(page).toHaveURL(/.*checkout-step-two.html/);

            // 1. Get numeric values from the UI
            const uiSubtotal = await checkoutStepTwoPage.getAmountFromLabel(checkoutStepTwoPage.subtotalLabel);
            const uiTax = await checkoutStepTwoPage.getAmountFromLabel(checkoutStepTwoPage.taxLabel);
            const uiTotal = await checkoutStepTwoPage.getAmountFromLabel(checkoutStepTwoPage.totalLabel);

            // 2. ASSERT PRICE: Verify Subtotal matches our JSON truth
            // This confirms the UI is showing the correct price for the Backpack
            expect(uiSubtotal).toBe(product.price);

            // 3. ASSERT TAX & TOTAL: Dynamic Math Validation
            // This confirms the system's internal calculator is working
            const expectedTotal = uiSubtotal + uiTax;

            // We use toBeCloseTo because of how JavaScript handles decimal math
            expect(uiTotal).toBeCloseTo(expectedTotal, 2);

            // 4. Finish checkout
            await checkoutStepTwoPage.finishPurchase();

            // 5. Verify completion
            await expect(page).toHaveURL(/.*checkout-complete.html/);
            await expect(checkoutCompletePage.thankYouHeader).toHaveText(data.messages.checkout_complete);
        });
    });

    test('TC-06: Purchase Multiple Item', async ({ page }) => {
        // setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);
        const checkoutStepOnePage = new CheckoutStepOnePage(page);
        const cartPage = new CartPage(page);
        const checkoutStepTwoPage = new CheckoutStepTwoPage(page);
        const checkoutCompletePage = new CheckoutCompletePage(page);

        //Login
        await test.step('Login to Web', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
        });

        // select multiple product
        const productsToBuy = [
            data.products.backpack,
            data.products.bikeLight
        ];

        //add item to cart
        await test.step('Add Items to Cart', async () => {
            for (const product of productsToBuy) {
                // We use the 'name' from our JSON to find the correct button dynamically
                const addToCartButton = inv.getAddToCartButton(product.name);
                await addToCartButton.click();
            }
        });

        //Go to cart
        await test.step('Checkout Cart', async () => {
            await inv.cartLink.click();

            // --- VERIFY CART CONTENT ---
            for (const product of productsToBuy) {
                // Find the specific row for this product
                const itemRow = cartPage.getCartItem(product.name);

                // 1. Validate Name
                await expect(itemRow.locator('[data-test="inventory-item-name"]'))
                    .toHaveText(product.name);

                // 2. Validate Price (adding the $ sign)
                await expect(itemRow.locator('[data-test="inventory-item-price"]'))
                    .toHaveText(`$${product.price}`);

                // 3. Validate Quantity
                await expect(itemRow.locator('[data-test="item-quantity"]'))
                    .toHaveText('1');
            }
            // 4. Proceed to checkout
            await cartPage.proceedToCheckout();
        });

        //verify checkout step one
        await test.step('Checkout Step One', async () => {
            await expect(page).toHaveURL(/.*checkout-step-one.html/);
            await checkoutStepOnePage.firstNameInput.waitFor({ state: 'visible' });

            // Simulating user input for the checkout form.
            await checkoutStepOnePage.fillForm(
                data.checkout.firstName,
                data.checkout.lastName,
                data.checkout.postalCode
            );
        });

        // Confirm successful navigation to the final step of checkout.
        await test.step('Checkout Step Two and Finish Purchase', async () => {
            await expect(page).toHaveURL(/.*checkout-step-two.html/);

            // . DYNAMIC MATH VALIDATION (The "Robustness" part)
            await test.step('Verify Dynamic Totals Calculation', async () => {
                await expect(page).toHaveURL(/.*checkout-step-two.html/);

                // Get numeric values from the UI using the method we created
                const uiSubtotal = await checkoutStepTwoPage.getAmountFromLabel(checkoutStepTwoPage.subtotalLabel);
                const uiTax = await checkoutStepTwoPage.getAmountFromLabel(checkoutStepTwoPage.taxLabel);
                const uiTotal = await checkoutStepTwoPage.getAmountFromLabel(checkoutStepTwoPage.totalLabel);

                // Calculate expected values based on our JSON data
                const expectedSubtotal = data.products.backpack.price + data.products.bikeLight.price;
                const expectedTotalCalculated = uiSubtotal + uiTax;

                // Assertion 1: Verify UI Subtotal matches our Data Data
                expect(uiSubtotal).toBe(expectedSubtotal);

                // Assertion 2: Verify UI Total matches (Subtotal + Tax)
                // Using toBeCloseTo to handle potential floating point math issues in JS
                expect(uiTotal).toBeCloseTo(expectedTotalCalculated, 2);
            });

            //finish checkout
            await checkoutStepTwoPage.finishPurchase();

            //verify checkout complete
            await expect(page).toHaveURL(/.*checkout-complete.html/);
            await expect(checkoutCompletePage.thankYouHeader).toHaveText(data.messages.checkout_complete);
        });
    });

    test('TC-07: Invalid Login', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.login(data.users.standard.username, 'wrongpassword');

        // Asserting the URL is a standard way to verify navigation.
        await expect(loginPage.errorMessage).toHaveText(data.messages.invalid_login);
    });

    test('TC-08: Locked Out User', async ({ page }) => {
        const loginPage = new LoginPage(page);
        await loginPage.login(data.users.locked.username, data.users.locked.password);

        // Asserting the URL is a standard way to verify navigation.
        await expect(loginPage.errorMessage).toHaveText(data.messages.locked_out_user);
    });

    test('TC-09: Purchase Flow with Problem User', async ({ page }) => {
        //  Mark as expected failure due to the known bug
        test.fail(true, 'Known Bug: Problem user cannot complete checkout due to Last Name field issues.');

        // setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);
        const checkoutStepOnePage = new CheckoutStepOnePage(page);
        const cartPage = new CartPage(page);

        //login
        await test.step('Login to Web', async () => {
            await loginPage.login(data.users.problem.username, data.users.problem.password);
        });

        // select product
        const product = data.products.backpack;

        //add item to cart
        await test.step('Add Items to Cart', async () => {
            const backpackButton = inv.getAddToCartButton(product.name);
            await backpackButton.click();
        });

        //go to cart
        await test.step('Checkout Cart', async () => {
            await inv.cartLink.click();
            const item = cartPage.getCartItem(product.name);

            // --- VERIFY CART CONTENT ---
            // 1. Verify we are actually on the Cart page
            await expect(page).toHaveURL(/.*cart.html/);

            // 2. Validate Sauce Labs Backpack (Name and Price)
            await expect(item.locator('[data-test="inventory-item-name"]')).toHaveText(product.name);
            await expect(item.locator('[data-test="inventory-item-price"]')).toHaveText(`$${product.price}`);

            // 3. Validate quantity is 1
            await expect(item.locator('[data-test="item-quantity"]')).toHaveText('1');

            // 4. Proceed to checkout
            await cartPage.proceedToCheckout();
        });

        //verify checkout step one
        await test.step('Attempt to Fill Information', async () => {
            // Use checkout data from your JSON
            await checkoutStepOnePage.firstNameInput.fill(data.checkout.firstName);
            await checkoutStepOnePage.lastNameInput.fill(data.checkout.lastName);

            // This is the assertion that will trigger the 'expected failure'
            await expect(checkoutStepOnePage.lastNameInput).toHaveValue(data.checkout.lastName);

            await checkoutStepOnePage.postalCodeInput.fill(data.checkout.postalCode);
            await checkoutStepOnePage.continueButton.click();
        });
    });
    test('TC-10: Standard User - Access About Page', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);

        //login
        await test.step('Login and Open Menu', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
            await inv.menuButton.click();
        });

        //navigate to about page
        await test.step('Navigate to About Page', async () => {
            await inv.aboutLink.click();

            // Assert that the user is navigated to the external Sauce Labs site
            await expect(page).toHaveURL(/.*saucelabs.com\//);
        });
    });

    test('TC-11: Problem User - Access About Page', async ({ page }) => {
        //  Mark as expected failure due to the known bug
        test.fail(true, 'Known Bug: The About link in the sidebar is broken/misconfigured for this user role.');

        //setup pages
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);

        //login
        await test.step('Login and Open Menu', async () => {
            await loginPage.login(data.users.problem.username, data.users.problem.password);
            await inv.menuButton.click();
        });

        //navigate to about page
        await test.step('Attempt Navigate to About Page', async () => {
            // We expect this to fail or not navigate correctly for the problem_user
            await inv.aboutLink.click();

            // In a perfect world, we would navigate to saucelabs.com.
            // For problem_user, let's assert that it fails to navigate correctly.
            await expect(page).not.toHaveURL(/.*saucelabs.com\//);
        });
    });

    test('TC-12: Logout Functionality', async ({ page }) => {
        const loginPage = new LoginPage(page);
        const inv = new InventoryPage(page);

        //login
        await test.step('Login and Open Menu', async () => {
            await loginPage.login(data.users.standard.username, data.users.standard.password);
            await inv.menuButton.click();
        });

        //logout
        await test.step('Perform Logout', async () => {
            // Using the logoutLink locator we added to your Page Object
            await inv.logoutLink.click();
        });

        await test.step('Verify Redirection to Login Page', async () => {
            // Verify URL is back to the base root
            await expect(page).toHaveURL(/.*saucedemo.com\//);

            // Security Check: Verify username field is visible (meaning session is cleared)
            await expect(loginPage.usernameInput).toBeVisible();
        });

    });

});
