/**
 * Root index.js
 * This serves as an alternative entry point for environments that support ESM directly.
 */

const startApp = async () => {
  try {
    console.log("Starting application in ESM mode...");
    await import('./src/index.js');
  } catch (err) {
    console.error("\n\n=== FATAL ESM BOOT ERROR ===");
    console.error(err);
    console.error("============================\n\n");
    process.exit(1);
  }
};

startApp();
