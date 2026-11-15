import { calculateSummary, filterTransactions, formatRupiah, getMonthlySummaries, sortTransactionsNewest } from './finance.js';

const STORE_KEY = 'dompetku-transactions-v1';
const incomes = ['Uang saku', 'Gaji', 'Bonus', 'Freelance', 'Lainnya'];
const expenses = ['Makanan', 'Transportasi', 'Belanja', 'Pendidikan', 'Hiburan', 'Tagihan', 'Lainnya'];
const $ = (selector) => document.querySelector(selector);
let transactions = loadTransactions();

function loadTransactions() { try { return JSON.parse(localStorage.getItem(STORE_KEY)) || []; } catch { return []; } }
function saveTransactions() { localStorage.setItem(STORE_KEY, JSON.stringify(transactions)); }
function localDate() { return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }); }
function formatDate(date) { return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(`${date}T00:00:00`)); }
function currentMonth() { return localDate().slice(0, 7); }
function iconFor(t) { return t.type === 'income' ? '↙' : '↗'; }

function render() { renderDashboard(); renderTable(); renderReports(); renderMonths(); }
function renderDashboard() {
  const total = calculateSummary(transactions); const monthItems = transactions.filter((t) => t.date.startsWith(currentMonth())); const monthly = calculateSummary(monthItems);
  $('#currentBalance').textContent = formatRupiah(total.balance);
  $('#balanceCaption').textContent = transactions.length ? `${transactions.length} transaksi tercatat` : 'Mulai catat transaksi pertamamu';
  $('#monthIncome').textContent = formatRupiah(monthly.income); $('#monthExpense').textContent = formatRupiah(monthly.expense); $('#monthSaving').textContent = formatRupiah(monthly.balance);
  $('#incomeCount').textContent = `${monthItems.filter(t => t.type === 'income').length} pemasukan bulan ini`; $('#expenseCount').textContent = `${monthItems.filter(t => t.type === 'expense').length} pengeluaran bulan ini`;
  renderBars($('#chart'), getMonthlySummaries(transactions).slice(0, 6).reverse());
  const recent = sortTransactionsNewest(transactions).slice(0, 5);
  $('#recentTransactions').innerHTML = recent.length ? recent.map(transactionRow).join('') : '<div class="inline-empty">Belum ada aktivitas. Tambahkan transaksi untuk memulai.</div>';
}
function transactionRow(t) { return `<div class="recent-item"><span class="tx-icon ${t.type}">${iconFor(t)}</span><div class="tx-main"><strong>${escapeHtml(t.category)}</strong><small>${formatDate(t.date)}${t.note ? ` · ${escapeHtml(t.note)}` : ''}</small></div><strong class="amount ${t.type}">${t.type === 'income' ? '+' : '−'}${formatRupiah(t.amount)}</strong></div>`; }
function renderBars(container, summaries) {
  if (!summaries.length) { container.innerHTML = '<div class="chart-empty">Grafik akan muncul setelah transaksi dicatat.</div>'; return; }
  const max = Math.max(...summaries.flatMap((m) => [m.income, m.expense]), 1);
  container.innerHTML = summaries.map((m) => `<div class="chart-group"><div class="bars"><span class="bar income" style="height:${Math.max(5, (m.income / max) * 100)}%" title="Pemasukan ${formatRupiah(m.income)}"></span><span class="bar expense" style="height:${Math.max(5, (m.expense / max) * 100)}%" title="Pengeluaran ${formatRupiah(m.expense)}"></span></div><small>${m.label.split(' ')[0].slice(0, 3)}</small></div>`).join('');
}
function renderTable() {
  const items = filterTransactions(transactions, { type: $('#typeFilter').value, month: $('#monthFilter').value, search: $('#searchInput').value });
  $('#transactionTable').innerHTML = items.map((t) => `<tr><td>${formatDate(t.date)}</td><td><span class="badge ${t.type}">${t.type === 'income' ? 'Pemasukan' : 'Pengeluaran'}</span></td><td><strong>${escapeHtml(t.category)}</strong></td><td>${escapeHtml(t.note || '—')}</td><td class="money ${t.type}">${t.type === 'income' ? '+' : '−'}${formatRupiah(t.amount)}</td><td><div class="row-actions"><button data-edit="${t.id}" aria-label="Edit transaksi">✎</button><button data-delete="${t.id}" aria-label="Hapus transaksi">×</button></div></td></tr>`).join('');
  $('#transactionEmpty').classList.toggle('visible', transactions.length === 0);
}
function renderMonths() {
  const select = $('#monthFilter'); const old = select.value; const months = [...new Set(transactions.map(t => t.date.slice(0, 7)))].sort().reverse();
  select.innerHTML = '<option value="all">Semua bulan</option>' + months.map(k => `<option value="${k}">${new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${k}-01T00:00:00`))}</option>`).join(''); select.value = months.includes(old) ? old : 'all';
}
function renderReports() { const months = getMonthlySummaries(transactions).slice(0, 12).reverse(); renderBars($('#reportChart'), months); $('#monthlyCards').innerHTML = getMonthlySummaries(transactions).map(m => `<article class="month-card"><p>${m.label}</p><div><span>Pemasukan</span><strong class="income">${formatRupiah(m.income)}</strong></div><div><span>Pengeluaran</span><strong class="expense">${formatRupiah(m.expense)}</strong></div><footer><span>Sisa uang</span><strong>${formatRupiah(m.balance)}</strong></footer></article>`).join('') || '<div class="report-empty">Rekap bulanan akan tampil di sini.</div>'; }
function escapeHtml(value) { return String(value).replace(/[&<>'"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c])); }

function populateCategories(type, selected = '') { const choices = type === 'income' ? incomes : expenses; $('#categoryLabel').childNodes[0].textContent = type === 'income' ? 'Sumber pemasukan' : 'Kategori pengeluaran'; $('#category').innerHTML = choices.map(c => `<option ${c === selected ? 'selected' : ''}>${c}</option>`).join(''); }
function openModal(item) { $('#transactionForm').reset(); $('#formError').textContent = ''; $('#transactionId').value = item?.id || ''; $(`input[name="type"][value="${item?.type || 'income'}"]`).checked = true; populateCategories(item?.type || 'income', item?.category); $('#amount').value = item ? formatRupiah(item.amount) : ''; $('#date').value = item?.date || localDate(); $('#note').value = item?.note || ''; $('#modalTitle').textContent = item ? 'Edit transaksi' : 'Tambah transaksi'; $('#transactionDialog').showModal(); $('#amount').focus(); }
function closeModal() { $('#transactionDialog').close(); }
function showToast(message) { const toast = $('#toast'); toast.textContent = message; toast.classList.add('show'); setTimeout(() => toast.classList.remove('show'), 2600); }
function saveForm(event) { event.preventDefault(); const raw = $('#amount').value.replace(/\D/g, ''); const type = $('input[name="type"]:checked').value; if (!raw || Number(raw) <= 0) { $('#formError').textContent = 'Masukkan nominal lebih dari Rp0.'; return; } const record = { id: $('#transactionId').value || crypto.randomUUID(), type, amount: Number(raw), category: $('#category').value, date: $('#date').value, note: $('#note').value.trim() }; const existing = transactions.findIndex(t => t.id === record.id); if (existing >= 0) transactions[existing] = record; else transactions.push(record); saveTransactions(); closeModal(); render(); showToast(existing >= 0 ? 'Transaksi berhasil diperbarui.' : 'Transaksi berhasil ditambahkan.'); }

document.querySelectorAll('.nav-link').forEach(button => button.addEventListener('click', () => { const page = button.dataset.page; document.querySelectorAll('.page').forEach(p => p.classList.toggle('active', p.id === page)); document.querySelectorAll('.nav-link').forEach(p => p.classList.toggle('active', p === button)); $('#pageTitle').textContent = page === 'dashboard' ? 'Ringkasan keuanganmu' : page === 'transactions' ? 'Riwayat transaksi' : 'Rekap keuangan bulanan'; }));
document.querySelectorAll('[data-go="transactions"]').forEach(b => b.addEventListener('click', () => document.querySelector('[data-page="transactions"]').click()));
$('#addTransaction').addEventListener('click', () => openModal()); $('.empty-add').addEventListener('click', () => openModal()); $('#closeModal').addEventListener('click', closeModal); $('#cancelModal').addEventListener('click', closeModal); $('#transactionForm').addEventListener('submit', saveForm);
document.querySelectorAll('input[name="type"]').forEach(input => input.addEventListener('change', () => populateCategories(input.value)));
$('#amount').addEventListener('input', (e) => { const n = e.target.value.replace(/\D/g, ''); e.target.value = n ? formatRupiah(n) : ''; });
['searchInput', 'typeFilter', 'monthFilter'].forEach(id => $(`#${id}`).addEventListener(id === 'searchInput' ? 'input' : 'change', renderTable));
$('#transactionTable').addEventListener('click', (e) => { const edit = e.target.closest('[data-edit]'); const del = e.target.closest('[data-delete]'); if (edit) openModal(transactions.find(t => t.id === edit.dataset.edit)); if (del && confirm('Hapus transaksi ini? Saldo dan rekap akan diperbarui otomatis.')) { transactions = transactions.filter(t => t.id !== del.dataset.delete); saveTransactions(); render(); showToast('Transaksi berhasil dihapus.'); } });
$('#themeToggle').addEventListener('click', () => { document.body.classList.toggle('dark'); localStorage.setItem('dompetku-theme', document.body.classList.contains('dark') ? 'dark' : 'light'); });
if (localStorage.getItem('dompetku-theme') === 'dark') document.body.classList.add('dark');
$('#today').textContent = new Intl.DateTimeFormat('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());
render();
