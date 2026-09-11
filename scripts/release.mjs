#!/usr/bin/env node
// Orquesta un release: calcula la versión, sincroniza package.json,
// package-lock.json y README.md, prepende CHANGELOG.md, commitea y taggea.
// No pushea: el push de dev-silva dispara workflows de deploy, que sea
// un acto consciente.
//
// Uso (siempre vía `npm run`, para que node_modules/.bin esté en el PATH):
//   npm run release                -> bump patch (1.0.97 -> 1.0.98)
//   npm run release -- minor|major
//   npm run release -- 1.2.3       -> versión explícita
//   npm run release -- --dry-run   -> no escribe nada; imprime versión y sección

import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sh = (cmd) => execSync(cmd, { cwd: repoRoot, encoding: "utf8" }).trim();
const run = (cmd) => execSync(cmd, { cwd: repoRoot, stdio: "inherit" });

const BUMP_RANK = { patch: 0, minor: 1, major: 2 };

// Mismo criterio que generate-changelog.mjs para encontrar el último tag de versión.
function lastTag() {
  const config = JSON.parse(readFileSync(path.join(repoRoot, "scripts/changelog.config.json"), "utf8"));
  const tagRegex = new RegExp(config.tagPattern);
  const tags = sh("git tag -l --sort=creatordate")
    .split("\n")
    .filter((t) => tagRegex.test(t));
  const tag = tags[tags.length - 1];
  return tag ? { tag, hash: sh(`git rev-list -n 1 ${tag}`) } : null;
}

function commitSubjectsSince(hash) {
  const out = sh(hash ? `git log --no-merges --format=%s ${hash}..HEAD` : "git log --no-merges --format=%s HEAD");
  return out ? out.split("\n") : [];
}

// Piso de bump sugerido según los prefijos Conventional Commits del lote.
function suggestBump(subjects) {
  let bump = "patch";
  for (const subject of subjects) {
    const m = subject.match(/^([a-z]+)(\([^)]*\))?(!)?:\s*/i);
    if (!m) continue;
    const [, type, , breaking] = m;
    if (breaking) return "major";
    if (["feat", "feature"].includes(type.toLowerCase())) bump = "minor";
  }
  return bump;
}

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const spec = args.find((a) => !a.startsWith("--"));

// 1. El árbol debe estar limpio (salvo dry-run)
if (!dryRun && sh("git status --porcelain")) {
  console.error("Árbol de trabajo sucio. Commiteá o guardá los cambios antes de releasear.");
  process.exit(1);
}

// 2. Determinar la versión nueva
const current = JSON.parse(readFileSync(path.join(repoRoot, "package.json"), "utf8")).version;
let next;
if (/^\d+\.\d+\.\d+$/.test(spec ?? "")) {
  next = spec;
} else {
  const subjects = commitSubjectsSince(lastTag()?.hash);
  const suggested = suggestBump(subjects);

  let kind;
  if (["patch", "minor", "major"].includes(spec)) {
    kind = spec;
    if (BUMP_RANK[kind] < BUMP_RANK[suggested]) {
      console.warn(
        `Aviso: pediste "${kind}" pero los commits desde el último tag sugieren "${suggested}" (hay feat/breaking en el lote).`,
      );
    }
  } else {
    kind = suggested;
    console.log(`Sugerido por commits: ${kind}`);
  }

  const [ma, mi, pa] = current.split(".").map(Number);
  next = kind === "major" ? `${ma + 1}.0.0` : kind === "minor" ? `${ma}.${mi + 1}.0` : `${ma}.${mi}.${pa + 1}`;
}
if (next === current) {
  console.error(`La versión calculada (${next}) es igual a la actual. Nada que releasear.`);
  process.exit(1);
}
console.log(`${current} -> ${next}`);

// 3. Dry-run: mostrar la sección que se generaría y salir, sin tocar nada
if (dryRun) {
  console.log("\n--- sección que se prependería a CHANGELOG.md ---\n");
  run("node scripts/generate-changelog.mjs --unreleased --dry-run");
  process.exit(0);
}

// 4. Sincronizar versiones (npm actualiza package.json Y package-lock.json)
run(`npm version ${next} --no-git-tag-version --allow-same-version`);

// 5. Sincronizar el README (línea "**Version X.Y.Z**")
const readmePath = path.join(repoRoot, "README.md");
const readme = readFileSync(readmePath, "utf8");
const synced = readme.replace(/^\*\*Version\s+\d+\.\d+\.\d+\*\*$/m, `**Version ${next}**`);
if (synced === readme) {
  console.error('No se encontró la línea "**Version X.Y.Z**" en README.md. Abortando.');
  process.exit(1);
}
writeFileSync(readmePath, synced, "utf8");

// 6. Prepender el CHANGELOG (el tag v<next> todavía no existe; el script
// usa HEAD + la fecha de hoy para esta sección)
run(`node scripts/generate-changelog.mjs --tag v${next}`);

// 7. Commit + tag (se mantiene el subject histórico "Version X.Y.Z")
run("git add package.json package-lock.json README.md CHANGELOG.md");
run(`git commit -m "Version ${next}"`);
run(`git tag v${next}`);

console.log("\nListo. Revisá con:  git show --stat HEAD");
console.log(`Para publicar:      git push && git push origin v${next}`);
