import { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { msalConfig, loginRequest } from "../config/authConfig";

class AuthService {
  private msalInstance: PublicClientApplication;

  constructor() {
    this.msalInstance = new PublicClientApplication(msalConfig);
  }

  async initialize() {
    await this.msalInstance.initialize();
    // Handle any pending redirect responses to clear interaction state
    await this.msalInstance.handleRedirectPromise();
  }

  async login() {
    try {
      await this.msalInstance.loginRedirect(loginRequest);
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async logout() {
    try {
      await this.msalInstance.logoutRedirect();
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }

  async getAccessToken() {
    const accounts = this.msalInstance.getAllAccounts();
    if (accounts.length === 0) {
      throw new Error("No accounts found");
    }

    const request = {
      ...loginRequest,
      account: accounts[0],
    };

    try {
      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error("Silent token acquisition failed:", error);
      // Fallback to interactive token acquisition using redirect
      await this.msalInstance.acquireTokenRedirect(request);
      return null; // Token will be available after redirect
    }
  }

  getAccount(): AccountInfo | null {
    const accounts = this.msalInstance.getAllAccounts();
    return accounts.length > 0 ? accounts[0] : null;
  }

  isLoggedIn(): boolean {
    return this.msalInstance.getAllAccounts().length > 0;
  }
}

export const authService = new AuthService();