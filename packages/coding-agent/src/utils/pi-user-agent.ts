export function getPiUserAgent(version: string): string {
	const runtime = process.versions.bun ? `bun/${process.versions.bun}` : `node/${process.version}`;
	return `tr-cowork/${version} (${process.platform}; ${runtime}; ${process.arch})`;
}
