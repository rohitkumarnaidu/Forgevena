import process from "node:process";

export async function promptSecret(message) {
  if (!process.stdin.isTTY || !process.stdout.isTTY) throw new Error("Provider key entry requires an interactive terminal. Set the documented environment variable yourself in non-interactive environments.");
  process.stdout.write(message);
  const input = process.stdin;
  const wasRaw = input.isRaw;
  input.setRawMode(true);
  input.resume();
  return new Promise((resolve, reject) => {
    let value = "";
    const cleanup = () => { input.removeListener("data", onData); input.setRawMode(wasRaw ?? false); input.pause(); };
    const onData = (buffer) => {
      for (const character of buffer.toString("utf8")) {
        if (character === "\u0003") { cleanup(); process.stdout.write("\n"); reject(new Error("Provider key entry cancelled.")); return; }
        if (character === "\r" || character === "\n") { cleanup(); process.stdout.write("\n"); resolve(value); return; }
        if (character === "\b" || character === "\u007f") { if (value.length > 0) { value = value.slice(0, -1); process.stdout.write("\b \b"); } continue; }
        if (character >= " ") { value += character; process.stdout.write("*"); }
      }
    };
    input.on("data", onData);
  });
}
