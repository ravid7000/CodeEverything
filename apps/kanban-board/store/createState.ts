import { useEffect, useState } from "react";

type ListenerType<S> = (state: S) => void;

type CreateStateType<S> = {
  subscribe: (listener: ListenerType<S>) => () => void;
  set: (newState: S) => void;
  get: () => S;
};

export const createState = <S = unknown>(initialState: S) => {
  let state: S = initialState;
  let listeners: ListenerType<S>[] = [];
  return () => {
    const updateListeners = () => {
      if (listeners.length) {
        listeners.forEach((listener) => {
          listener(state);
        });
      }
    };

    const set = (newState: S) => {
      if (!Object.is(state, newState)) {
        state = newState;
        updateListeners();
      }
    };

    const get = (): S => state;

    const subscribe = (listener: ListenerType<S>) => {
      if (typeof listener !== "function") {
        throw Error("Listner should be a function");
      }

      listeners.push(listener);
      return () => {
        const index = listeners.findIndex((lis) => lis === listener);
        listeners.splice(index, 1);
      };
    };

    return {
      set,
      get,
      subscribe,
    };
  };
};

export const storage = () => {
  return {
    set: (key: string, value: unknown) => {
      if (typeof localStorage !== "undefined") {
        localStorage.setItem(key, JSON.stringify(value));
      }
    },
    get: <S>(key: string) => {
      if (typeof localStorage !== "undefined") {
        let value;
        try {
          value = localStorage.getItem(key) || "";
          return JSON.parse(value) as S;
        } catch (err) {
          return value as S;
        }
      }
    },
    remove: (key: string) => {
      if (typeof localStorage !== "undefined") {
        localStorage.removeItem(key);
      }
    },
  };
};

export const useSubscription = <S>(state: CreateStateType<S>) => {
  const [newState, setNewState] = useState<S>(state.get);

  useEffect(() => {
    if (typeof state === "object" && typeof state.subscribe === "function") {
      return state.subscribe(setNewState);
    }
  }, [state]);

  return newState;
};
