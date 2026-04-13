import { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Shopping Cart page.
 * Handles validation of added items and navigation to checkout.
 */
export class CartPage {
    readonly page: Page;

    // Header and Navigation
    readonly title: Locator;
    readonly cartBadge: Locator;
    readonly continueShoppingButton: Locator;
    readonly checkoutButton: Locator;

    // Cart List Elements
    readonly cartItems: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header & Titles
        this.title = page.locator('[data-test="title"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');

        // Action Buttons
        this.continueShoppingButton = page.locator('[data-test="continue-shopping"]');
        this.checkoutButton = page.locator('[data-test="checkout"]');

        // Item List Selectors
        this.cartItems = page.locator('[data-test="inventory-item"]');
    }

    /**
     * Navigates directly to the cart page.
     */
    async goto(): Promise<void> {
        await this.page.goto('/cart.html');
    }

    /**
     * Clicks the checkout button to proceed to the information step.
     */
    async proceedToCheckout(): Promise<void> {
        await this.checkoutButton.click();
    }

    /**
     * Returns a locator for a specific item row to verify name and price.
     * This is the "Pro" way to handle dynamic lists.
     */
    getCartItem(productName: string): Locator {
        return this.cartItems.filter({ hasText: productName });
    }

    /**
     * Removes a specific item from the cart by its name.
     */
    async removeItemByName(productName: string): Promise<void> {
        await this.getCartItem(productName).locator('[data-test^="remove-"]').click();
    }
}