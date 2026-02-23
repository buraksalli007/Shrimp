import { exec } from "child_process";
import { promisify } from "util";
import * as path from "path";
import * as os from "os";
import { logger } from "../utils/logger.js";

const execAsync = promisify(exec);

export async function executeAppStoreUpload(projectId: string): Promise<void> {
  const repoPath = path.join(os.tmpdir(), "orchestrator", projectId);

  const cmd = `cd ${repoPath} && eas build --platform ios --profile production --auto-submit --non-interactive`;

  logger.info("Starting EAS build and submit", { projectId, repoPath });

  return new Promise((resolve, reject) => {
    exec(cmd, { maxBuffer: 50 * 1024 * 1024, timeout: 600_000 }, (err, stdout, stderr) => {
      if (err) {
        logger.error("EAS build failed", {
          projectId,
          error: err.message,
          stderr: stderr?.slice(-500),
        });
        reject(err);
        return;
      }
      logger.info("EAS build and submit completed", { projectId });
      resolve();
    });
  });
}
