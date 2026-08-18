> TRPI can help you create compatible packages. Ask it to bundle your extensions, skills, prompt templates, or themes.

# TRPI Packages

TRPI packages bundle extensions, skills, prompt templates, and themes so you can share them through npm or git. They retain Pi's package format: a package can declare resources in `package.json` under the `pi` key, or use conventional directories.

## Table of Contents

- [Install and Manage](#install-and-manage)
- [Package Sources](#package-sources)
- [Creating a TRPI Package](#creating-a-trpi-package)
- [Package Structure](#package-structure)
- [Dependencies](#dependencies)
- [Package Filtering](#package-filtering)
- [Enable and Disable Resources](#enable-and-disable-resources)
- [Scope and Deduplication](#scope-and-deduplication)

## Install and Manage

> **Security:** TRPI packages run with full system access. Extensions execute arbitrary code, and skills can instruct the model to perform any action including running executables. Review source code before installing third-party packages.

```bash
trpi install npm:@foo/bar@1.0.0
trpi install git:github.com/user/repo@v1
trpi install https://github.com/user/repo  # raw URLs work too
trpi install /absolute/path/to/package
trpi install ./relative/path/to/package

trpi remove npm:@foo/bar
trpi list                     # show installed packages from settings
trpi update                   # update TRPI only
trpi update --all             # update TRPI, update packages, and reconcile pinned git refs
trpi update --extensions      # update packages and reconcile pinned git refs only
trpi update --models          # refresh model catalogs only
trpi update --self            # update TRPI only
trpi update --self --force    # reinstall TRPI even if current
trpi update npm:@foo/bar      # update one package
trpi update --extension npm:@foo/bar
```

These commands manage TRPI packages, and `trpi update` can update a supported TRPI CLI installation. They do not uninstall the CLI itself; remove the extracted release directory or source-built CLI link to uninstall TRPI.

By default, `install` and `remove` write to user settings (`~/.trpi/agent/settings.json`). Use `-l` to write to project settings (`.trpi/settings.json`) instead. Project settings can be shared with your team, and TRPI installs any missing packages automatically on startup after the project is trusted.

To try a package without installing it, use `--extension` or `-e`. This installs to a temporary directory for the current run only:

```bash
trpi -e npm:@foo/bar
trpi -e git:github.com/user/repo
```

## Package Sources

TRPI accepts three source types in settings and `trpi install`.

### npm

```
npm:@scope/pkg@1.2.3
npm:pkg
```

- Versioned specs are pinned and skipped by package updates (`trpi update --extensions`, `trpi update --all`).
- User installs go under `~/.trpi/agent/npm/`.
- Project installs go under `.trpi/npm/`.
- Set `npmCommand` in `settings.json` to pin npm package lookup and install operations to a specific wrapper command such as `mise` or `asdf`.

Example:

```json
{
  "npmCommand": ["mise", "exec", "node@20", "--", "npm"]
}
```

### git

```
git:github.com/user/repo@v1
git:git@github.com:user/repo@v1
https://github.com/user/repo@v1
ssh://git@github.com/user/repo@v1
```

- Without `git:` prefix, only protocol URLs are accepted (`https://`, `http://`, `ssh://`, `git://`).
- With `git:` prefix, shorthand formats are accepted, including `github.com/user/repo` and `git@github.com:user/repo`.
- HTTPS and SSH URLs are both supported.
- SSH URLs use your configured SSH keys automatically (respects `~/.ssh/config`).
- For non-interactive runs (for example CI), you can set `GIT_TERMINAL_PROMPT=0` to disable credential prompts and set `GIT_SSH_COMMAND` (for example `ssh -o BatchMode=yes -o ConnectTimeout=5`) to fail fast.
- Refs are pinned tags or commits. `trpi update --extensions` and `trpi update --all` do not move them to newer refs, but they do reconcile an existing clone to the configured ref.
- Use `trpi install git:host/user/repo@new-ref` to update settings and move an existing package to a new pinned ref.
- Cloned to `~/.trpi/agent/git/<host>/<path>` (global) or `.trpi/git/<host>/<path>` (project).
- When reconciliation changes the checkout, TRPI resets and cleans the clone, then runs `npm install` if `package.json` exists.

**SSH examples:**
```bash
# git@host:path shorthand (requires git: prefix)
trpi install git:git@github.com:user/repo

# ssh:// protocol format
trpi install ssh://git@github.com/user/repo

# With version ref
trpi install git:git@github.com:user/repo@v1.0.0
```

### Local Paths

```
/absolute/path/to/package
./relative/path/to/package
```

Local paths point to files or directories on disk and are added to settings without copying. Relative paths are resolved against the settings file they appear in. If the path is a file, it loads as a single extension. If it is a directory, TRPI loads resources using package rules.

## Creating a TRPI Package

Add the Pi-compatible `pi` manifest to `package.json` or use conventional directories. Keep the `pi-package` keyword for compatibility with existing Pi package tooling.

```json
{
  "name": "my-package",
  "keywords": ["pi-package"],
  "pi": {
    "extensions": ["./extensions"],
    "skills": ["./skills"],
    "prompts": ["./prompts"],
    "themes": ["./themes"]
  }
}
```

Paths are relative to the package root. Arrays support glob patterns and `!exclusions`.

## Package Structure

### Convention Directories

If no `pi` manifest is present, TRPI auto-discovers resources from these directories:

- `extensions/` loads `.ts` and `.js` files
- `skills/` recursively finds `SKILL.md` folders and loads top-level `.md` files as skills
- `prompts/` loads `.md` files
- `themes/` loads `.json` files

## Dependencies

Third party runtime dependencies belong in `dependencies` in `package.json`. Dependencies that do not register extensions, skills, prompt templates, or themes also belong in `dependencies`. When TRPI installs a package from npm or git, it runs `npm install`, so those dependencies are installed automatically.

TRPI bundles Pi's upstream core packages for extensions and skills. If you import any of these, list them in `peerDependencies` with a `"*"` range and do not bundle them: `@earendil-works/pi-ai`, `@earendil-works/pi-agent-core`, `@earendil-works/pi-coding-agent`, `@earendil-works/pi-tui`, `typebox`.

Other compatible Pi packages must be bundled in your tarball. Add them to `dependencies` and `bundledDependencies`, then reference their resources through `node_modules/` paths. TRPI loads packages with separate module roots, so separate installs do not collide or share modules.

Example:

```json
{
  "dependencies": {
    "shitty-extensions": "^1.0.1"
  },
  "bundledDependencies": ["shitty-extensions"],
  "pi": {
    "extensions": ["extensions", "node_modules/shitty-extensions/extensions"],
    "skills": ["skills", "node_modules/shitty-extensions/skills"]
  }
}
```

## Package Filtering

Filter what a package loads using the object form in settings:

```json
{
  "packages": [
    "npm:simple-pkg",
    {
      "source": "npm:my-package",
      "extensions": ["extensions/*.ts", "!extensions/legacy.ts"],
      "skills": [],
      "prompts": ["prompts/review.md"],
      "themes": ["+themes/legacy.json"]
    }
  ]
}
```

`+path` and `-path` are exact paths relative to the package root.

- Omit a key to load all of that type.
- Use `[]` to load none of that type.
- `!pattern` excludes matches.
- `+path` force-includes an exact path.
- `-path` force-excludes an exact path.
- Filters layer on top of the manifest. They narrow down what is already allowed.

## Enable and Disable Resources

Use `trpi config` to enable or disable extensions, skills, prompt templates, and themes from installed packages and local directories. `trpi config` starts in global settings (`~/.trpi/agent/settings.json`); press Tab to switch between global and project-local modes. Use `trpi config -l` to start in project overrides (`.trpi/settings.json`) with inherited global resources dimmed.

## Scope and Deduplication

Packages can appear in both global and project settings. If the same package appears in both, the project entry wins unless the project entry has `autoload: false`, in which case it is applied as a delta over the global entry. Identity is determined by:

- npm: package name
- git: repository URL without ref
- local: resolved absolute path
