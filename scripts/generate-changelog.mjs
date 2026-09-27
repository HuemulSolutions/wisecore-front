// Genera CHANGELOG.md a partir de tags de versión (vX.Y.Z).
// Fuente de verdad: git tags. Sin estado fuera de banda — las versiones
// ya documentadas se detectan leyendo los encabezados "## [X.Y.Z]" del
// propio CHANGELOG.md, así que correr el script dos veces es idempotente.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");
const configPath = path.join(__dirname, "changelog.config.json");

const config = JSON.parse(readFileSync(configPath, "utf8"));
const tagRegex = new RegExp(config.tagPattern);
const skipRegexes = config.skip.map((p) => new RegExp(p, "i"));

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function gitLines(cmd) {
  const out = git(cmd);
  return out ? out.split("\n") : [];
}

function detectEol(content) {
  return content.includes("\r\n") ? "\r\n" : "\n";
}

function listTags() {
  // --sort=creatordate: para tags lightweight, git usa la fecha del commit
  // apuntado, así que refleja el orden cronológico real del historial.
  return gitLines("tag -l --sort=creatordate")
    .filter((t) => tagRegex.test(t))
    .map((tag) => ({
      tag,
      version: tag.replace(/^v/, ""),
      hash: git(`rev-list -n 1 ${tag}`),
    }));
}

function documentedVersions(content) {
  const found = new Set();
  const re = /^## \[(\d+\.\d+\.\d+)\]/gm;
  let m;
  while ((m = re.exec(content))) found.add(m[1]);
  return found;
}

function shouldSkip(subject) {
  const s = subject.trim();
  if (!s) return true;
  return skipRegexes.some((re) => re.test(s));
}

function categorize(subject) {
  const m = subject.match(/^([a-z]+)(\([^)]*\))?(!)?:\s*/i);
  const type = m?.[1]?.toLowerCase();
  const text = m ? subject.slice(m[0].length) : subject;
  const group =
    config.groups.find((g) => type && g.types.includes(type)) ??
    config.groups.find((g) => g.types.includes("*")) ??
    config.groups[config.groups.length - 1];
  return { title: group.title, text };
}

function buildSection(header, subjects, eol) {
  const buckets = new Map(config.groups.map((g) => [g.title, []]));
  for (const subject of subjects) {
    if (shouldSkip(subject)) continue;
    const { title, text } = categorize(subject);
    buckets.get(title).push(text);
  }
  let section = header;
  for (const group of config.groups) {
    const items = buckets.get(group.title);
    if (items.length === 0) continue;
    section += `${eol}### ${group.title}`;
    for (const text of items) section += `${eol}- ${text}`;
  }
  return section;
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const full = args.includes("--full");
  const unreleased = args.includes("--unreleased");
  const tagArgIndex = args.indexOf("--tag");
  const tagArg = tagArgIndex !== -1 ? args[tagArgIndex + 1] : null;

  const existing = existsSync(changelogPath) ? readFileSync(changelogPath, "utf8") : "# Changelog\n\n";
  const eol = detectEol(existing);
  const documented = full ? new Set() : documentedVersions(existing);
  const tags = listTags(); // orden cronológico ascendente

  const newSections = [];

  if (tagArg || unreleased) {
    // Modo release: commits desde el último tag conocido hasta HEAD.
    // El tag de esta versión todavía no existe en git en este punto del
    // flujo (release.mjs lo crea después), por eso se usa HEAD y la fecha
    // de hoy en vez de leer un commit ya taggeado.
    const version = tagArg ? tagArg.replace(/^v/, "") : null;
    const lastTag = tags[tags.length - 1] ?? null;
    const subjects = lastTag
      ? gitLines(`log --no-merges --format=%s ${lastTag.hash}..HEAD`)
      : gitLines("log --no-merges --format=%s HEAD");

    if (version) {
      newSections.push(buildSection(`## [${version}] - ${todayIso()}`, subjects, eol));
    } else if (subjects.length > 0) {
      newSections.push(buildSection("## [Sin publicar]", subjects, eol));
    } else {
      console.log("No hay commits nuevos desde el último tag.");
      return;
    }
  } else {
    // Modo backfill (default, o --full): rellena cualquier tag que todavía
    // no tenga sección "## [X.Y.Z]" en el CHANGELOG.
    let prev = null;
    for (const t of tags) {
      if (documented.has(t.version)) {
        prev = t;
        continue;
      }
      const subjects = prev
        ? gitLines(`log --no-merges --format=%s ${prev.hash}..${t.hash}`)
        : gitLines(`log --no-merges --format=%s ${t.hash}`);
      const date = git(`show -s --format=%cs ${t.hash}`);
      newSections.push(buildSection(`## [${t.version}] - ${date}`, subjects, eol));
      prev = t;
    }
  }

  if (newSections.length === 0) {
    console.log("No hay versiones nuevas para documentar.");
    return;
  }

  newSections.reverse(); // más reciente primero

  if (dryRun) {
    console.log(newSections.join("\n\n"));
    console.log(`\n(dry-run: ${newSections.length} sección(es), no se escribió CHANGELOG.md)`);
    return;
  }

  const existingBody = full ? "" : existing.replace(/^#\s*Changelog\s*/i, "").trim();
  const body = [...newSections, existingBody].filter(Boolean).join(`${eol}${eol}`);
  writeFileSync(changelogPath, `# Changelog${eol}${eol}${body}${eol}`, "utf8");
  console.log(`CHANGELOG.md actualizado con ${newSections.length} sección(es) nueva(s).`);
}

main();
