class WebSocketSingleton {
    private static instance: WebSocketSingleton;
    public socket: WebSocket | null = null;
    private listeners: Map<string, Function[]> = new Map();
    private connectionPromise: Promise<void> | null = null;

    private constructor() { }

    public static getInstance(): WebSocketSingleton {
        if (!WebSocketSingleton.instance) {
            WebSocketSingleton.instance = new WebSocketSingleton();
        }
        return WebSocketSingleton.instance;
    }

    public async connect(url: string): Promise<void> {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            return
        }

        if (!this.connectionPromise) {
            this.connectionPromise = new Promise((resolve, reject) => {
                this.socket = new WebSocket(url);

                this.socket.onopen = () => {
                    this.connectionPromise = null;
                    resolve()
                }

                this.socket.onerror = (error) => {
                    this.connectionPromise = null;
                    reject(error)
                }

                this.socket.onmessage = (event) => {
                    try {
                        const message = JSON.parse(event.data);
                        this.notifyListeners(message.type, message.payload);
                    } catch (error) {
                        console.error("Error parsing WebSocket message:", error);
                    }
                }

                this.socket.onclose = (event) => {
                    this.socket = null;
                    this.connectionPromise = null;
                }
            })
        }
        return this.connectionPromise;
    }

    public sendMessage(type: string, payload: any): void {
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            this.socket.send(JSON.stringify({ type, payload }));
        }
    }

    public addListener(type: string, callback: Function): void {
        if (!this.listeners.has(type)) {
            this.listeners.set(type, []);
        }
        this.listeners.get(type)!.push(callback);
    }

    public removeListener(type: string, callback: Function): void {
        const callbacks = this.listeners.get(type);
        if (callbacks) {
            this.listeners.set(type, callbacks.filter(c => c !== callback));
        }
    }

    private notifyListeners(type: string, payload: any): void {
        const callbacks = this.listeners.get(type) || [];
        callbacks.forEach(callback => callback(payload));
    }

    public disonnect(): void {
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }
}

export const webSocketManager = WebSocketSingleton.getInstance();