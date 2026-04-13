import { Locator, Page } from '@playwright/test';

/**
 * Handles the "Checkout: Overview" step where users verify items and price.
 */
export class CheckoutStepTwoPage {
    readonly page: Page;
    readonly cartItems: Locator;
    readonly subtotalLabel: Locator;
    readonly taxLabel: Locator;
    readonly totalLabel: Locator;
    readonly finishButton: Locator;

    constructor(page: Page) {
        this.page = page;
        this.cartItems = page.locator('[data-test="inventory-item"]');
        this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
        this.taxLabel = page.locator('[data-test="tax-label"]');
        this.totalLabel = page.locator('[data-test="total-label"]');
        this.finishButton = page.locator('[data-test="finish"]');
    }

    /**
     * Extracts only the numeric value from labels like "Item total: $39.98"
     */
    async getAmountFromLabel(locator: Locator): Promise<number> {
        const text = await locator.innerText();
        // Uses regex to find the number after the '$' sign
        const amount = text.split('$')[1];
        return parseFloat(amount);
    }

    async finishPurchase(): Promise<void> {
        await this.finishButton.click();
    }
}