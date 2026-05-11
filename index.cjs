// Hostinger/Passenger CommonJS Bridge
// This file is used by the server to boot the ESM application safely.

console.log("-----------------------------------------");
console.log("BOOTING SYSTEM: Passenger CJS Bridge");
console.log("Node Version:", process.version);
console.log("-----------------------------------------");

// Catch any early errors in the dynamic import
import('./src/index.js').catch(err => {
    console.error("\n\n=== FATAL BOOTSTRAP ERROR ===");
    console.error("The application failed to start.");
    console.error("Error Name:", err.name);
    console.error("Error Message:", err.message);
    console.error("Stack Trace:", err.stack);
    console.error("==============================\n\n");
    
    // In a server environment, we want to stay alive long enough to log 
    // but ultimately the process will be restarted by the host.
    process.exit(1);
});

// Prevent the process from exiting on unhandled promise rejections during boot
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at boot:', promise, 'reason:', reason);
});
