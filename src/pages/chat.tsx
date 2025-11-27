import { useChat } from '@ai-sdk/react'
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Chat() {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat',
  })

  return (
    <div className="flex justify-center items-center h-full">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Generative Chat</CardTitle>
          <CardDescription>Powered by AI SDK and Cloudflare Workers</CardDescription>
        </CardHeader>
        <CardContent className="h-96 overflow-y-auto space-y-4">
          {messages.length === 0 && (
            <div className="text-center text-muted-foreground">
              Ask a question to get started.
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`rounded-lg p-3 max-w-xs ${m.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary'}`}>
                {m.content}
              </div>
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <form onSubmit={handleSubmit} className="flex w-full gap-2">
            <Input
              value={input}
              onChange={handleInputChange}
              placeholder="Type your message..."
            />
            <Button type="submit">Send</Button>
          </form>
        </CardFooter>
      </Card>
    </div>
  )
}
