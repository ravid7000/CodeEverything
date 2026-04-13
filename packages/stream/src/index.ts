export function stdout(stream: unknown, output?: unknown) {
  if (stream && typeof stream === "object") {
    stream = JSON.stringify(stream);
  }
  if (output && (typeof output === "object" || typeof output === "string")) {
    stream = `Input: ${stream}\nOutput: ${output}`;
  }

  if (typeof stream === "string" && process.stdout.writable) {
    process.stdout.write(`=>\n${stream}\n<=\n`);
  }
}
