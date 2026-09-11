// Genera CHANGELOG.md a partir de los commits de bump de versión en package.json.
import { execSync } from "node:child_process";
import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");
const changelogPath = path.join(repoRoot, "CHANGELOG.md");

function git(cmd) {
  return execSync(`git ${cmd}`, { cwd: repoRoot, encoding: "utf8" }).trim();
}

function getVersionAt(hash) {
  const content = git(`show ${hash}:package.json`);
  const match = content.match(/"version":\s*"([^"]+)"/);
  return match ? match[1] : null;
}

function isPureVersionMessage(subject) {
  return /^(version|nueva\s+versi[oó]n)\s*[\d.]*\s*$/i.test(subject.trim());
}

function categorize(subject) {
  const feat = /^feat(\([^)]*\))?:\s*/i;
  const fix = /^fix(\([^)]*\))?:\s*/i;
  if (feat.test(subject)) return { group: "Nuevo", text: subject.replace(feat, "") };
  if (fix.test(subject)) return { group: "Arreglos", text: subject.replace(fix, "") };
  return { group: "Otros", text: subject.replace(/^chore(\([^)]*\))?:\s*/i, "") };
}

function readBaseline() {
  if (!existsSync(changelogPath)) return null;
  const content = readFileSync(changelogPath, "utf8");
  const match = content.match(/<!--\s*changelog-last-commit:\s*([0-9a-f]+)\s*-->/i);
  return match ? match[1] : null;
}

function readExistingBody() {
  if (!existsSync(changelogPath)) return "";
  const content = readFileSync(changelogPath, "utf8");
  return content
    .replace(/^#\s*Changelog\s*/i, "")
    .replace(/<!--\s*changelog-last-commit:[^>]*-->\s*$/i, "")
    .trim();
}

function main() {
  const full = process.argv.includes("--full");
  const head = git("rev-parse HEAD");
  const baseline = full ? null : readBaseline();

  if (!full && baseline === null) {
    writeFileSync(
      changelogPath,
      `# Changelog\n\n<!-- changelog-last-commit: ${head} -->\n`,
      "utf8"
    );
    console.log("CHANGELOG.md creado. Próximas corridas registrarán bumps de versión desde este punto.");
    return;
  }

  const bumpCommitsRaw = baseline
    ? git(`log --format=%H --reverse ${baseline}..HEAD -- package.json`)
    : git("log --format=%H --reverse -- package.json");
  const bumpCommits = bumpCommitsRaw ? bumpCommitsRaw.split("\n") : [];

  let prevHash = baseline;
  let prevVersion = baseline ? getVersionAt(baseline) : null;
  const newSections = [];

  for (const hash of bumpCommits) {
    const version = getVersionAt(hash);
    if (!version || version === prevVersion) continue;

    const subjectsRaw = prevHash ? git(`log --format=%s ${prevHash}..${hash}`) : git(`log --format=%s ${hash}`);
    const subjects = subjectsRaw
      ? subjectsRaw.split("\n").filter((s) => s.trim() && !isPureVersionMessage(s))
      : [];

    const groups = { Nuevo: [], Arreglos: [], Otros: [] };
    for (const subject of subjects) {
      const { group, text } = categorize(subject);
      groups[group].push(text);
    }

    const date = git(`show -s --format=%cs ${hash}`);
    let section = `## [${version}] - ${date}\n`;
    for (const groupName of ["Nuevo", "Arreglos", "Otros"]) {
      if (groups[groupName].length === 0) continue;
      section += `### ${groupName}\n`;
      for (const text of groups[groupName]) section += `- ${text}\n`;
    }
    newSections.push(section.trim());

    prevHash = hash;
    prevVersion = version;
  }

  if (newSections.length === 0) {
    console.log("No hay nuevos bumps de versión desde el último changelog generado.");
    return;
  }

  newSections.reverse(); // más reciente primero
  const existingBody = full ? "" : readExistingBody();
  const body = [...newSections, existingBody].filter(Boolean).join("\n\n");
  writeFileSync(
    changelogPath,
    `# Changelog\n\n${body}\n\n<!-- changelog-last-commit: ${prevHash} -->\n`,
    "utf8"
  );
  console.log(
    full
      ? `CHANGELOG.md regenerado con ${newSections.length} versión(es) desde el inicio del historial.`
      : `CHANGELOG.md actualizado con ${newSections.length} versión(es) nueva(s).`
  );
}

main();
