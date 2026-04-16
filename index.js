try {
  console.log("Starting root index.js wrapper...");
  await import('./src/index.js');
} catch (err) {
  console.error("\n\n=== FATAL CRASH ===");
  console.error(err);
  console.error("===================\n\n");
}
