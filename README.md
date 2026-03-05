# Open Claw Mission Control Desktop App

A local-first desktop-style mission control interface for OpenClaw operations.

## What this prototype includes

- **Sleek tabbed UX** to separate workflows and reduce dashboard clutter.
- **Hero metrics** for total agents, active missions, pending approvals, and token throughput.
- **Agent Status Board** for current, completed, and pending agents/tasks.
- **2D Agent Landscape** canvas view mapping agents by status and token footprint.
- **Model Token Usage** panel with per-agent model + token counts.
- **Mission Timeline** for quick chronological mission context.
- **Mission Approval Queue** with instant approve/reject actions.
- **Project Runtime Controls** for pause/resume/**emergency stop** in real time.
- **Secure Vault** for API keys/passwords/SSH secrets (WebCrypto AES-GCM + PBKDF2).
- **Agent Memory Index** with live search.
- **OpenClaw Agent Updater** flow and an action **Audit Trail**.

---

## Beginner-friendly notes: what was added and why

If you are new to shipping apps, here is what was done in plain language:

1. **The app itself was built as static web files** (`index.html`, `styles.css`, `app.js`).
   - This means there is no backend server required for the prototype.
   - You can run it locally with a tiny web server command.

2. **A local installer script was added** (`scripts/install_local.sh`).
   - This copies app files into your user directory.
   - It creates a launcher command called `openclaw-mission-control`.
   - Goal: make running the app easier for non-technical users.

3. **A release packaging script was added** (`scripts/build_release.sh`).
   - This creates a versioned zip file in `dist/`.
   - It also creates a SHA-256 checksum file so users can verify file integrity.
   - Goal: make distribution repeatable and safer.

4. **A version file was added** (`VERSION`).
   - This keeps release naming consistent (`open-claw-mission-control-<version>.zip`).
   - Goal: avoid confusion about what build people are installing.

5. **A GitHub Actions release workflow was added** (`.github/workflows/release.yml`).
   - On tag push (like `v0.1.0`) or manual run:
     - checks JS syntax
     - builds release zip/checksum
     - uploads artifacts
     - publishes a GitHub release on tag builds
   - Goal: one-click / one-tag shipping without manual repetition.

---

## Install (Local)

### Option A: quick run (no install)

```bash
python3 -m http.server 4173
```

Open:

```text
http://127.0.0.1:4173
```

### Option B: user-local install

Use the install script to copy the app into `~/.local/share/open-claw-mission-control` and create a launcher in `~/.local/bin`:

```bash
./scripts/install_local.sh
```

Then run:

```bash
openclaw-mission-control
```

> If `~/.local/bin` is not on your `PATH`, add this line to your shell profile:
>
> `export PATH="$HOME/.local/bin:$PATH"`

---

## Prepare for Shipping (Release)

### 1) Set the version

Edit `VERSION` (example: `0.1.0`).

### 2) Build release artifact locally

```bash
./scripts/build_release.sh
```

Outputs:

- `dist/open-claw-mission-control-<version>.zip`
- `dist/open-claw-mission-control-<version>.sha256`

### 3) Verify checksum

Linux:

```bash
sha256sum -c dist/open-claw-mission-control-<version>.sha256
```

macOS:

```bash
shasum -a 256 dist/open-claw-mission-control-<version>.zip
```

### 4) Ship manually

Attach the zip + checksum to your release page, changelog, or deployment target.

---

## Automated shipping with GitHub Actions

The workflow file is at:

- `.github/workflows/release.yml`

### Automatic release via git tag

1. Make sure `VERSION` matches the tag version (example `0.1.1`).
2. Commit changes.
3. Create and push tag:

```bash
git tag v0.1.1
git push origin v0.1.1
```

What happens automatically:

- Workflow runs `node --check app.js`
- Builds zip/checksum via `./scripts/build_release.sh`
- Uploads artifacts to the workflow run
- Creates/updates GitHub Release with attached files

### Manual run (no tag)

- In GitHub, go to **Actions → Build and Publish Release Artifact → Run workflow**.
- It will build and upload artifacts, but only publish a GitHub Release when running from a `v*` tag.

---

## Recommended shipping checklist

- [ ] Bump `VERSION` and update release notes/changelog.
- [ ] Run static check: `node --check app.js`.
- [ ] Smoke test key flows:
  - [ ] tab navigation
  - [ ] approve/reject
  - [ ] pause/resume/emergency stop
  - [ ] vault store/reveal
  - [ ] memory search
  - [ ] updater + audit logging
- [ ] Build artifact: `./scripts/build_release.sh`.
- [ ] Validate checksum.
- [ ] Publish zip + checksum.
- [ ] (Optional) Create git tag to auto-publish release via GitHub Actions.

---

## Files

- `index.html` – tabbed layout and feature sections.
- `styles.css` – visual theme and responsive components.
- `app.js` – tabs, metrics, 2D map, approvals, controls, vault, memory, updater, audit.
- `VERSION` – release version used by packaging.
- `scripts/install_local.sh` – local installer + launcher creator.
- `scripts/build_release.sh` – release zip and checksum builder.
- `.github/workflows/release.yml` – CI workflow for build/upload/release on tag.
