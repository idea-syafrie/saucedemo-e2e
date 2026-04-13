import { Locator, Page } from '@playwright/test';

/**
 * Page Object Model for the Checkout Overview (Final Step).
 */
export class CheckoutOverviewPage {
    readonly page: Page;

    // Total elements
    readonly subtotalLabel: Locator;
    readonly taxLabel: Locator;
    readonly totalLabel: Locator;
    readonly finishButton: Locator;

    constructor(page: Page) {
        this.page = page;

        // Use data-test where available
        this.subtotalLabel = page.locator('[data-test="subtotal-label"]');
        this.taxLabel = page.locator('[data-test="tax-label"]');
        this.totalLabel = page.locator('[data-test="total-label"]');
        this.finishButton = page.locator('[data-test="finish"]');
    }

    /**
     * Helper to verify if the Total label contains the expected text.
     * Format: "Total: $XX.XX"
     */
    async getTotalValue(): Promise<string | null> {
        return await this.totalLabel.textContent();
    }
}