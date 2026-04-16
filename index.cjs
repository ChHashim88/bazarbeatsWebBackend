// Hostinger/Passenger CJS to ESM Bridge
console.log("Passenger is booting the app via CommonJS Bridge...");

import('./src/index.js').catch(err => {
    console.error("\n\n=== FATAL IMPORT CRASH ===");
    console.error(err);
    console.error("=========================\n\n");
});
