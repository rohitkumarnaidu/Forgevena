#!/usr/bin/env node

import { run } from "../src/cli.js";
import { executeCli } from "../src/cli/entry.js";

process.exitCode = await executeCli(run);
