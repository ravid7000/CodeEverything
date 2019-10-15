export const range = (from, to) => {
  if (!to) {
    to = from;
    from = 0;
  }
  const arr = []

  while (from < to) {
    arr.push(from)
    from += 1;
  }
  return arr;
}
