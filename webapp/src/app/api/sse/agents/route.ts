import { getAllAgentsStatus } from "@/lib/openclaw"

export async function GET() {
  const encoder = new TextEncoder()
  let intervalId: NodeJS.Timeout

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          const status = await getAllAgentsStatus()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(status)}\n\n`))
        } catch (error: any) {
          console.error("SSE send error:", error.message)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({})}\n\n`))
        }
      }

      // Enviar estado inicial inmediatamente
      send()

      // Enviar cada 3 segundos
      intervalId = setInterval(send, 3000)
    },

    cancel() {
      clearInterval(intervalId)
    },
  })

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  })
}
