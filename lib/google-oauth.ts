/**
 * Google OAuth2 implementation for Google Sheets write access
 * This handles the OAuth2 flow and token management
 */

interface OAuthConfig {
  clientId: string
  clientSecret: string
  redirectUri: string
  scopes: string[]
}

interface OAuthTokens {
  access_token: string
  refresh_token: string
  expires_in: number
  token_type: string
  scope: string
  expires_at: number
}

export class GoogleOAuth {
  private config: OAuthConfig
  private tokens: OAuthTokens | null = null

  constructor(config: OAuthConfig) {
    this.config = config
    this.loadTokensFromStorage()
  }

  /**
   * Generate OAuth2 authorization URL
   */
  getAuthUrl(): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      scope: this.config.scopes.join(" "),
      response_type: "code",
      access_type: "offline",
      prompt: "consent",
      state: this.generateState(),
    })

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`
  }

  /**
   * Exchange authorization code for tokens
   */
  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code,
          grant_type: "authorization_code",
          redirect_uri: this.config.redirectUri,
        }),
      })

      if (!response.ok) {
        throw new Error(`OAuth token exchange failed: ${response.status}`)
      }

      const tokens = await response.json()
      tokens.expires_at = Date.now() + tokens.expires_in * 1000

      this.tokens = tokens
      this.saveTokensToStorage()

      return tokens
    } catch (error) {
      console.error("Token exchange error:", error)
      throw error
    }
  }

  /**
   * Refresh access token using refresh token
   */
  async refreshAccessToken(): Promise<OAuthTokens> {
    if (!this.tokens?.refresh_token) {
      throw new Error("No refresh token available")
    }

    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          refresh_token: this.tokens.refresh_token,
          grant_type: "refresh_token",
        }),
      })

      if (!response.ok) {
        throw new Error(`Token refresh failed: ${response.status}`)
      }

      const newTokens = await response.json()

      // Preserve refresh token if not provided in response
      if (!newTokens.refresh_token) {
        newTokens.refresh_token = this.tokens.refresh_token
      }

      newTokens.expires_at = Date.now() + newTokens.expires_in * 1000

      this.tokens = newTokens
      this.saveTokensToStorage()

      return newTokens
    } catch (error) {
      console.error("Token refresh error:", error)
      throw error
    }
  }

  /**
   * Get valid access token (refresh if needed)
   */
  async getValidAccessToken(): Promise<string> {
    if (!this.tokens) {
      throw new Error("No tokens available. Please authenticate first.")
    }

    // Check if token is expired (with 5 minute buffer)
    const isExpired = Date.now() >= this.tokens.expires_at - 300000

    if (isExpired) {
      await this.refreshAccessToken()
    }

    return this.tokens!.access_token
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return !!this.tokens?.access_token
  }

  /**
   * Revoke tokens and clear storage
   */
  async logout(): Promise<void> {
    if (this.tokens?.access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${this.tokens.access_token}`, {
          method: "POST",
        })
      } catch (error) {
        console.error("Token revocation error:", error)
      }
    }

    this.tokens = null
    this.clearTokensFromStorage()
  }

  /**
   * Generate random state for CSRF protection
   */
  private generateState(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
  }

  /**
   * Save tokens to localStorage
   */
  private saveTokensToStorage(): void {
    if (typeof window !== "undefined" && this.tokens) {
      localStorage.setItem("google_oauth_tokens", JSON.stringify(this.tokens))
    }
  }

  /**
   * Load tokens from localStorage
   */
  private loadTokensFromStorage(): void {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("google_oauth_tokens")
      if (stored) {
        try {
          this.tokens = JSON.parse(stored)
        } catch (error) {
          console.error("Error loading tokens from storage:", error)
          this.clearTokensFromStorage()
        }
      }
    }
  }

  /**
   * Clear tokens from localStorage
   */
  private clearTokensFromStorage(): void {
    if (typeof window !== "undefined") {
      localStorage.removeItem("google_oauth_tokens")
    }
  }
}

// OAuth configuration
const getOAuthConfig = (): OAuthConfig => {
  return {
    clientId: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_SECRET || "",
    redirectUri: typeof window !== "undefined" ? `${window.location.origin}/oauth/callback` : "",
    scopes: ["https://www.googleapis.com/auth/spreadsheets", "https://www.googleapis.com/auth/drive.file"],
  }
}

// Singleton OAuth instance
let oauthInstance: GoogleOAuth | null = null

export const getGoogleOAuth = (): GoogleOAuth => {
  if (!oauthInstance) {
    oauthInstance = new GoogleOAuth(getOAuthConfig())
  }
  return oauthInstance
}

// Helper function to check if OAuth is configured
export const isOAuthConfigured = (): boolean => {
  const config = getOAuthConfig()
  return !!(config.clientId && config.clientSecret)
}
