type EventHandler = (...args: any[]) => void;
type AllEventHandler = (eventName: string, ...args: any[]) => void;

class EventBus {
    private events: { [eventName: string]: EventHandler[] };
    private globalHandlers: AllEventHandler[] = [];

    constructor() {
        this.events = {};
    }

    on(eventName: string, handler: EventHandler): void {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(handler);
    }

    off(eventName: string, handler: EventHandler): void {
        const eventHandlers = this.events[eventName];
        if (eventHandlers) {
            this.events[eventName] = eventHandlers.filter(h => h !== handler);
        }
    }

    emit(eventName: string, ...args: any[]): void {
        const eventHandlers = this.events[eventName];
        if (eventHandlers) {
            eventHandlers.forEach(handler => handler(...args));
        }
    }

    all(handler: AllEventHandler) {
        this.globalHandlers.push(handler);
    }
}

export const eventBus = new EventBus();