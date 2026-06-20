type Callback = (recording: boolean) => void;

class DVRService {
  private callbacks = new Map<string, Set<Callback>>();
  private recordings: Record<string, boolean> = {};

  isRecording(id: string) {
    return !!this.recordings[id];
  }

  register(id: string, cb: Callback) {
    if (!this.callbacks.has(id)) this.callbacks.set(id, new Set());
    this.callbacks.get(id)!.add(cb);
  }

  unregister(id: string, cb: Callback) {
    this.callbacks.get(id)?.delete(cb);
  }

  async record(id: string) {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (Math.random() > 0.85) return reject(new Error('record failed'));
        this.recordings[id] = true;
        this.callbacks.get(id)?.forEach(cb => cb(true));
        resolve();
      }, 500);
    });
  }
}

let clientInstance: DVRService | null = null;

/** Client-only singleton — never share recording state across SSR requests. */
export function getDVRService(): DVRService | null {
  if (typeof window === 'undefined') return null;
  if (!clientInstance) clientInstance = new DVRService();
  return clientInstance;
}
