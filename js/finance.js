export const formatRupiah = (amount) => new Intl.NumberFormat('id-ID', {
  style: 'currency', currency: 'IDR', maximumFractionDigits: 0,
}).format(Number(amount) || 0).replace(/\s/g, '');

export function calculateSummary(transactions) {
  const income = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + Number(t.amount), 0);
  const expense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + Number(t.amount), 0);
  return { income, expense, balance: income - expense };
}

export const sortTransactionsNewest = (transactions) => [...transactions].sort((a, b) => {
  const dateComparison = b.date.localeCompare(a.date);
  return dateComparison || String(b.id).localeCompare(String(a.id));
});

export function filterTransactions(transactions, { type = 'all', month = 'all', search = '' } = {}) {
  const keyword = search.trim().toLowerCase();
  return sortTransactionsNewest(transactions).filter((t) =>
    (type === 'all' || t.type === type)
    && (month === 'all' || t.date.startsWith(month))
    && (!keyword || `${t.category} ${t.note} ${t.amount}`.toLowerCase().includes(keyword)));
}

export function getMonthlySummaries(transactions) {
  const groups = new Map();
  transactions.forEach((t) => {
    const key = t.date.slice(0, 7);
    const current = groups.get(key) || { income: 0, expense: 0 };
    current[t.type] += Number(t.amount);
    groups.set(key, current);
  });
  return [...groups.entries()].map(([key, values]) => ({
    key,
    label: new Intl.DateTimeFormat('id-ID', { month: 'long', year: 'numeric' }).format(new Date(`${key}-01T00:00:00`)),
    ...values,
    balance: values.income - values.expense,
  })).sort((a, b) => b.key.localeCompare(a.key));
}
