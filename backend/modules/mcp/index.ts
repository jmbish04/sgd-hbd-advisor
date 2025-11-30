/**
 * MCP Module Entry Point
 *
 * Exports the MCP agent for use in the main worker
 */

export { CloudflareMcpAgent, mcpAgent } from './agent'
export { withAuth, type AuthConfig } from './middleware'
