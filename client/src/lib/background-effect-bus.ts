/**
 * Event bus for the background effects system
 * Allows components to trigger and respond to background animation events
 */

// Create an event bus for triggering the background effect from any component
class BackgroundEffectBus {
  private listeners: ((event?: { x?: number; y?: number; type?: string }) => void)[] = [];

  // Add a listener to the event bus
  addListener(listener: (event?: { x?: number; y?: number; type?: string }) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  // Trigger all registered listeners with mouse position
  triggerEffect(event?: { x?: number; y?: number; type?: string }) {
    this.listeners.forEach(listener => listener(event));
  }
}

// Export a singleton instance of the bus
export const backgroundEffectBus = new BackgroundEffectBus();