// Singleton design pattern
const obj = (function () {
  let instance;
  return function () {
    if (!instance) {
      instance = new Object();
    }
    return instance;
  };
})();

const obj1 = obj();
const obj2 = obj();
console.log(obj1 === obj2); // true

// Create redux like statemanagement library with singletone pattern
type Action<T> = (arg: { type: string }) => T;
type Reducer<State> = (state: State, action: Action<State>) => State;

const createReduxStore = (function () {
  let state: any;

  return function <State extends any>(reducer: Reducer<State>) {
    return {
      getState: function (): State {
        return state;
      },
      dispatch: function (action: Action<State>) {
        state = reducer(state, action);
      },
    };
  };
})();
