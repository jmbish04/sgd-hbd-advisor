import { initDb } from '@api/db/client'
import { healthChecks } from '@api/db/schema'
import { PROMPTS } from '@api/modules/ai/prompts'

type CheckResult = {
  name: string
  status: 'PASS' | 'FAIL'
  log?: string
  aiExplanation?: string
  aiResolution?: string
}

async function checkD1(db: D1Database): Promise<CheckResult> {
  const checkName = 'D1_CONNECT'
  try {
    await initDb(db).db.select().from(healthChecks).limit(1)
    return { name: checkName, status: 'PASS' }
  } catch (e: any) {
    return { name: checkName, status: 'FAIL', log: e.message }
  }
}

async function checkAI(ai: Ai): Promise<CheckResult> {
  const checkName = 'AI_PROVIDER_PING'
  try {
    await ai.run('@cf/meta/llama-3-8b-instruct', {
      prompt: "Health check",
    })
    return { name: checkName, status: 'PASS' }
  } catch (e: any) {
    return { name: checkName, status: 'FAIL', log: e.message }
  }
}

export async function runAllHealthChecks(db: D1Database, ai: Ai) {
  const checks = await Promise.all([
    checkD1(db),
    checkAI(ai),
  ])

  let overallStatus: 'PASS' | 'FAIL' = 'PASS'

  for (const check of checks) {
    if (check.status === 'FAIL') {
      overallStatus = 'FAIL'
      // In a real app, you'd call the AI here to populate these fields
      // const explanation = await ai.run('@cf/meta/llama-3-8b-instruct', { prompt: PROMPTS.EXPLAIN_ERROR(check.log!) });
      // const resolution = await ai.run('@cf/meta/llama-3-8b-instruct', { prompt: PROMPTS.SUGGEST_FIX(check.log!) });
      check.aiExplanation = "AI explanation would go here."
      check.aiResolution = "AI resolution suggestion would go here."
    }
  }

  // TODO: Save results to D1 healthSessions and healthLogs tables

  return {
    overallStatus,
    checks,
  }
}
