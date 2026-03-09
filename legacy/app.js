const state = {
  agents: {
    current: [
      { name: "Recon-Alpha", task: "Map mission dependencies", model: "gpt-5.2-codex", tokens: 4110 },
      { name: "Ops-Beta", task: "Prepare deployment package", model: "gpt-5.2-codex", tokens: 3580 }
    ],
    completed: [{ name: "QA-Delta", task: "Validated memory indexing", model: "gpt-5.2-codex", tokens: 1940 }],
    pending: [{ name: "Audit-Gamma", task: "Review credential access rules", model: "gpt-5.2-codex", tokens: 0 }]
  },
  approvals: [
    { id: 1, mission: "M-204", item: "Approve staging rollout", status: "pending" },
    { id: 2, mission: "M-205", item: "Reject unsafe plugin", status: "pending" }
  ],
  projects: [
    { id: "P-11", name: "OpenClaw Core", status: "running" },
    { id: "P-12", name: "Memory Service", status: "running" },
    { id: "P-13", name: "Sandbox Worker", status: "paused" }
  ],
  timeline: [
    { time: "08:10", event: "Mission M-204 created and queued for staging." },
    { time: "08:24", event: "Recon-Alpha attached dependency graph." },
    { time: "08:33", event: "Approval required for rollout gate." },
    { time: "08:50", event: "Emergency stop playbook verified for OpenClaw Core." }
  ],
  memory: [
    { agent: "Recon-Alpha", mission: "M-204", note: "Need elevated auth to access logs." },
    { agent: "Ops-Beta", mission: "M-205", note: "Customer requested rapid rollback pathway." },
    { agent: "QA-Delta", mission: "M-200", note: "Regression suite passed on local-only mode." }
  ],
  audit: []
};

const $ = (id) => document.getElementById(id);

function allAgents() {
  return [...state.agents.current, ...state.agents.completed, ...state.agents.pending];
}

function setTab(tabName) {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.classList.toggle("active", tab.dataset.tab === tabName);
  });

  document.querySelectorAll(".tab-panel").forEach((panel) => {
    panel.classList.toggle("active", panel.dataset.panel === tabName);
  });

  if (tabName === "agents") {
    drawAgentLandscape();
  }
}

function setupTabs() {
  document.querySelectorAll(".tab").forEach((tab) => {
    tab.addEventListener("click", () => setTab(tab.dataset.tab));
  });
}

function addAudit(event) {
  state.audit.unshift({ at: new Date().toLocaleTimeString(), event });
  renderAudit();
}

function renderHeroMetrics() {
  const agents = allAgents();
  const tokenTotal = agents.reduce((sum, agent) => sum + agent.tokens, 0);
  const pendingApprovals = state.approvals.filter((item) => item.status === "pending").length;

  $("metric-agents").textContent = agents.length;
  $("metric-missions").textContent = state.timeline.length;
  $("metric-approvals").textContent = pendingApprovals;
  $("metric-tokens").textContent = tokenTotal.toLocaleString();
}

function renderAgents() {
  const host = $("agent-columns");
  host.innerHTML = "";

  ["current", "completed", "pending"].forEach((status) => {
    const col = document.createElement("div");
    col.className = "column";
    col.innerHTML = `<h3>${status.toUpperCase()}</h3>`;

    state.agents[status].forEach((agent) => {
      const item = document.createElement("div");
      item.className = "item";
      item.innerHTML = `<strong>${agent.name}</strong><br><small>${agent.task}</small>`;
      col.appendChild(item);
    });

    host.appendChild(col);
  });
}

function renderTokenUsage() {
  const agents = allAgents();
  const total = agents.reduce((sum, agent) => sum + agent.tokens, 0);
  const running = state.agents.current.reduce((sum, agent) => sum + agent.tokens, 0);

  $("token-summary").innerHTML = `<strong>Total Tokens:</strong> ${total.toLocaleString()}<br><small>Active agents this session: ${running.toLocaleString()}</small>`;

  const list = $("token-list");
  list.innerHTML = "";

  agents.forEach((agent) => {
    const row = document.createElement("li");
    row.className = "item token-row";
    row.innerHTML = `<span><strong>${agent.name}</strong><br><small>${agent.model}</small></span><strong>${agent.tokens.toLocaleString()}</strong>`;
    list.appendChild(row);
  });
}

function drawAgentLandscape() {
  const canvas = $("agent-canvas");
  if (!canvas) return;

  const ctx = canvas.getContext("2d");
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  const lanes = [
    { key: "current", color: "#42df9f", y: 135, label: "Current" },
    { key: "completed", color: "#4cc4ff", y: 285, label: "Completed" },
    { key: "pending", color: "#ffd36e", y: 435, label: "Pending" }
  ];

  ctx.strokeStyle = "#2d3f66";
  ctx.lineWidth = 1.2;
  for (let y = 40; y < height; y += 36) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.font = "600 18px Inter, sans-serif";
  ctx.fillStyle = "#9bb0d1";

  lanes.forEach((lane) => {
    ctx.fillText(`${lane.label} Zone`, 20, lane.y - 42);
    ctx.strokeStyle = "#2c3b61";
    ctx.strokeRect(18, lane.y - 26, width - 36, 100);

    state.agents[lane.key].forEach((agent, index) => {
      const x = 120 + index * 250;
      const y = lane.y + 20;

      ctx.beginPath();
      ctx.fillStyle = lane.color;
      ctx.arc(x, y, 30, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = "#08101e";
      ctx.font = "12px Inter, sans-serif";
      ctx.fillText(agent.name.slice(0, 11), x - 34, y + 4);

      ctx.fillStyle = "#dce6f5";
      ctx.fillText(`${agent.tokens.toLocaleString()} tok`, x - 38, y + 52);

      ctx.strokeStyle = "rgba(76,196,255,0.5)";
      ctx.beginPath();
      ctx.moveTo(x + 30, y);
      ctx.lineTo(x + 90, y);
      ctx.stroke();
    });
  });
}

function renderTimeline() {
  const host = $("mission-timeline");
  host.innerHTML = "";

  state.timeline.forEach((item) => {
    const li = document.createElement("li");
    li.innerHTML = `<strong>${item.time}</strong><br><small>${item.event}</small>`;
    host.appendChild(li);
  });
}

function renderApprovals() {
  const list = $("approval-list");
  list.innerHTML = "";

  state.approvals.forEach((approval) => {
    const li = document.createElement("li");
    li.className = "item";

    if (approval.status === "pending") {
      li.innerHTML = `<strong>${approval.mission}</strong> — ${approval.item}`;
      const row = document.createElement("div");
      row.className = "row";

      const approveBtn = document.createElement("button");
      approveBtn.textContent = "Approve";
      approveBtn.onclick = () => {
        approval.status = "approved";
        addAudit(`Approval accepted: ${approval.mission}`);
        renderApprovals();
        renderHeroMetrics();
      };

      const rejectBtn = document.createElement("button");
      rejectBtn.className = "danger";
      rejectBtn.textContent = "Reject";
      rejectBtn.onclick = () => {
        approval.status = "rejected";
        addAudit(`Approval rejected: ${approval.mission}`);
        renderApprovals();
        renderHeroMetrics();
      };

      row.append(approveBtn, rejectBtn);
      li.appendChild(row);
    } else {
      li.innerHTML = `<strong>${approval.mission}</strong> — ${approval.item}<br><small>Status: ${approval.status}</small>`;
    }

    list.appendChild(li);
  });
}

function renderProjects() {
  const host = $("project-list");
  host.innerHTML = "";

  state.projects.forEach((project) => {
    const div = document.createElement("div");
    div.className = "item";
    div.innerHTML = `<strong>${project.name}</strong> <small>(${project.status})</small>`;

    const row = document.createElement("div");
    row.className = "row";

    const pause = document.createElement("button");
    pause.className = "secondary";
    pause.textContent = "Pause";
    pause.onclick = () => {
      project.status = "paused";
      addAudit(`Paused project ${project.id}`);
      renderProjects();
    };

    const resume = document.createElement("button");
    resume.className = "secondary";
    resume.textContent = "Resume";
    resume.onclick = () => {
      project.status = "running";
      addAudit(`Resumed project ${project.id}`);
      renderProjects();
    };

    const stop = document.createElement("button");
    stop.className = "danger";
    stop.textContent = "Emergency Stop";
    stop.onclick = () => {
      project.status = "stopped";
      addAudit(`Emergency stop executed on ${project.id}`);
      renderProjects();
    };

    row.append(pause, resume, stop);
    div.appendChild(row);
    host.appendChild(div);
  });
}

function renderMemory() {
  const query = $("memory-search").value.trim().toLowerCase();
  const host = $("memory-list");
  host.innerHTML = "";

  state.memory
    .filter((entry) => `${entry.agent} ${entry.mission} ${entry.note}`.toLowerCase().includes(query || ""))
    .forEach((entry) => {
      const li = document.createElement("li");
      li.className = "item";
      li.innerHTML = `<strong>${entry.agent}</strong> · ${entry.mission}<br><small>${entry.note}</small>`;
      host.appendChild(li);
    });
}

async function deriveKey(passphrase, salt) {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey("raw", enc.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 120000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

function b64FromBuffer(buf) {
  return btoa(String.fromCharCode(...new Uint8Array(buf)));
}

function bufferFromB64(value) {
  return Uint8Array.from(atob(value), (c) => c.charCodeAt(0)).buffer;
}

async function storeVaultEntry(e) {
  e.preventDefault();
  const entry = {
    name: $("vault-name").value,
    user: $("vault-user").value,
    secret: $("vault-secret").value
  };
  const passphrase = $("vault-passphrase").value;

  const salt = crypto.getRandomValues(new Uint8Array(16));
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await deriveKey(passphrase, salt);

  const payload = new TextEncoder().encode(JSON.stringify(entry));
  const encrypted = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, payload);

  const records = JSON.parse(localStorage.getItem("ocmc-vault") ?? "[]");
  records.push({ salt: b64FromBuffer(salt), iv: b64FromBuffer(iv), blob: b64FromBuffer(encrypted), name: entry.name });
  localStorage.setItem("ocmc-vault", JSON.stringify(records));

  e.target.reset();
  addAudit(`Vault entry stored: ${entry.name}`);
  renderVault();
}

async function revealVault(index) {
  const passphrase = prompt("Passphrase for vault decryption:");
  if (!passphrase) return;

  try {
    const records = JSON.parse(localStorage.getItem("ocmc-vault") ?? "[]");
    const selected = records[index];
    const key = await deriveKey(passphrase, new Uint8Array(bufferFromB64(selected.salt)));
    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv: new Uint8Array(bufferFromB64(selected.iv)) },
      key,
      bufferFromB64(selected.blob)
    );

    const data = JSON.parse(new TextDecoder().decode(decrypted));
    alert(`Name: ${data.name}\nUser: ${data.user || "(none)"}\nSecret: ${data.secret}`);
    addAudit(`Vault entry viewed: ${data.name}`);
  } catch {
    alert("Unable to decrypt entry. Check passphrase.");
    addAudit("Vault decrypt failed");
  }
}

function renderVault() {
  const host = $("vault-entries");
  host.innerHTML = "";

  const records = JSON.parse(localStorage.getItem("ocmc-vault") ?? "[]");
  records.forEach((record, index) => {
    const row = document.createElement("div");
    row.className = "item row";
    row.innerHTML = `<strong>${record.name}</strong>`;

    const button = document.createElement("button");
    button.textContent = "Reveal";
    button.onclick = () => revealVault(index);
    row.appendChild(button);

    host.appendChild(row);
  });
}

function renderAudit() {
  const host = $("audit-list");
  host.innerHTML = "";

  state.audit.slice(0, 12).forEach((entry) => {
    const li = document.createElement("li");
    li.className = "item";
    li.innerHTML = `<strong>${entry.at}</strong><br><small>${entry.event}</small>`;
    host.appendChild(li);
  });
}

function setupUpdater() {
  const check = $("check-update");
  const apply = $("apply-update");
  const status = $("update-status");
  const version = $("current-version");

  check.onclick = () => {
    status.textContent = "Update available: v1.5.0";
    apply.disabled = false;
    addAudit("Update check found v1.5.0");
  };

  apply.onclick = () => {
    version.textContent = "v1.5.0";
    status.textContent = "Agent runtime updated locally. Restart suggested.";
    apply.disabled = true;
    addAudit("Updated OpenClaw agent runtime to v1.5.0");
  };
}

function init() {
  setupTabs();
  renderHeroMetrics();
  renderAgents();
  renderApprovals();
  renderProjects();
  renderTimeline();
  renderMemory();
  renderVault();
  renderAudit();
  setupUpdater();
  renderTokenUsage();
  drawAgentLandscape();

  $("memory-search").addEventListener("input", renderMemory);
  $("vault-form").addEventListener("submit", storeVaultEntry);
}

init();
