import { Button } from '@/components/ui/button'

export function Landing({ onStart }: { onStart: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-background">
      <h1 className="text-5xl font-bold mb-6">
        The Gold Standard Worker Template
      </h1>
      <p className="text-xl text-muted-foreground mb-10 max-w-2xl">
        A production-ready, modular, and AI-governed Cloudflare Worker template.
        Built with Vite, Bun, Hono, React, and Shadcn/UI.
      </p>
      <Button size="lg" onClick={onStart}>
        Get Started
      </Button>
    </div>
  )
}
