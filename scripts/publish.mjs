#!/usr/bin/env node

console.error(
	"TR Confidential Cowork npm publishing is disabled: the fork currently ships self-contained GitHub source archives and binaries only.",
);
console.error("Publishing the inherited workspace packages would omit TR Confidential Cowork changes or target package names owned upstream.");
process.exit(1);
