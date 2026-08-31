# Security Policy

TR Confidential Cowork is a local coding agent that runs inside the security boundary of the user
who launches it. Users are responsible for monitoring its operations or
containing it within a container, virtual machine, or other sandbox when a
stronger boundary is required.

TR Confidential Cowork treats the local user account and files writable by that account as inside
the same trust boundary as the TR Confidential Cowork process itself. If an attacker can modify
files under the user's home directory, workspace, shell startup files,
environment, or TR Confidential Cowork configuration, they can generally influence TR Confidential Cowork and other
local developer tools. Reports that depend on such prior local write access are
not security vulnerabilities unless they demonstrate how TR Confidential Cowork grants that write
access or crosses an operating-system privilege boundary.

Only install extensions, skills, packages, and tools you trust, and only run
TR Confidential Cowork inside trusted repositories. Files such as `AGENTS.md` and instructions in
source comments can prompt-inject a coding agent; TR Confidential Cowork does not claim to prevent
prompt injection from trusted local inputs.

## Reporting a Vulnerability

If you believe you found a security vulnerability in TR Confidential Cowork or another package in
this repository, open a private report through [GitHub Security
Advisories](https://github.com/Lore-Hex/trpi/security/advisories/new).

Please include:

- A description of the issue and its impact
- Steps to reproduce, proof of concept, or relevant logs
- Affected package, version, commit, or configuration
- Any known mitigations

Do not open a public issue for security-sensitive reports. We will review
reports and coordinate disclosure as appropriate.

## Scope

Security issues in repository code and in the command-line tools, APIs, source
archives, and binaries distributed through Lore-Hex/trpi are in scope.

## Out of Scope

- Local code execution or sandboxing behavior (TR Confidential Cowork intentionally does not
  include a built-in sandbox)
- Behavior of extensions or skills installed by the user
- Risks from working in untrusted repositories
- Risks from installing untrusted extensions, skills, packages, or tools
- Issues caused by untrusted man-in-the-middle proxies
- Public internet exposure of a TR Confidential Cowork installation
- Prompt injection attacks
- Exposed secrets that are third-party/user-controlled credentials
- Reports requiring the ability to create, modify, delete, or replace files,
  directories, symlinks, environment variables, shell configuration, or other
  user-controlled local state on the target machine. This includes `~/.tr-confidential-cowork`,
  `~/.tr-confidential-cowork/agent/models.json`, workspace files, `AGENTS.md`, skills, extensions,
  extension configuration, dotfiles, and files synchronized through NFS, roaming
  profiles, or dotfile managers, unless the report shows how TR Confidential Cowork itself grants
  that access.
- Issues caused by intentionally weakened user configuration
- Resource or denial-of-service claims that require trusted local input or
  configuration
- Reports about malicious model output
- User-approved or user-initiated local actions presented as vulnerabilities

## Notes for Reporters

The most useful reports show a current, reproducible security boundary bypass
with demonstrated impact. Reports that only show expected local-agent behavior,
prompt injection, or a malicious trusted extension/skill are not security
vulnerabilities under this model.

For example, a report showing that malicious contents written to a trusted TR Confidential Cowork
configuration file cause TR Confidential Cowork to execute commands, load attacker-controlled tools,
send credentials to an attacker-controlled endpoint, or otherwise change behavior
is out of scope.

When possible, include the exact affected path, package version or commit SHA,
configuration, and a proof of concept against the latest release or latest
`main`. For dependency reports, include evidence that the shipped dependency is
affected and that the issue is reachable through TR Confidential Cowork. For exposed-secret reports,
include evidence that the credential is owned by Lore-Hex or grants access to
Lore-Hex-controlled infrastructure or services.
