export const PROMPTS = {
  EXPLAIN_ERROR: (error: string) => `
    Explain the following system error in simple terms for a non-technical user.
    Error: ${error}
  `,
  SUGGEST_FIX: (error: string) => `
    Given the following error, suggest a possible technical resolution.
    Error: ${error}
  `,
}
