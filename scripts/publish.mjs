#!/usr/bin/env node

console.error(
	"TRPI npm publishing is disabled: the fork currently ships self-contained GitHub source archives and binaries only.",
);
console.error("Publishing the inherited workspace packages would omit TRPI changes or target package names owned upstream.");
process.exit(1);
