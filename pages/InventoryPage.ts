import { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Inventory page.
 * Contains selectors for navigation, sorting, and product management.
 */
export class InventoryPage {
    readonly page: Page;

    // Header Elements
    readonly cartLink: Locator;
    readonly cartBadge: Locator;
    readonly menuButton: Locator;
    readonly sortDropdown: Locator;

    // Product Elements
    readonly inventoryItems: Locator;
    readonly itemNames: Locator;
    readonly itemPrices: Locator;
    readonly addToCartButtons: Locator;

    // Menu Items
    readonly aboutLink: Locator;
    readonly logoutLink: Locator;
    readonly resetAppStateLink: Locator;

    constructor(page: Page) {
        this.page = page;

        // Header & Navigation
        this.cartLink = page.locator('.shopping_cart_link');
        this.cartBadge = page.locator('.shopping_cart_badge');
        this.menuButton = page.locator('#react-burger-menu-btn');
        this.sortDropdown = page.locator('[data-test="product-sort-container"]');

        // Product List (Grouped for easy iteration)
        this.inventoryItems = page.locator('.inventory_item');
        this.itemNames = page.locator('.inventory_item_name');
        this.itemPrices = page.locator('.inventory_item_price');
        this.addToCartButtons = page.locator('[data-test^="add-to-cart"]');

        // Menu Items
        this.aboutLink = page.locator('#about_sidebar_link');
        this.logoutLink = page.locator('#logout_sidebar_link');
        this.resetAppStateLink = page.locator('#reset_sidebar_link');

    }

    /**
     * Sorts the inventory by a specific option (e.g., 'lohi', 'hilo', 'az', 'za')
     */
    async sortProducts(option: string): Promise<void> {
        await this.sortDropdown.selectOption(option);
    }

    /**
     * Returns a locator for an 'Add to Cart' button based on the product name
     */
    getAddToCartButton(productName: string): Locator {
        // This targets the specific name element exactly, then grabs the button in the same container
        return this.page.locator(`.inventory_item:has(.inventory_item_name:text("${productName}")) >> button`);
    }
}