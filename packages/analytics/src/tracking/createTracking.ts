class Tracking {
  eventQ: any[] = [];
  metadata: any = {};
  url: string = "http://localhost:3000";
  retries = 3;
  timer: NodeJS.Timeout;
  isOffline: boolean = true;
  storage: Storage;
  storageKey = "__events__";

  constructor(private name: string) {
    if (typeof window !== "undefined") {
      window.addEventListener("offline", () => {
        this.isOffline = true;
        console.log("is offline mode");
      });
      window.addEventListener("online", () => {
        this.isOffline = false;
        this.flushQ();
        console.log("is online mode");
      });
      window.addEventListener("pagehide", () => {
        if (!this.isOffline) {
          this.flushQWithBeacon();
        }
        console.log("page hidden");
      });
    }

    if (typeof localStorage !== "undefined") {
      this.storage = localStorage;

      const localEvents = this.storage.getItem(this.storageKey);
      if (localEvents) {
        try {
          this.eventQ = JSON.parse(localEvents);
        } catch {
          this.eventQ = [];
        }
      }
    }
  }

  storageCleanup() {
    if (this.storage.getItem(this.storageKey)) {
      this.storage.setItem(this.storageKey, "");
    }
  }

  log(eventName: string, eventData: unknown) {
    this.eventQ.push({
      eventName,
      eventData,
      timestamp: Date.now(),
      metadata: this.metadata,
    });

    if (this.isOffline) {
      this.storage.setItem(this.storageKey, JSON.stringify(this.eventQ));
    } else {
      if (this.timer) {
        clearTimeout(this.timer);
      }

      this.timer = setTimeout(() => {
        this.flushQ();
      }, 100);
    }
  }

  private async flushQ() {
    if (this.eventQ.length) {
      const headers = new Headers();
      headers.set("Content-Type", "application/json");
      let currentRetries = 0;

      const callWithRetries = async (events: any[]) => {
        const requests = events.map((evt) => {
          const req: RequestInit = {
            method: "POST",
            headers,
            body: JSON.stringify(evt),
          };

          return fetch(this.url, req).then((res) => res.json());
        });

        const responses = await Promise.allSettled(requests);
        responses.forEach((response, i) => {
          if (response.status !== "rejected") {
            events.splice(i, 0);
          }
        });

        if (events.length && currentRetries < this.retries) {
          console.log("retring failed events", events.length, currentRetries);
          callWithRetries(events);
          currentRetries += 1;
        }
      };

      callWithRetries(this.eventQ.slice(0));
      this.eventQ = [];
      this.storageCleanup();
    }
  }

  private flushQWithBeacon() {
    if (this.eventQ.length) {
      this.eventQ.forEach((evt) => {
        const req: RequestInit = {
          method: "POST",
          body: JSON.stringify(evt),
        };
        let isEventsQueued = false;
        if (navigator.sendBeacon) {
          isEventsQueued = navigator.sendBeacon(this.url, req.body);
        }

        if (!isEventsQueued) {
          fetch(this.url, {
            ...req,
            keepalive: true,
          });
        }
      });
      this.eventQ = [];
      this.storageCleanup();
    }
  }
}

export const createTracking = () => {
  let instance: Tracking;
  return () => {
    if (instance) {
      return instance;
    }

    instance = new Tracking("tracking");
    return instance;
  };
};
