import { getEnv } from "./config/env.js";
import { logger } from "./utils/logger.js";
import app from "./app.js";

async function main() {
  try {
    const env = getEnv();
    app.listen(env.PORT, () => {
      logger.info(`Orchestrator listening on port ${env.PORT}`);
    });
  } catch (err) {
    logger.error("Failed to start", {
      error: err instanceof Error ? err.message : String(err),
    });
    process.exit(1);
  }
}

main();
