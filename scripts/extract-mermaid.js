import { readFile, readdir, stat, mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const docs = path.resolve("docs");
const output = path.resolve("dist", "mermaid");
const files = await walk(docs);
const diagrams = [];

for (const file of files) {
  const contents = await readFile(file, "utf8");
  for (const match of contents.matchAll(/```mermaid\s*\n([\s\S]*?)```/g)) {
    const diagram = match[1].trim();
    if (!/^(flowchart|graph|sequenceDiagram|classDiagram|stateDiagram|erDiagram|journey|gantt|pie|timeline|mindmap|quadrantChart|gitGraph|C4Context)\b/.test(diagram)) {
      throw new Error(`${path.relative(process.cwd(), file)} contains an unsupported Mermaid diagram header.`);
    }
    diagrams.push({ file, diagram });
  }
}

await mkdir(output, { recursive: true });
for (let index = 0; index < diagrams.length; index += 1) {
  await writeFile(path.join(output, `${String(index + 1).padStart(3, "0")}.mmd`), `${diagrams[index].diagram}\n`, { flag: "wx" }).catch((error) => {
    if (error.code !== "EEXIST") throw error;
  });
}
console.log(JSON.stringify({ diagrams: diagrams.length, output: path.relative(process.cwd(), output) }, null, 2));

async function walk(directory) {
  const result = [];
  for (const name of await readdir(directory)) {
    const target = path.join(directory, name);
    const metadata = await stat(target);
    if (metadata.isDirectory()) result.push(...await walk(target));
    else if (target.endsWith(".md")) result.push(target);
  }
  return result;
}
