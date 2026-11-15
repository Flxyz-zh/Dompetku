import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateSummary,
  filterTransactions,
  formatRupiah,
  getMonthlySummaries,
  sortTransactionsNewest,
} from '../js/finance.js';

const transactions = [
  { id: '1', type: 'income', amount: 4000000, category: 'Gaji', date: '2026-09-02', note: '' },
  { id: '2', type: 'expense', amount: 1500000, category: 'Belanja', date: '2026-09-18', note: '' },
  { id: '3', type: 'income', amount: 3500000, category: 'Freelance', date: '2026-10-01', note: '' },
  { id: '4', type: 'expense', amount: 1200000, category: 'Makanan', date: '2026-10-10', note: '' },
];

test('calculates total income, expenses and remaining balance accurately', () => {
  assert.deepEqual(calculateSummary(transactions), { income: 7500000, expense: 2700000, balance: 4800000 });
});

test('formats Indonesian rupiah without decimal places', () => {
  assert.equal(formatRupiah(2500000), 'Rp2.500.000');
});

test('creates monthly summaries grouped by year and month', () => {
  assert.deepEqual(getMonthlySummaries(transactions), [
    { key: '2026-10', label: 'Oktober 2026', income: 3500000, expense: 1200000, balance: 2300000 },
    { key: '2026-09', label: 'September 2026', income: 4000000, expense: 1500000, balance: 2500000 },
  ]);
});

test('filters by type, month and search text, then shows newest first', () => {
  const result = filterTransactions(transactions, { type: 'expense', month: '2026-10', search: 'makan' });
  assert.deepEqual(result.map((item) => item.id), ['4']);
  assert.deepEqual(sortTransactionsNewest(transactions).map((item) => item.id), ['4', '3', '2', '1']);
});
