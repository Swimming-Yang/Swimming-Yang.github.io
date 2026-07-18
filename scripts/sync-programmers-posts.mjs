import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_REPO = "Swimming-Yang/CodingTest";
const GENERATED_MARKER = "<!-- generated: programmers-sync -->";
const PROGRAMMERS_IMAGE = "/assets/images/posts/coding/ps/programmers-logo-dark.png";
const PROGRAMMERS_IMAGE_DARK = "/assets/images/posts/coding/ps/programmers-logo-light.png";
const PROGRAMMERS_IMAGE_ALT = "Programmers 로고";

const CODE_LANGUAGES = new Map([
  [".c", "c"],
  [".cc", "cpp"],
  [".cpp", "cpp"],
  [".cxx", "cpp"],
  [".cs", "csharp"],
  [".go", "go"],
  [".java", "java"],
  [".js", "javascript"],
  [".kt", "kotlin"],
  [".m", "objective-c"],
  [".php", "php"],
  [".py", "python"],
  [".rb", "ruby"],
  [".rs", "rust"],
  [".scala", "scala"],
  [".sql", "sql"],
  [".swift", "swift"],
  [".ts", "typescript"],
]);

const SKIP_DIRS = new Set([".git", ".github", "node_modules", ".tmp"]);
const SPACE_PATTERN = /[\u00a0\u1680\u180e\u2000-\u200d\u202f\u205f\u2060\u3000\ufeff]/gu;

const scriptPath = fileURLToPath(import.meta.url);
const projectRoot = path.resolve(path.dirname(scriptPath), "..");
const sourceRoot = path.resolve(projectRoot, process.argv[2] ?? ".tmp/codingtest");
const postsRoot = path.join(projectRoot, "_posts", "coding", "ps");

function main() {
  if (!fs.existsSync(sourceRoot)) {
    fail(`CodingTest checkout was not found: ${sourceRoot}`);
  }

  fs.mkdirSync(postsRoot, { recursive: true });

  const existingPosts = readExistingGeneratedPosts(postsRoot);
  const problemDirs = findProgrammersProblemDirs(sourceRoot);
  let written = 0;
  let unchanged = 0;

  for (const problemDir of problemDirs) {
    const problem = readProblem(problemDir);
    const targetPath = existingPosts.get(problem.key) ?? makePostPath(problem);
    const content = renderPost(problem, targetPath);
    const previous = fs.existsSync(targetPath) ? fs.readFileSync(targetPath, "utf8") : "";

    if (previous === content) {
      unchanged += 1;
      continue;
    }

    fs.writeFileSync(targetPath, content, "utf8");
    written += 1;
  }

  console.log(`Programmers problems found: ${problemDirs.length}`);
  console.log(`Posts written: ${written}`);
  console.log(`Posts unchanged: ${unchanged}`);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function readExistingGeneratedPosts(root) {
  const posts = new Map();

  if (!fs.existsSync(root)) {
    return posts;
  }

  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith(".md")) {
      continue;
    }

    const postPath = path.join(root, entry.name);
    const content = fs.readFileSync(postPath, "utf8");

    if (!content.includes(GENERATED_MARKER)) {
      continue;
    }

    const problemId = frontMatterValue(content, "problem_id");
    const sourcePath = frontMatterValue(content, "source_path");
    const key = problemId ? `id:${problemId}` : sourcePath ? `path:${sourcePath}` : null;

    if (key) {
      posts.set(key, postPath);
    }
  }

  return posts;
}

function findProgrammersProblemDirs(root) {
  const dirs = [];

  function walk(current) {
    const entries = fs.readdirSync(current, { withFileTypes: true });
    const names = new Set(entries.map((entry) => entry.name));

    if (isProgrammersPath(current) && names.has("README.md") && entries.some(isCodeFile)) {
      dirs.push(current);
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory() || SKIP_DIRS.has(entry.name)) {
        continue;
      }

      walk(path.join(current, entry.name));
    }
  }

  walk(root);
  return dirs.sort((left, right) => left.localeCompare(right, "ko"));
}

function isCodeFile(entry) {
  return entry.isFile() && CODE_LANGUAGES.has(path.extname(entry.name).toLowerCase());
}

function isProgrammersPath(dir) {
  return relativeSegments(sourceRoot, dir).some((segment) => {
    const normalized = normalizeText(segment).toLowerCase();
    return normalized === "프로그래머스" || normalized.includes("programmers");
  });
}

function readProblem(problemDir) {
  const readmePath = path.join(problemDir, "README.md");
  const readme = fs.readFileSync(readmePath, "utf8");
  const relativeDir = toPosixPath(path.relative(sourceRoot, problemDir));
  const segments = relativeDir.split("/");
  const programmersIndex = segments.findIndex((segment) => {
    const normalized = normalizeText(segment).toLowerCase();
    return normalized === "프로그래머스" || normalized.includes("programmers");
  });

  const pathLevel = programmersIndex >= 0 ? segments[programmersIndex + 1] : "";
  const directoryTitle = segments.at(-1) ?? "programmers-solution";
  const parsedDirectory = parseDirectoryTitle(directoryTitle);
  const parsedReadme = parseReadme(readme);
  const codeFiles = fs
    .readdirSync(problemDir, { withFileTypes: true })
    .filter(isCodeFile)
    .map((entry) => path.join(problemDir, entry.name))
    .sort((left, right) => left.localeCompare(right, "ko"));

  const problemId = parsedReadme.id ?? parsedDirectory.id ?? "";
  const title = parsedReadme.title ?? parsedDirectory.title;
  const level = normalizeLevel(parsedReadme.level ?? pathLevel);
  const problemUrl =
    parsedReadme.problemUrl ??
    (problemId ? `https://school.programmers.co.kr/learn/courses/30/lessons/${problemId}` : "");
  const submittedAt = parsedReadme.submittedAt ?? nowInKorea();
  const key = problemId ? `id:${problemId}` : `path:${relativeDir}`;

  return {
    key,
    title,
    problemId,
    level,
    problemUrl,
    statement: parsedReadme.statement ?? "",
    constraints: parsedReadme.constraints ?? "",
    examples: parsedReadme.examples ?? "",
    submittedAt,
    relativeDir,
    sourceUrl: `https://github.com/${SOURCE_REPO}/tree/main/${encodePath(relativeDir)}`,
    codeFiles: codeFiles.map((filePath) => ({
      name: path.basename(filePath),
      language: CODE_LANGUAGES.get(path.extname(filePath).toLowerCase()) ?? "",
      content: fs.readFileSync(filePath, "utf8").trimEnd(),
    })),
  };
}

function parseReadme(readme) {
  const heading = readme.match(/^#\s*\[([^\]]+)\]\s*(.+?)\s*-\s*(\d+)\s*$/mu);
  const problemUrl = readme.match(/https:\/\/school\.programmers\.co\.kr\/learn\/courses\/\d+\/lessons\/\d+/u)?.[0];
  const submittedAt = parseSubmittedAt(readme);
  const sections = parseProblemSections(readme);

  if (!heading) {
    return { problemUrl, submittedAt, ...sections };
  }

  return {
    level: heading[1],
    title: normalizeText(heading[2]),
    id: heading[3],
    problemUrl,
    submittedAt,
    ...sections,
  };
}

function parseProblemSections(readme) {
  const constraints = extractReadmeSection(
    readme,
    /<h5>\s*제한사항\s*<\/h5>\s*/iu,
    /(?:\r?\n\s*<hr>\s*\r?\n+)?\s*<h5>\s*입출력\s*예\s*<\/h5>/iu,
  );
  const examples = extractReadmeSection(readme, /<h5>\s*입출력\s*예\s*<\/h5>\s*/iu, /\r?\n>\s*출처:/u);

  return {
    statement: extractReadmeSection(
      readme,
      /###\s*문제\s*설명\s*\r?\n+/u,
      /(?:\r?\n\s*<hr>\s*\r?\n+)?\s*<h5>\s*제한사항\s*<\/h5>/iu,
    ),
    constraints: htmlToPlainText(constraints),
    examples: htmlToPlainText(examples),
  };
}

function extractReadmeSection(readme, startPattern, endPattern) {
  const startMatch = startPattern.exec(readme);

  if (!startMatch) {
    return "";
  }

  const startIndex = startMatch.index + startMatch[0].length;
  const rest = readme.slice(startIndex);
  const endMatch = endPattern.exec(rest);
  const rawSection = endMatch ? rest.slice(0, endMatch.index) : rest;

  return cleanProblemSection(rawSection);
}

function cleanProblemSection(value) {
  return value
    .replace(/^\s*<hr>\s*/iu, "")
    .replace(/\s*<hr>\s*$/iu, "")
    .trim();
}

function htmlToPlainText(value) {
  const text = value
    .replace(/\r\n?/gu, "\n")
    .replace(/<br\s*\/?>/giu, "\n")
    .replace(/<\/p>\s*/giu, "\n\n")
    .replace(/<p[^>]*>/giu, "")
    .replace(/<li[^>]*>/giu, "- ")
    .replace(/<\/li>\s*/giu, "\n")
    .replace(/<\/(?:th|td)>\s*<(?=(?:th|td)\b)/giu, " | <")
    .replace(/<tr[^>]*>/giu, "")
    .replace(/<\/tr>\s*/giu, "\n")
    .replace(/<\/?(?:table|thead|tbody|th|td)[^>]*>/giu, "")
    .replace(/<\/?(?:ul|ol)[^>]*>/giu, "")
    .replace(/<\/?(?:div|pre|code)[^>]*>/giu, "")
    .replace(/<[^>]+>/gu, "")
    .replace(/[ \t]+\n/gu, "\n")
    .replace(/\n[ \t]+/gu, "\n")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();

  return decodeHtmlEntities(text);
}

function decodeHtmlEntities(value) {
  return value
    .replace(/&nbsp;/giu, " ")
    .replace(/&lt;/giu, "<")
    .replace(/&gt;/giu, ">")
    .replace(/&le;/giu, "≤")
    .replace(/&ge;/giu, "≥")
    .replace(/&times;/giu, "×")
    .replace(/&minus;/giu, "−")
    .replace(/&amp;/giu, "&")
    .replace(/&quot;/giu, '"')
    .replace(/&#39;/giu, "'")
    .replace(/&#(\d+);/gu, (_, codePoint) => String.fromCodePoint(Number(codePoint)))
    .replace(/&#x([\da-f]+);/giu, (_, codePoint) => String.fromCodePoint(Number.parseInt(codePoint, 16)));
}

function parseSubmittedAt(readme) {
  const submittedSection = readme.match(/###\s*제출\s*일자\s*\r?\n+([^\r\n]+)/u);
  const submittedLine = submittedSection?.[1] ?? "";
  const koreanDate = submittedLine.match(
    /(\d{4})년\s*(\d{1,2})월\s*(\d{1,2})일\s*(\d{1,2}):(\d{2}):(\d{2})/u,
  );

  if (koreanDate) {
    const [, year, month, day, hour, minute, second] = koreanDate;
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${minute}:${second} +0900`;
  }

  const isoDate = submittedLine.match(/(\d{4})-(\d{1,2})-(\d{1,2})(?:[ T](\d{1,2}):(\d{2}):(\d{2}))?/u);

  if (isoDate) {
    const [, year, month, day, hour = "00", minute = "00", second = "00"] = isoDate;
    return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${minute}:${second} +0900`;
  }

  return null;
}

function parseDirectoryTitle(name) {
  const normalized = normalizeText(name);
  const match = normalized.match(/^(\d+)\.\s*(.+)$/u);

  if (!match) {
    return { id: "", title: normalized };
  }

  return {
    id: match[1],
    title: match[2],
  };
}

function renderPost(problem, targetPath) {
  const date = existingDate(targetPath) ?? problem.submittedAt;
  const title = `[Programmers] ${problem.title}`;
  const description = `Programmers ${problem.level || "문제"} 풀이`;

  return `${renderFrontMatter({
    layout: "post",
    title,
    date,
    categories: "[coding, ps]",
    topic: "ps",
    description,
    image: PROGRAMMERS_IMAGE,
    image_dark: PROGRAMMERS_IMAGE_DARK,
    image_alt: PROGRAMMERS_IMAGE_ALT,
    tags: "[programmers, ps, coding-test]",
    source: "programmers",
    problem_id: problem.problemId,
    problem_level: problem.level,
    problem_url: problem.problemUrl,
    source_repo: SOURCE_REPO,
    source_path: problem.relativeDir,
  })}
${GENERATED_MARKER}

## 문제 정보

---

| 항목 | 내용 |
| --- | --- |
| 플랫폼 | Programmers |
${problem.level ? `| 난이도 | ${escapeTableCell(problem.level)} |\n` : ""}${problem.problemId ? `| 문제 번호 | ${escapeTableCell(problem.problemId)} |\n` : ""}${problem.problemUrl ? `| 문제 링크 | [문제 보기](${problem.problemUrl}) |\n` : ""}| GitHub Link | [${escapeTableCell(problem.relativeDir)}](${problem.sourceUrl}) |

${renderProblemDetails(problem)}
## 풀이 코드

---

${problem.codeFiles.map(renderCodeFile).join("\n\n")}
`;
}

function renderProblemDetails(problem) {
  const sections = [];

  if (problem.statement && problem.statement.trim() !== "") {
    sections.push(`## 문제\n\n---\n\n${problem.statement}`);
  }

  if (problem.constraints && problem.constraints.trim() !== "") {
    sections.push(`## 제한사항\n\n---\n\n${renderPlainTextBlock(problem.constraints)}`);
  }

  if (problem.examples && problem.examples.trim() !== "") {
    sections.push(`## 입출력 예\n\n---\n\n${renderExampleBlocks(problem.examples)}`);
  }

  return sections.length > 0 ? `${sections.join("\n\n")}\n\n` : "";
}

function renderPlainTextBlock(content) {
  const fence = codeFenceFor(content);
  return `${fence}plaintext\n${content}\n${fence}`;
}

function renderExampleBlocks(content) {
  const blocks = splitExampleBlocks(content);

  if (blocks.length === 0) {
    return renderPlainTextBlock(content);
  }

  return blocks
    .map((block) => `<p class="programmers-example-label"><strong>${block.label}</strong></p>\n\n${renderPlainTextBlock(block.value)}`)
    .join("\n\n");
}

function splitExampleBlocks(content) {
  const lines = content.replace(/\r\n?/gu, "\n").split("\n");
  const blocks = [];
  let current = null;

  for (const line of lines) {
    const label = normalizeExampleLabel(line);

    if (label) {
      if (current && current.value.length > 0) {
        blocks.push(current);
      }

      current = { label, value: [] };
      continue;
    }

    if (current) {
      current.value.push(line);
    }
  }

  if (current && current.value.length > 0) {
    blocks.push(current);
  }

  return blocks
    .map((block) => ({
      label: block.label,
      value: block.value.join("\n").trim(),
    }))
    .filter((block) => block.value !== "");
}

function normalizeExampleLabel(value) {
  const match = normalizeText(value).match(/^(입력|출력)\s*#\s*(\d+)/u);
  return match ? `${match[1]} #${match[2]}` : "";
}

function renderFrontMatter(values) {
  const lines = ["---"];

  for (const [key, value] of Object.entries(values)) {
    if (value === null || value === undefined || value === "") {
      continue;
    }

    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      lines.push(`${key}: ${value}`);
    } else if (key === "date") {
      lines.push(`${key}: ${value}`);
    } else {
      lines.push(`${key}: ${quoteYaml(value)}`);
    }
  }

  lines.push("---");
  return lines.join("\n");
}

function renderCodeFile(codeFile) {
  const fence = codeFenceFor(codeFile.content);
  return `### ${codeFile.name}

${fence}${codeFile.language}
${codeFile.content}
${fence}`;
}

function existingDate(postPath) {
  if (!fs.existsSync(postPath)) {
    return null;
  }

  return frontMatterValue(fs.readFileSync(postPath, "utf8"), "date");
}

function makePostPath(problem) {
  const datePart = problem.submittedAt.slice(0, 10);
  const slug = problem.problemId ? `programmers-${problem.problemId}` : `programmers-${shortHash(problem.relativeDir)}`;
  return path.join(postsRoot, `${datePart}-${slug}.md`);
}

function normalizeLevel(value) {
  const normalized = normalizeText(value ?? "");

  if (!normalized) {
    return "";
  }

  const levelNumber = normalized.match(/(?:level|lv)?\s*\.?\s*(\d+)/iu)?.[1];
  return levelNumber ? `Lv.${levelNumber}` : normalized;
}

function normalizeText(value) {
  return String(value ?? "")
    .replace(SPACE_PATTERN, " ")
    .replace(/\s+/gu, " ")
    .trim();
}

function quoteYaml(value) {
  return `"${String(value).replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

function frontMatterValue(content, key) {
  const match = content.match(new RegExp(`^${key}:\\s*(.+?)\\s*$`, "m"));
  if (!match) {
    return null;
  }

  return match[1].replace(/^["']|["']$/g, "");
}

function relativeSegments(root, target) {
  const relative = path.relative(root, target);
  return relative ? relative.split(path.sep) : [];
}

function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

function encodePath(value) {
  return value.split("/").map(encodeURIComponent).join("/");
}

function codeFenceFor(content) {
  const runs = content.match(/`{3,}/g) ?? [];
  const length = Math.max(3, ...runs.map((run) => run.length + 1));
  return "`".repeat(length);
}

function escapeTableCell(value) {
  return String(value).replace(/\|/g, "\\|");
}

function nowInKorea() {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  })
    .formatToParts(new Date())
    .reduce((acc, part) => {
      acc[part.type] = part.value;
      return acc;
    }, {});

  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second} +0900`;
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function shortHash(value) {
  let hash = 0;

  for (const char of value) {
    hash = (hash * 31 + char.codePointAt(0)) >>> 0;
  }

  return hash.toString(36);
}

main();
