/**
 * Minimal classnames function to combine multiple classes
 * It supports string and array of string as input
 * @param args
 * @returns
 */
export const classnames = (...args: unknown[]): string => {
  let classStr = "";
  args.forEach((arg) => {
    if (typeof arg === "string") {
      classStr += ` ${arg.trim()}`;
    }
    if (Array.isArray(arg)) {
      classStr += ` ${arg
        .map((cls) => {
          if (typeof cls === "string") {
            return cls.trim();
          }
          return null;
        })
        .filter((cls) => cls)
        .join(" ")}`;
    }
  });
  return classStr.trim();
};
