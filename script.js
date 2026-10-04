//  CONSTANTS & STATE 
const CATEGORIES = [
  "Housing", "Food", "Transport", "Shopping", "Entertainment",
  "Health", "Education", "Bills", "Salary", "Freelance", "Other"
];

const demoTransactions = [
  //  JULY 2026 
  { id: 1, type: "income",  amount: 620.00, date: "2026-07-01", category: "Salary",        desc: "Part-time job — July" },
  { id: 2, type: "expense", amount: 42.80,  date: "2026-07-06", category: "Food",          desc: "Weekly groceries" },

  //  AUGUST 2026 
  { id: 3, type: "income",  amount: 640.00, date: "2026-08-01", category: "Salary",        desc: "Part-time job — August" },
  { id: 4, type: "expense", amount: 28.50,  date: "2026-08-12", category: "Transport",     desc: "Bus pass top-up" },

  //  SEPTEMBER 2026 
  { id: 5, type: "expense", amount: 14.99,  date: "2026-09-02", category: "Entertainment", desc: "Spotify + streaming" },
  { id: 6, type: "income",  amount: 900.00, date: "2026-09-15", category: "Other",         desc: "Student loan instalment" },
  { id: 7, type: "expense", amount: 800.00,  date: "2026-09-28", category: "Bills",        desc: "Rent" },

  //  OCTOBER 2026 
  { id: 8, type: "income",  amount: 610.00, date: "2026-10-01", category: "Salary",        desc: "Part-time job — October" },
  { id: 9, type: "expense", amount: 120.00, date: "2026-10-01", category: "Bills",         desc: "Phone + internet" },
  { id: 10, type: "expense", amount: 35.00,  date: "2026-10-05", category: "Food",          desc: "Weekly groceries" },
];

let transactions = JSON.parse(localStorage.getItem("budgettracker_tx") || "null") || demoTransactions;
let budgets = JSON.parse(localStorage.getItem("budgettracker_budget") || "null") || {
  Food: 180,
  Transport: 110,
  Entertainment: 50,
  Bills: 900
};

//  UTILITIES 
const money = (n) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(n);

const save = () => {
  localStorage.setItem("budgettracker_tx", JSON.stringify(transactions));
  localStorage.setItem("budgettracker_budget", JSON.stringify(budgets));
};

const sum = (arr) => arr.reduce((a, x) => a + x.amount, 0);

const currentMonth = () => new Date().toISOString().slice(0, 7);
let flowBars = [];

// Returns the latest "YYYY-MM" that has at least one transaction.
// Falls back to the real current month if there are no transactions.
function latestActiveMonth() {
  const months = transactions
    .map((x) => x.date.slice(0, 7))
    .filter(Boolean)
    .sort();
  return months.length ? months[months.length - 1] : currentMonth();
}

// Returns the latest "YYYY-MM" that has at least one expense.
// Falls back to the latest active month, then to the real current month.
function latestExpenseMonth() {
  const months = transactions
    .filter((x) => x.type === "expense")
    .map((x) => x.date.slice(0, 7))
    .filter(Boolean)
    .sort();
  return months.length ? months[months.length - 1] : latestActiveMonth();
}

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );

//  TOTALS & METRICS 
function calculateTotals() {
  const m = latestActiveMonth();
  const monthTx = transactions.filter((x) => x.date.startsWith(m));
  const income = sum(monthTx.filter((x) => x.type === "income"));
  const expenses = sum(monthTx.filter((x) => x.type === "expense"));
  const balance = transactions.reduce(
    (a, x) => a + (x.type === "income" ? x.amount : -x.amount),
    0
  );
  const savings = income ? ((income - expenses) / income) * 100 : 0;
  return { income, expenses, balance, savings };
}

//  RENDER FUNCTIONS 
function render() {
  const t = calculateTotals();
  document.getElementById("balance").textContent = money(t.balance);
  document.getElementById("income").textContent = money(t.income);
  document.getElementById("expenses").textContent = money(t.expenses);
  document.getElementById("savings").textContent = t.savings.toFixed(1) + "%";

  renderRecent();
  renderTransactions();
  renderBudgets();
  drawCharts();
}

function renderRecent() {
  const container = document.getElementById("recent");
  const rows = [...transactions]
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 6);

  if (!rows.length) {
    container.innerHTML = `<div class="empty">No transactions yet.</div>`;
    return;
  }

  const tableRows = rows
    .map(
      (x) => `<tr>
        <td>${x.date}</td>
        <td>${escapeHtml(x.desc || "—")}</td>
        <td><span class="pill">${x.category}</span></td>
        <td class="amount ${x.type}">${x.type === "income" ? "+" : "−"}${money(x.amount)}</td>
      </tr>`
    )
    .join("");

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th class="amount">Amount</th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

function renderTransactions() {
  const container = document.getElementById("transactionTable");
  const rows = [...transactions].sort((a, b) => b.date.localeCompare(a.date));

  if (!rows.length) {
    container.innerHTML = `<div class="empty">No transactions yet.</div>`;
    return;
  }

  const tableRows = rows
    .map(
      (x) => `<tr>
        <td>${x.date}</td>
        <td>${escapeHtml(x.desc || "—")}</td>
        <td>${x.category}</td>
        <td>${x.type}</td>
        <td class="amount ${x.type}">${x.type === "income" ? "+" : "−"}${money(x.amount)}</td>
        <td><button class="btn" onclick="removeTx(${x.id})">Delete</button></td>
      </tr>`
    )
    .join("");

  container.innerHTML = `
    <table class="table">
      <thead>
        <tr><th>Date</th><th>Description</th><th>Category</th><th>Type</th><th class="amount">Amount</th><th></th></tr>
      </thead>
      <tbody>${tableRows}</tbody>
    </table>`;
}

function renderBudgets() {
  const container = document.getElementById("budgetList");
  const month = latestActiveMonth();
  const spent = {};

  transactions
    .filter((x) => x.type === "expense" && x.date.startsWith(month))
    .forEach((x) => (spent[x.category] = (spent[x.category] || 0) + x.amount));

  const entries = Object.entries(budgets);

  if (!entries.length) {
    container.innerHTML = `<div class="empty">No budgets configured.</div>`;
    return;
  }

  container.innerHTML = entries
    .map(([cat, limit]) => {
      const used = spent[cat] || 0;
      const pct = Math.min(100, limit ? (used / limit) * 100 : 0);
      return `
        <div class="budget">
          <div class="budget-top">
            <span>${cat}</span>
            <span>${money(used)} / ${money(limit)}</span>
          </div>
          <div class="bar"><i style="width:${pct}%"></i></div>
        </div>`;
    })
    .join("");
}

//  CHARTS 
function setupCanvas(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const w = canvas.clientWidth || 400; // fallback if parent is hidden / zero-width
  const h = 270;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  const ctx = canvas.getContext("2d");
  ctx.scale(dpr, dpr);
  return [ctx, w, h];
}

function drawCharts() {
  drawFlowChart();
  drawCategoryChart();
}

function handleFlowHover(e) {
  const canvas = document.getElementById("flowChart");
  const tooltip = document.getElementById("chartTooltip");
  const rect = canvas.getBoundingClientRect();

  // Convert page coordinates to canvas-space (CSS pixels).
  const mx = e.clientX - rect.left;
  const my = e.clientY - rect.top;

  // Find the topmost bar under the cursor. Bars are drawn left-to-right
  // and income/expense pairs don't overlap, so a simple reverse scan works.
  let hit = null;
  for (let i = flowBars.length - 1; i >= 0; i--) {
    const b = flowBars[i];
    if (mx >= b.x && mx <= b.x + b.w && my >= b.y && my <= b.y + b.h) {
      hit = b;
      break;
    }
  }

  if (!hit || hit.value === 0) {
    tooltip.style.display = "none";
    canvas.style.cursor = "default";
    return;
  }

  const label = hit.type === "income" ? "Income" : "Expense";
  tooltip.textContent = `${label}: ${money(hit.value)}`;
  tooltip.style.display = "block";
  tooltip.style.left = e.clientX + 12 + "px";
  tooltip.style.top = e.clientY + 12 + "px";
  canvas.style.cursor = "pointer";
}

function drawFlowChart() {
  const canvas = document.getElementById("flowChart");
  const [ctx, w, h] = setupCanvas(canvas);

  const anchor = latestActiveMonth();
  const [anchorY, anchorM] = anchor.split("-").map(Number);
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(anchorY, anchorM - 1 - i, 1);
    months.push(d.toISOString().slice(0, 7));
  }

  const vals = months.map((m) => {
    const monthTx = transactions.filter((x) => x.date.startsWith(m));
    return [
      sum(monthTx.filter((x) => x.type === "income")),
      sum(monthTx.filter((x) => x.type === "expense")),
    ];
  });

  const max = Math.max(1, ...vals.flat()) * 1.15;
  const pad = 35;

  // Reset stored hitboxes each time on  redraw.
  flowBars = [];

  ctx.font = "11px system-ui";
  ctx.strokeStyle = "#24304a";
  ctx.fillStyle = "#8f9bb5";

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = h - pad - ((h - 2 * pad) * i) / 4;
    ctx.beginPath();
    ctx.moveTo(pad, y);
    ctx.lineTo(w - 10, y);
    ctx.stroke();
    ctx.fillText(money((max * i) / 4).replace(".00", ""), 4, y + 4);
  }

  // Bars
  vals.forEach((v, i) => {
    const x = pad + i * ((w - pad - 15) / 5);
    const bw = Math.min(18, (w - pad - 25) / 12);
    const y1 = h - pad - (v[0] / max) * (h - 2 * pad);
    const y2 = h - pad - (v[1] / max) * (h - 2 * pad);

    // Income bar
    ctx.fillStyle = "#67e8f9";
    ctx.fillRect(x, y1, bw, h - pad - y1);
    flowBars.push({
      x, y: y1, w: bw, h: h - pad - y1,
      type: "income", value: v[0], month: months[i],
    });

    // Expense bar
    ctx.fillStyle = "#fb7185";
    ctx.fillRect(x + bw + 4, y2, bw, h - pad - y2);
    flowBars.push({
      x: x + bw + 4, y: y2, w: bw, h: h - pad - y2,
      type: "expense", value: v[1], month: months[i],
    });

    ctx.fillStyle = "#8f9bb5";
    ctx.fillText(months[i].slice(5), x - 2, h - 10);
  });
}

function drawCategoryChart() {
  const canvas = document.getElementById("categoryChart");
  const [ctx, w, h] = setupCanvas(canvas);

  const month = latestExpenseMonth();
  const categoryTotals = {};

  transactions
    .filter((x) => x.type === "expense" && x.date.startsWith(month))
    .forEach((x) => (categoryTotals[x.category] = (categoryTotals[x.category] || 0) + x.amount));

  const entries = Object.entries(categoryTotals)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6);

  const total = entries.reduce((a, [, val]) => a + val, 0);

  if (!total) {
    ctx.fillStyle = "#8f9bb5";
    ctx.textAlign = "center";
    ctx.fillText("No expenses this month", w / 2, h / 2);
    return;
  }

  let start = -Math.PI / 2;
  const r = Math.min(w, h) * 0.31;
  const cx = w * 0.32;
  const cy = h / 2;

  entries.forEach(([cat, val], i) => {
    const end = start + (val / total) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, start, end);
    ctx.closePath();
    ctx.fillStyle = `hsl(${185 + i * 38} 75% ${62 - i * 4}%)`;
    ctx.fill();
    start = end;
  });

  ctx.textAlign = "left";
  entries.forEach(([cat, val], i) => {
    const y = 38 + i * 34;
    ctx.fillStyle = `hsl(${185 + i * 38} 75% ${62 - i * 4}%)`;
    ctx.fillRect(w * 0.58, y - 9, 9, 9);
    ctx.fillStyle = "#eef3ff";
    ctx.fillText(cat, w * 0.58 + 16, y);
    ctx.fillStyle = "#8f9bb5";
    ctx.fillText(money(val), w * 0.78, y);
  });
}

//  ACTIONS 
function removeTx(id) {
  transactions = transactions.filter((x) => x.id !== id);
  save();
  render();
  toast("Transaction deleted");
}

function toast(message) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.style.display = "block";
  clearTimeout(window.__toast);
  window.__toast = setTimeout(() => (el.style.display = "none"), 1800);
}

//  VIEW SWITCHING 
function showView(view) {
  document.getElementById("chartTooltip").style.display = "none";
  document.querySelectorAll("main section").forEach((s) => s.classList.add("hidden"));
  document.getElementById(view + "View").classList.remove("hidden");

  document.querySelectorAll(".nav button").forEach((b) =>
    b.classList.toggle("active", b.dataset.view === view)
  );

  const meta = {
    dashboard: ["Financial Overview", "A compact view of your personal cash flow."],
    transactions: ["Transactions", "A transparent ledger of every recorded movement."],
    budgets: ["Budgets", "Track monthly limits against actual spending."],
  }[view];

  document.getElementById("title").textContent = meta[0];
  document.getElementById("subtitle").textContent = meta[1];

  // Redraw charts after the dashboard is visible so canvas sizing is correct.
  if (view === "dashboard") {
    requestAnimationFrame(drawCharts);
  }
}

//  MODAL 
function openModal() {
  document.getElementById("modal").classList.add("show");
  document.getElementById("txAmount").focus();
}

function closeModal() {
  document.getElementById("modal").classList.remove("show");
  document.getElementById("txForm").reset();
  document.getElementById("txDate").value = new Date().toISOString().slice(0, 10);
}

//  INITIALISATION 
function populateCategories() {
  const options = CATEGORIES.map((c) => `<option>${c}</option>`).join("");
  document.getElementById("txCategory").innerHTML = options;
  document.getElementById("budgetCategory").innerHTML = options;
  document.getElementById("txDate").value = new Date().toISOString().slice(0, 10);
}

function bindEvents() {
  // Navigation
  document.querySelectorAll(".nav button").forEach((b) => {
    b.onclick = () => showView(b.dataset.view);
  });

  // Modal open/close
  document.getElementById("addBtn").onclick = openModal;
  document.getElementById("closeModal").onclick = closeModal;
  document.getElementById("modal").onclick = (e) => {
    if (e.target === document.getElementById("modal")) closeModal();
  };

  const flowCanvas = document.getElementById("flowChart");
  flowCanvas.addEventListener("mousemove", handleFlowHover);
  flowCanvas.addEventListener("mouseleave", () => {
    document.getElementById("chartTooltip").style.display = "none";
  });

  // Transaction form
  document.getElementById("txForm").onsubmit = (e) => {
    e.preventDefault();
    const amount = Number(document.getElementById("txAmount").value);
    if (!Number.isFinite(amount) || amount <= 0) return;

    transactions.push({
      id: Date.now(),
      type: document.getElementById("txType").value,
      amount,
      date: document.getElementById("txDate").value,
      category: document.getElementById("txCategory").value,
      desc: document.getElementById("txDesc").value.trim(),
    });

    save();
    render();
    closeModal();
    toast("Transaction added");
  };

  // Budget form
  document.getElementById("budgetForm").onsubmit = (e) => {
    e.preventDefault();
    const cat = document.getElementById("budgetCategory").value;
    const amount = Number(document.getElementById("budgetAmount").value);
    budgets[cat] = amount;
    save();
    render();
    document.getElementById("budgetAmount").value = "";
    toast("Budget saved");
  };

  // Export
  document.getElementById("exportBtn").onclick = () => {
    const blob = new Blob(
      [JSON.stringify({ transactions, budgets }, null, 2)],
      { type: "application/json" }
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "budgettracker-export.json";
    a.click();
    URL.revokeObjectURL(a.href);
  };

  // Resize handler for charts
  window.addEventListener("resize", () => {
    if (!document.getElementById("dashboardView").classList.contains("hidden")) {
      drawCharts();
    }
  });
}

//  BOOTSTRAP 
populateCategories();
bindEvents();
render();