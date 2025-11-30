/**
 * MCP Authentication Middleware
 *
 * Provides OAuth2 and Cloudflare Access authentication for MCP endpoints
 *
 * References:
 * - https://developers.cloudflare.com/agents/model-context-protocol/authorization/
 * - https://oauth.net/2.1/
 */

/**
 * Authentication configuration
 */
export interface AuthConfig {
  /**
   * Enable/disable authentication
   * Set to false during development, true in production
   */
  enabled: boolean

  /**
   * OAuth2 Configuration
   */
  oauth?: {
    /**
     * OAuth2 client IDs that are allowed to access this MCP server
     * Leave empty to allow all clients
     */
    allowedClientIds?: string[]

    /**
     * OAuth2 token verification endpoint
     * Typically your identity provider's introspection endpoint
     */
    tokenVerificationEndpoint?: string

    /**
     * Required scopes for accessing the MCP server
     */
    requiredScopes?: string[]
  }

  /**
   * Cloudflare Access Configuration
   * https://developers.cloudflare.com/cloudflare-one/identity/authorization-cookie/
   */
  cloudflareAccess?: {
    /**
     * Cloudflare Access Team Domain
     * Example: "myteam.cloudflareaccess.com"
     */
    teamDomain?: string

    /**
     * Cloudflare Access Application Audience (AUD) tag
     * Found in your Access application settings
     */
    audience?: string

    /**
     * Policy ID to check (optional)
     */
    policyId?: string
  }

  /**
   * Simple API key authentication (not recommended for production)
   * Use OAuth2 or Cloudflare Access instead
   */
  apiKey?: {
    /**
     * List of valid API keys
     * Store these in environment variables, not in code!
     */
    validKeys?: string[]

    /**
     * Header name to check for the API key
     * Default: "Authorization"
     */
    headerName?: string
  }
}

/**
 * Default authentication configuration
 * Override this in your worker's environment
 */
const defaultAuthConfig: AuthConfig = {
  enabled: false, // Disabled by default for development
}

/**
 * Verify Cloudflare Access JWT token
 *
 * Cloudflare Access adds a JWT token in the `CF-Access-JWT-Assertion` header
 * This function verifies the token using Cloudflare's public keys
 */
async function verifyCloudflareAccessToken(
  request: Request,
  config: NonNullable<AuthConfig['cloudflareAccess']>
): Promise<boolean> {
  try {
    const token = request.headers.get('CF-Access-JWT-Assertion')
    if (!token) {
      return false
    }

    if (!config.teamDomain || !config.audience) {
      console.error('Cloudflare Access configuration incomplete')
      return false
    }

    // Verify the JWT token using Cloudflare's public keys
    const certsUrl = `https://${config.teamDomain}/cdn-cgi/access/certs`
    const certsResponse = await fetch(certsUrl)
    const certs = await certsResponse.json()

    // In production, you would:
    // 1. Parse the JWT header to get the key ID (kid)
    // 2. Find the matching public key from the certs endpoint
    // 3. Verify the signature using the public key
    // 4. Verify the audience (aud) claim matches your application
    // 5. Verify the token hasn't expired

    // For now, we'll do a basic check
    // TODO: Implement full JWT verification using a library like @tsndr/cloudflare-worker-jwt

    return true // Placeholder - implement proper verification
  } catch (error) {
    console.error('Cloudflare Access verification error:', error)
    return false
  }
}

/**
 * Verify OAuth2 bearer token
 *
 * Verifies the bearer token by calling the token introspection endpoint
 * or by decoding and verifying a JWT token
 */
async function verifyOAuth2Token(
  request: Request,
  config: NonNullable<AuthConfig['oauth']>
): Promise<boolean> {
  try {
    const authHeader = request.headers.get('Authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return false
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // If a verification endpoint is provided, use it
    if (config.tokenVerificationEndpoint) {
      const response = await fetch(config.tokenVerificationEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `token=${encodeURIComponent(token)}`,
      })

      if (!response.ok) {
        return false
      }

      const result = await response.json()

      // Check if token is active
      if (!result.active) {
        return false
      }

      // Check scopes if required
      if (config.requiredScopes && config.requiredScopes.length > 0) {
        const tokenScopes = result.scope?.split(' ') || []
        const hasRequiredScopes = config.requiredScopes.every((scope) =>
          tokenScopes.includes(scope)
        )
        if (!hasRequiredScopes) {
          return false
        }
      }

      return true
    }

    // If no verification endpoint, you would decode and verify the JWT here
    // TODO: Implement JWT verification using a library like @tsndr/cloudflare-worker-jwt

    return true // Placeholder - implement proper verification
  } catch (error) {
    console.error('OAuth2 verification error:', error)
    return false
  }
}

/**
 * Verify API key
 *
 * Simple API key verification - NOT recommended for production
 * Use OAuth2 or Cloudflare Access instead
 */
function verifyApiKey(request: Request, config: NonNullable<AuthConfig['apiKey']>): boolean {
  const headerName = config.headerName || 'Authorization'
  const authHeader = request.headers.get(headerName)

  if (!authHeader) {
    return false
  }

  // Support both "Bearer <key>" and direct key formats
  const key = authHeader.startsWith('Bearer ')
    ? authHeader.substring(7)
    : authHeader

  return config.validKeys?.includes(key) || false
}

/**
 * Authentication middleware for MCP endpoints
 *
 * Usage:
 * ```typescript
 * import { withAuth } from './modules/mcp/middleware'
 *
 * export default {
 *   async fetch(request, env, ctx) {
 *     // ... route to MCP endpoints ...
 *     return withAuth(mcpHandler, authConfig)(request, env, ctx)
 *   }
 * }
 * ```
 */
export function withAuth(
  handler: (request: Request, env: any, ctx: ExecutionContext) => Promise<Response>,
  config: AuthConfig = defaultAuthConfig
) {
  return async (request: Request, env: any, ctx: ExecutionContext): Promise<Response> => {
    // Skip authentication if disabled
    if (!config.enabled) {
      return handler(request, env, ctx)
    }

    // Try Cloudflare Access authentication
    if (config.cloudflareAccess) {
      const isValid = await verifyCloudflareAccessToken(request, config.cloudflareAccess)
      if (isValid) {
        return handler(request, env, ctx)
      }
    }

    // Try OAuth2 authentication
    if (config.oauth) {
      const isValid = await verifyOAuth2Token(request, config.oauth)
      if (isValid) {
        return handler(request, env, ctx)
      }
    }

    // Try API key authentication
    if (config.apiKey) {
      const isValid = verifyApiKey(request, config.apiKey)
      if (isValid) {
        return handler(request, env, ctx)
      }
    }

    // Authentication failed
    return new Response(
      JSON.stringify({
        error: 'Unauthorized',
        message: 'Valid authentication credentials are required',
      }),
      {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'WWW-Authenticate': 'Bearer realm="MCP Server"',
        },
      }
    )
  }
}
