import { Locator, Page } from '@playwright/test';

export class LoginPage {
    // Explicitly defining types for the page and elements
    readonly page: Page;
    readonly usernameInput: Locator;
    readonly passwordInput: Locator;
    readonly loginButton: Locator;
    readonly errorMessage: Locator;

    constructor(page: Page) {
        this.page = page;
        // Defining locators using data-test attributes for resilience
        this.usernameInput = page.locator('[data-test="username"]');
        this.passwordInput = page.locator('[data-test="password"]');
        this.loginButton = page.locator('[data-test="login-button"]');
        this.errorMessage = page.locator('[data-test="error"]');
    }

    /**
     * Navigates to the base URL
     */
    async goto(): Promise<void> {
        await this.page.goto('/');
    }

    /**
     * Performs the login action
     * @param user - The username string
     * @param pass - The password string
     */
    async login(user: string, pass: string): Promise<void> {
        await this.usernameInput.fill(user);
        await this.passwordInput.fill(pass);
        await this.loginButton.click();
    }
}