export class WebSocketClient {
  private ws: WebSocket | null = null
  private url: string

  constructor(url: string) {
    this.url = url
  }

  connect() {
    this.ws = new WebSocket(this.url)

    this.ws.onopen = () => {
      console.log('Connected to WebSocket server')
    }

    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data)
      this.handleMessage(message)
    }

    this.ws.onclose = () => {
      console.log('Disconnected from WebSocket server')
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(), 5000)
    }
  }

  private handleMessage(message: { type: string; data: any }) {
    switch (message.type) {
      case 'SET_CREATE':
        // Handle new set creation
        this.onSetCreate?.(message.data)
        break
      case 'SET_UPDATE':
        // Handle set update
        this.onSetUpdate?.(message.data)
        break
      case 'SET_DELETE':
        // Handle set deletion
        this.onSetDelete?.(message.data)
        break
    }
  }

  // Callback handlers that can be set by the client
  onSetCreate?: (set: any) => void
  onSetUpdate?: (set: any) => void
  onSetDelete?: (set: any) => void

  send(message: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message))
    }
  }

  disconnect() {
    this.ws?.close()
  }
}
