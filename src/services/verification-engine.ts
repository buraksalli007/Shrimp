import { exec } from "child_process";
import { promisify } from "util";
import * as fs from "fs/promises";
import * as path from "path";
import * as os from "os";
import { VerificationResult } from "../types/index.js";
import { getEnv } from "../config/env.js";
import { logger } from "../utils/logger.js";

const execAsync = promisify(exec);

async function runCommand(
  cwd: string,
  command: string,
  timeoutMs: number
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  try {
    const { stdout, stderr } = await execAsync(command, {
      cwd,
      timeout: timeoutMs / 1000,
      maxBuffer: 10 * 1024 * 1024,
    });
    return { stdout: stdout ?? "", stderr: stderr ?? "", code: 0 };
  } catch (err: unknown) {
    const execErr = err as { stdout?: string; stderr?: string; killed?: boolean };
    return {
      stdout: execErr.stdout ?? "",
      stderr: execErr.stderr ?? String(err),
      code: execErr.killed ? -1 : 1,
    };
  }
}

function extractErrors(stdout: string, stderr: string): string[] {
  const errors: string[] = [];
  const combined = `${stdout}\n${stderr}`.split("\n");

  for (const line of combined) {
    const trimmed = line.trim();
    if (
      trimmed.includes("error") ||
      trimmed.includes("Error") ||
      trimmed.includes("ERR!") ||
      trimmed.includes("failed") ||
      trimmed.includes("Failed") ||
      trimmed.match(/^[A-Za-z]+\.tsx?\(\d+,\d+\):/)
    ) {
      if (trimmed.length > 0 && trimmed.length < 500) {
        errors.push(trimmed);
      }
    }
  }

  if (errors.length === 0 && (stdout || stderr)) {
    const lastLines = combined.filter(Boolean).slice(-10);
    if (lastLines.length > 0) {
      errors.push(...lastLines.map((l) => l.trim()).filter(Boolean));
    }
  }

  return [...new Set(errors)].slice(0, 20);
}

export async function verifyProject(
  repoPath: string,
  options?: { useBun?: boolean }
): Promise<VerificationResult> {
  const env = getEnv();
  const timeoutMs = env.VERIFICATION_TIMEOUT_MS;
  const useBun = options?.useBun ?? true;
  const packageManager = useBun ? "bun" : "npm";

  const errors: string[] = [];
  let allStdout = "";
  let allStderr = "";

  try {
    const packageJsonPath = path.join(repoPath, "package.json");
    await fs.access(packageJsonPath);
  } catch {
    return {
      success: false,
      errors: ["package.json not found or not accessible"],
    };
  }

  const installCmd = packageManager === "bun" ? "bun install" : "npm install";
  logger.info("Running install", { repoPath, cmd: installCmd });
  const installResult = await runCommand(repoPath, installCmd, timeoutMs);
  allStdout += installResult.stdout;
  allStderr += installResult.stderr;
  if (installResult.code !== 0) {
    errors.push(...extractErrors(installResult.stdout, installResult.stderr));
  }

  const lintCmd = packageManager === "bun" ? "bun run lint" : "npx eslint .";

  try {
    const lintResult = await runCommand(repoPath, lintCmd, Math.min(timeoutMs, 60_000));
    allStdout += lintResult.stdout;
    allStderr += lintResult.stderr;
    if (lintResult.code !== 0) {
      errors.push(...extractErrors(lintResult.stdout, lintResult.stderr));
    }
  } catch {
  }

  const testCmd = packageManager === "bun" ? "bun test" : "npm test";
  try {
    const testResult = await runCommand(repoPath, testCmd, timeoutMs);
    allStdout += testResult.stdout;
    allStderr += testResult.stderr;
    if (testResult.code !== 0) {
      errors.push(...extractErrors(testResult.stdout, testResult.stderr));
    }
  } catch {
  }

  const expoConfigPath = path.join(repoPath, "app.json");
  try {
    await fs.access(expoConfigPath);
    try {
      const expoDoctorResult = await runCommand(
        repoPath,
        "npx expo-doctor",
        Math.min(timeoutMs, 30_000)
      );
      allStdout += expoDoctorResult.stdout;
      allStderr += expoDoctorResult.stderr;
      if (expoDoctorResult.code !== 0) {
        const doctorErrors = extractErrors(expoDoctorResult.stdout, expoDoctorResult.stderr);
        if (doctorErrors.length > 0) {
          errors.push(...doctorErrors.slice(0, 5));
        }
      }
    } catch {
    }
  } catch {
  }

  const success = errors.length === 0;
  logger.info("Verification complete", {
    repoPath,
    success,
    errorCount: errors.length,
    errors: errors.slice(0, 5),
  });

  return {
    success,
    errors,
    stdout: allStdout || undefined,
    stderr: allStderr || undefined,
  };
}

export async function cloneOrPullRepo(
  githubRepo: string,
  branch: string,
  targetDir: string
): Promise<string> {
  const env = getEnv();
  let cloneUrl = githubRepo.startsWith("http")
    ? githubRepo
    : `https://github.com/${githubRepo}.git`;
  if (env.GITHUB_TOKEN) {
    cloneUrl = cloneUrl.replace("https://", `https://${env.GITHUB_TOKEN}@`);
  }

  try {
    await fs.access(targetDir);
    const pullResult = await runCommand(
      targetDir,
      `git pull origin ${branch}`,
      30_000
    );
    if (pullResult.code !== 0) {
      logger.warn("Git pull failed, trying fresh clone", { stderr: pullResult.stderr });
      await fs.rm(targetDir, { recursive: true });
    } else {
      return targetDir;
    }
  } catch {
  }

  const parentDir = path.dirname(targetDir);
  await fs.mkdir(parentDir, { recursive: true });
  const { stdout, stderr } = await execAsync(
    `git clone --depth 1 --branch ${branch} ${cloneUrl} ${targetDir}`,
    { timeout: 60_000 }
  );
  if (stderr && !stderr.includes("Cloning into")) {
    logger.warn("Git clone stderr", { stderr });
  }
  return targetDir;
}
