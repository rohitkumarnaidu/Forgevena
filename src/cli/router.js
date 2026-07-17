import { commandError } from "./options.js";

export class CommandRouter {
  constructor({ handlers = {}, fallback } = {}) {
    this.handlers = new Map(Object.entries(handlers));
    this.fallback = fallback;
  }

  register(name, handler) {
    if (!name || typeof handler !== "function") throw commandError("CLI_HANDLER_INVALID", "Command handlers require a name and function.");
    if (this.handlers.has(name)) throw commandError("CLI_COMMAND_DUPLICATE", `Command ${name} is already registered.`);
    this.handlers.set(name, handler);
    return this;
  }

  async dispatch(command, request) {
    const handler = this.handlers.get(command);
    if (handler) return handler(request);
    if (this.fallback) return this.fallback(request);
    throw commandError("CLI_COMMAND_UNKNOWN", `Unknown command: ${command ?? "<none>"}.`, 2, { command: command ?? null });
  }

  commands() { return [...this.handlers.keys()].sort(); }
}
