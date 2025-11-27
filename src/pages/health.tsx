import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { useState, useEffect } from 'react'

type Check = {
  name: string
  status: 'PASS' | 'FAIL'
  log?: string
  aiExplanation?: string
  aiResolution?: string
}

type HealthState = {
  overallStatus: 'PASS' | 'FAIL'
  checks: Check[]
}

export function Health() {
  const [health, setHealth] = useState<HealthState | null>(null)
  const [loading, setLoading] = useState(true)

  const runChecks = () => {
    setLoading(true)
    fetch('/api/health')
      .then(res => res.json())
      .then((data: HealthState) => {
        setHealth(data)
        setLoading(false)
      })
      .catch(err => {
        console.error(err)
        setHealth(null)
        setLoading(false)
      })
  }

  useEffect(runChecks, [])

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold">Health Dashboard</h2>
        <Button onClick={runChecks} disabled={loading}>
          Run All Checks
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>System Status</CardTitle>
            <CardDescription>Real-time status of all critical services</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading && <p>Loading checks...</p>}
            {health && health.checks.map((check) => (
              <div key={check.name} className="flex items-start">
                <span className={`mr-3 ${check.status === 'PASS' ? 'text-green-500' : 'text-destructive'}`}>
                  {check.status === 'PASS' ? '✓' : '✗'}
                </span>
                <div>
                  <p className="font-semibold">{check.name}</p>
                  <p className="text-sm text-muted-foreground">{check.log || 'OK'}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>AI Diagnostic</CardTitle>
            <CardDescription>AI-generated explanation of issues</CardDescription>
          </CardHeader>
          <CardContent className="min-h-[300px]">
            {loading && <p>Loading diagnostics...</p>}
            {health && health.overallStatus === 'PASS' && (
              <p className="text-sm text-muted-foreground">No issues detected. All systems nominal.</p>
            )}
            {health && health.checks.filter(c => c.status === 'FAIL').map((check, i) => (
              <div key={i} className="mb-4">
                <p className="font-semibold text-destructive">{check.name} FAILED</p>
                <p className="text-sm mt-1"><strong>Explanation:</strong> {check.aiExplanation}</p>
                <p className="text-sm mt-1"><strong>Suggestion:</strong> {check.aiResolution}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
