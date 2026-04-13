import { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Product Details view.
 * This page appears when a user clicks on an individual item from the inventory.
 */
export class ProductDetailsPage {
    readonly page: Page;

    // Navigation & Header
    readonly backToProductsButton: Locator;
    readonly cartBadge: Locator;

    // Product Specifics
    readonly productName: Locator;
    readonly productDescription: Locator;
    readonly productPrice: Locator;
    readonly productImage: Locator;

    // Actions
    readonly addToCartButton: Locator;
    readonly removeButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Navigation
        this.backToProductsButton = page.locator('[data-test="back-to-products"]');
        this.cartBadge = page.locator('[data-test="shopping-cart-badge"]');

        // Product Info - Using specific data-test attributes for reliability
        this.productName = page.locator('[data-test="inventory-item-name"]');
        this.productDescription = page.locator('[data-test="inventory-item-desc"]');
        this.productPrice = page.locator('[data-test="inventory-item-price"]');
        this.productImage = page.locator('.inventory_details_img');

        // Action Buttons
        this.addToCartButton = page.locator('[data-test="add-to-cart"]');
        this.removeButton = page.locator('[data-test="remove"]');
    }

    /**
     * Clicks the back button to return to the main inventory page.
     */
    async backToInventory(): Promise<void> {
        await this.backToProductsButton.click();
    }

    /**
     * Adds the item to the cart and verifies the badge updates.
     */
    async addItemToCart(): Promise<void> {
        await this.addToCartButton.click();
    }
}