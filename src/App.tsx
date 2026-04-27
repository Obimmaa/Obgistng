/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  ArrowLeftRight, 
  Plus, 
  Settings as SettingsIcon, 
  PieChart, 
  Wallet as WalletIcon,
  Landmark,
  Search,
  Bell,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  MoreVertical,
  X,
  CreditCard,
  Banknote,
  PiggyBank,
  Wifi,
  Battery,
  Signal
} from 'lucide-react';
import { PieChart as RePieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip } from 'recharts';
import { Transaction, TransactionType, SUPPORTED_CURRENCIES, CATEGORIES, Wallet, Budget } from './types';
import { cn, formatCurrency } from './lib/utils';
import { convertCurrency } from './services/currencyService';

const StatusBar = () => (
  <div className="px-6 py-2 flex justify-between items-center text-[12px] font-semibold text-slate-900 bg-[#f8fafc] sticky top-0 z-[60]">
    <span>9:41</span>
    <div className="flex gap-1.5 items-center">
      <Signal size={12} strokeWidth={2.5} />
      <Wifi size={12} strokeWidth={2.5} />
      <Battery size={12} strokeWidth={2.5} className="rotate-90" />
    </div>
  </div>
);

// --- Sub-components ---

const BottomNav = ({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (tab: string) => void }) => {
  const tabs = [
    { id: 'dashboard', label: '🏠' },
    { id: 'transactions', label: '🗓️' },
    { id: 'analytics', label: '📊' },
    { id: 'settings', label: '⚙️' },
  ];

  return (
    <div className="absolute bottom-0 left-0 w-full bg-white border-t border-slate-100 flex justify-around items-center h-[72px] pb-3 z-50">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          className={cn(
            "flex flex-col items-center justify-center transition-all px-6",
            activeTab === tab.id ? "text-slate-900" : "text-slate-400 grayscale opacity-60"
          )}
        >
          <span className="text-[20px]">{tab.label}</span>
          {activeTab === tab.id && <div className="w-1 h-1 rounded-full bg-primary mt-1" />}
        </button>
      ))}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-slate-100 rounded-full"></div>
    </div>
  );
};

// --- Mock Data Initialization ---

const initialTransactions: Transaction[] = [
  {
    id: '1',
    amount: 50000,
    currency: 'NGN',
    convertedAmount: 50000,
    baseCurrency: 'NGN',
    category: 'salary',
    type: TransactionType.INCOME,
    date: new Date(Date.now() - 86400000 * 1).toISOString(),
    notes: 'Monthly Salary',
  },
  {
    id: '2',
    amount: 15.50,
    currency: 'USD',
    convertedAmount: 23250,
    baseCurrency: 'NGN',
    category: 'food',
    type: TransactionType.EXPENSE,
    date: new Date(Date.now() - 3600000 * 2).toISOString(),
    notes: 'Dinner with friends',
  },
  {
    id: '3',
    amount: 12000,
    currency: 'NGN',
    convertedAmount: 12000,
    baseCurrency: 'NGN',
    category: 'transport',
    type: TransactionType.EXPENSE,
    date: new Date(Date.now() - 86400000 * 3).toISOString(),
    notes: 'Fuel for car',
  }
];

const initialWallets: Wallet[] = [
  { id: 'w1', name: 'GTBank', balance: 450000, currency: 'NGN', type: 'bank' },
  { id: 'w2', name: 'Cash', balance: 5000, currency: 'NGN', type: 'cash' },
  { id: 'w3', name: 'Savings Pot', balance: 200, currency: 'USD', type: 'savings' },
];

// --- Main App ---

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('transactions');
    return saved ? JSON.parse(saved) : initialTransactions;
  });
  const [wallets, setWallets] = useState<Wallet[]>(() => {
    const saved = localStorage.getItem('wallets');
    return saved ? JSON.parse(saved) : initialWallets;
  });
  const [defaultCurrency, setDefaultCurrency] = useState('NGN');
  const [isAddingTransaction, setIsAddingTransaction] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [isAddingWallet, setIsAddingWallet] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);
  const [budgets, setBudgets] = useState<Budget[]>(() => {
    const saved = localStorage.getItem('budgets');
    const defaultBudgets: Budget[] = [
      { id: 'b1', category: 'food', amount: 100000, currency: 'NGN', period: 'monthly' },
      { id: 'b2', category: 'transport', amount: 50000, currency: 'NGN', period: 'monthly' },
      { id: 'b3', category: 'bills', amount: 80000, currency: 'NGN', period: 'monthly' },
    ];
    return saved ? JSON.parse(saved) : defaultBudgets;
  });

  useEffect(() => {
    localStorage.setItem('transactions', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  useEffect(() => {
    localStorage.setItem('budgets', JSON.stringify(budgets));
  }, [budgets]);

  const handleSaveTransaction = (newTxData: Omit<Transaction, 'id' | 'convertedAmount' | 'baseCurrency'>) => {
    const convertedAmount = newTxData.currency === defaultCurrency ? newTxData.amount : (newTxData.amount * 1500); 

    if (editingTransaction) {
      // Revert previous wallet impact before applying new one
      let revertedWallets = [...wallets];
      if (editingTransaction.type === TransactionType.TRANSFER) {
        revertedWallets = revertedWallets.map(w => {
          if (w.id === editingTransaction.fromWalletId) return { ...w, balance: w.balance + editingTransaction.amount };
          if (w.id === editingTransaction.toWalletId) return { ...w, balance: w.balance - editingTransaction.amount };
          return w;
        });
      } else {
        revertedWallets = revertedWallets.map(w => {
          if (w.id === editingTransaction.walletId) {
            return {
              ...w,
              balance: editingTransaction.type === TransactionType.INCOME 
                ? w.balance - editingTransaction.amount 
                : w.balance + editingTransaction.amount
            };
          }
          return w;
        });
      }

      const tx: Transaction = { 
        ...newTxData, 
        id: editingTransaction.id, 
        convertedAmount, 
        baseCurrency: defaultCurrency 
      };

      setTransactions(transactions.map(t => t.id === editingTransaction.id ? tx : t));
      
      // Apply new wallet impact
      if (tx.type === TransactionType.TRANSFER) {
        setWallets(revertedWallets.map(w => {
          if (w.id === tx.fromWalletId) return { ...w, balance: w.balance - tx.amount };
          if (w.id === tx.toWalletId) return { ...w, balance: w.balance + tx.amount };
          return w;
        }));
      } else {
        setWallets(revertedWallets.map(w => {
          if (w.id === tx.walletId) {
            return {
              ...w,
              balance: tx.type === TransactionType.INCOME ? w.balance + tx.amount : w.balance - tx.amount
            };
          }
          return w;
        }));
      }
      setEditingTransaction(null);
    } else {
      const tx: Transaction = {
        ...newTxData,
        id: Math.random().toString(36).substr(2, 9),
        convertedAmount,
        baseCurrency: defaultCurrency,
      };
      setTransactions([tx, ...transactions]);
      
      // Update wallet balance
      if (tx.type === TransactionType.TRANSFER) {
        setWallets(wallets.map(w => {
          if (w.id === tx.fromWalletId) return { ...w, balance: w.balance - tx.amount };
          if (w.id === tx.toWalletId) return { ...w, balance: w.balance + tx.amount };
          return w;
        }));
      } else {
        const wallet = wallets.find(w => w.id === tx.walletId);
        if (wallet) {
          setWallets(wallets.map(w => w.id === tx.walletId ? {
            ...w,
            balance: tx.type === TransactionType.INCOME ? w.balance + tx.amount : w.balance - tx.amount
          } : w));
        }
      }
    }

    setIsAddingTransaction(false);
  };

  const handleDeleteTransaction = (id: string) => {
    const tx = transactions.find(t => t.id === id);
    if (!tx) return;

    // Revert wallet impact
    if (tx.type === TransactionType.TRANSFER) {
      setWallets(wallets.map(w => {
        if (w.id === tx.fromWalletId) return { ...w, balance: w.balance + tx.amount };
        if (w.id === tx.toWalletId) return { ...w, balance: w.balance - tx.amount };
        return w;
      }));
    } else {
      setWallets(wallets.map(w => {
        if (w.id === tx.walletId) {
          return {
            ...w,
            balance: tx.type === TransactionType.INCOME ? w.balance - tx.amount : w.balance + tx.amount
          };
        }
        return w;
      }));
    }

    setTransactions(transactions.filter(t => t.id !== id));
    setEditingTransaction(null);
  };

  const handleSaveWallet = (walletData: Omit<Wallet, 'id'>) => {
    if (editingWallet) {
      setWallets(wallets.map(w => w.id === editingWallet.id ? { ...walletData, id: w.id } : w));
      setEditingWallet(null);
    } else {
      const newWallet: Wallet = {
        ...walletData,
        id: Math.random().toString(36).substr(2, 9),
      };
      setWallets([...wallets, newWallet]);
    }
    setIsAddingWallet(false);
  };

  const handleDeleteWallet = (id: string) => {
    setWallets(wallets.filter(w => w.id !== id));
    setEditingWallet(null);
  };

  return (
    <div className="mobile-container overflow-x-hidden relative">
      <StatusBar />
      {/* Header */}
      <header className="px-6 py-5 flex justify-between items-center bg-[#f8fafc]/80 backdrop-blur-md sticky top-[28px] z-40 border-b border-slate-100/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center text-white shadow-lg shadow-primary/10">
            <Landmark size={22} strokeWidth={2.5} />
          </div>
          <div className="flex flex-col -space-y-1.5">
            <p className="font-black text-lg tracking-tighter">
              <span className="text-red-600">OBGIST</span><span className="text-accent">FIN</span>
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-[0.2em]">Global Asset Tracker</p>
          </div>
        </div>
        <div className="flex gap-2">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-lg cursor-pointer hover:bg-slate-200 transition-colors">
            👤
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth">
        <AnimatePresence mode="wait">
          {activeTab === 'dashboard' && (
            <Dashboard 
              transactions={transactions} 
              wallets={wallets} 
              budgets={budgets}
              defaultCurrency={defaultCurrency} 
              onAdd={() => setIsAddingTransaction(true)} 
              onAddWallet={() => setIsAddingWallet(true)}
              onEditTransaction={(tx) => setEditingTransaction(tx)}
              onEditWallet={(wallet) => setEditingWallet(wallet)}
            />
          )}
          {activeTab === 'transactions' && (
            <TransactionHistory 
              transactions={transactions} 
              onEditTransaction={(tx) => setEditingTransaction(tx)}
            />
          )}
          {activeTab === 'analytics' && <Analytics transactions={transactions} defaultCurrency={defaultCurrency} />}
          {activeTab === 'settings' && <Settings defaultCurrency={defaultCurrency} setDefaultCurrency={setDefaultCurrency} budgets={budgets} setBudgets={setBudgets} />}
        </AnimatePresence>
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={(tab) => {
        if (tab === 'add') setIsAddingTransaction(true);
        else setActiveTab(tab);
      }} />

      <AnimatePresence>
        {(isAddingTransaction || editingTransaction) && (
          <AddTransactionSlideOver 
            onClose={() => {
              setIsAddingTransaction(false);
              setEditingTransaction(null);
            }} 
            onSave={handleSaveTransaction}
            onDelete={handleDeleteTransaction}
            defaultCurrency={defaultCurrency}
            editingTransaction={editingTransaction}
            wallets={wallets}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {(isAddingWallet || editingWallet) && (
          <AddWalletSlideOver 
            onClose={() => {
              setIsAddingWallet(false);
              setEditingWallet(null);
            }}
            onSave={handleSaveWallet}
            onDelete={handleDeleteWallet}
            editingWallet={editingWallet}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// --- View Components ---

function Dashboard({ transactions, wallets, budgets, defaultCurrency, onAdd, onAddWallet, onEditTransaction, onEditWallet }: { 
  transactions: Transaction[], 
  wallets: Wallet[], 
  budgets: Budget[],
  defaultCurrency: string,
  onAdd: () => void,
  onAddWallet: () => void,
  onEditTransaction: (tx: Transaction) => void,
  onEditWallet: (wallet: Wallet) => void
}) {
  const totalBalance = wallets.reduce((acc, w) => acc + (w.currency === 'NGN' ? w.balance : w.balance * 1500), 0);
  
  const actions = [
    { label: 'Add', icon: '➕', color: '#ecfdf5', iconColor: '#10b981', onClick: onAdd },
    { label: 'Wallet', icon: '🏦', color: '#f5f3ff', iconColor: '#8b5cf6', onClick: onAddWallet },
    { label: 'Budget', icon: '⚖️', color: '#eff6ff', iconColor: '#3b82f6' },
    { label: 'Stats', icon: '📊', color: '#fff7ed', iconColor: '#f97316' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      className="pb-24"
    >
      {/* Balance Card */}
      <div className="mx-5 mb-6 balance-card">
        <div className="absolute top-[-50px] right-[-50px] w-40 h-40 bg-white/5 rounded-full"></div>
        <p className="text-[13px] opacity-70 uppercase tracking-wider mb-2">Total Balance</p>
        <h2 className="text-[32px] font-bold tracking-tight mb-2 flex items-baseline gap-2">
          <span className="text-2xl font-medium opacity-80">₦</span>
          {totalBalance.toLocaleString('en-NG', { minimumFractionDigits: 2 })}
        </h2>
        <div className="flex items-baseline gap-2 opacity-60">
          <span className="text-sm">≈ $ {(totalBalance / 1500).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Action Grid */}
      <div className="grid grid-cols-4 gap-3 px-5 mb-8">
        {actions.map((action) => (
          <button 
            key={action.label} 
            onClick={action.onClick}
            className="flex flex-col items-center gap-2 group transition-all"
          >
            <div 
              style={{ backgroundColor: action.color, color: action.iconColor }}
              className="w-14 h-14 rounded-[18px] flex items-center justify-center text-xl shadow-sm group-active:scale-95 transition-transform"
            >
              {action.icon}
            </div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{action.label}</span>
          </button>
        ))}
      </div>

      {/* Wallets Section */}
      <section className="px-5 mb-8 overflow-x-hidden">
         <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 text-lg">My Accounts</h3>
          <button onClick={onAddWallet} className="text-accent text-[12px] font-semibold flex items-center gap-1"><Plus size={14} /> Add</button>
        </div>
        <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
          {wallets.map(wallet => (
            <div 
              key={wallet.id} 
              onClick={() => onEditWallet(wallet)}
              className="min-w-[160px] p-4 rounded-3xl bg-white border border-slate-100 shadow-sm cursor-pointer active:scale-95 transition-transform"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="w-8 h-8 rounded-xl bg-slate-50 flex items-center justify-center">
                  {wallet.type === 'bank' ? <CreditCard size={16} /> : wallet.type === 'savings' ? <PiggyBank size={16} /> : wallet.type === 'investment' ? <TrendingUp size={16} /> : <Banknote size={16} />}
                </div>
                <span className="text-[10px] font-bold text-slate-400 uppercase">{wallet.currency}</span>
              </div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{wallet.name}</p>
              <h4 className="text-sm font-bold text-slate-900">{formatCurrency(wallet.balance, wallet.currency)}</h4>
            </div>
          ))}
        </div>
      </section>

      {/* Budgets Section */}
      <section className="px-5 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Monthly Budgets</h3>
          <button className="text-accent text-[12px] font-semibold">Manage</button>
        </div>
        <div className="space-y-4">
          {budgets.map(budget => {
            const spent = transactions
              .filter(t => t.category === budget.category && t.type === TransactionType.EXPENSE)
              .reduce((sum, t) => sum + t.convertedAmount, 0);
            const progress = (spent / budget.amount) * 100;
            const categoryObj = CATEGORIES.find(c => c.id === budget.category);
            
            return (
              <div key={budget.id} className="card !p-4">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{categoryObj?.name.charAt(0)}</span>
                    <span className="text-sm font-bold text-slate-700">{categoryObj?.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="text-[11px] font-bold text-slate-900">₦{spent.toLocaleString()} / ₦{budget.amount.toLocaleString()}</p>
                  </div>
                </div>
                <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    className={cn(
                      "h-full rounded-full transition-colors",
                      progress >= 100 ? "bg-danger" : progress >= 80 ? "bg-amber-500" : "bg-success"
                    )}
                  />
                </div>
                {progress >= 80 && (
                  <p className={cn(
                    "text-[9px] font-bold mt-2 uppercase tracking-wider",
                    progress >= 100 ? "text-danger" : "text-amber-600"
                  )}>
                    {progress >= 100 ? "Budget Exceeded!" : "Nearing Limit (80%+)"}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="px-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-slate-900 text-lg">Recent Activity</h3>
          <button className="text-accent text-[12px] font-semibold">See All</button>
        </div>
        <div className="space-y-2.5">
          {transactions.slice(0, 5).map((tx) => (
            <div 
              key={tx.id} 
              onClick={() => onEditTransaction(tx)}
              className="transaction-item card flex items-center gap-3 active:scale-[0.98] transition-transform cursor-pointer"
            >
              <div className={cn(
                "w-11 h-11 rounded-2xl flex items-center justify-center text-lg",
                tx.type === TransactionType.INCOME ? "bg-emerald-100" : "bg-rose-100"
              )}>
                {tx.category === 'salary' ? '💼' : tx.category === 'food' ? '🛒' : tx.category === 'transport' ? '⚡' : '🏷️'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[14px] font-bold text-slate-900 truncate">{tx.notes}</p>
                <p className="text-[11px] text-slate-500 font-medium">
                  {new Date(tx.date).toLocaleDateString(undefined, { weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="text-right">
                <p className={cn(
                  "text-[14px] font-bold",
                  tx.type === TransactionType.INCOME ? "text-success" : "text-danger"
                )}>
                  {tx.type === TransactionType.INCOME ? '+' : '-'}₦{tx.amount.toLocaleString()}
                </p>
                <p className="text-[10px] text-slate-400 font-medium">
                  {tx.currency !== 'NGN' ? `${tx.currency} ${tx.amount}` : `$${(tx.amount / 1500).toFixed(2)}`}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </motion.div>
  );
}

function TransactionHistory({ transactions, onEditTransaction }: { transactions: Transaction[], onEditTransaction: (tx: Transaction) => void }) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTransactions = transactions.filter(tx => {
    const matchesNote = tx.notes.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = tx.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesNote || matchesCategory;
  });

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-4 p-5 pb-24"
    >
      <h2 className="text-2xl font-bold text-slate-900 mb-2">History</h2>
      <p className="text-slate-500 text-sm mb-4">Track all your transactions globally.</p>

      {/* Search Bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-slate-400">
          <Search size={18} />
        </div>
        <input
          type="text"
          placeholder="Search by note or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full bg-slate-50 border-none rounded-2xl py-3.5 pl-12 pr-4 text-sm font-medium focus:ring-2 focus:ring-primary/20 outline-none placeholder:text-slate-400"
        />
      </div>

      <div className="space-y-3">
        {filteredTransactions.length > 0 ? (
          filteredTransactions.map((tx) => (
            <div key={tx.id} onClick={() => onEditTransaction(tx)} className="card flex items-center justify-between hover:shadow-md transition-shadow cursor-pointer !p-4">
              <div className="flex items-center gap-4">
                <div className={cn(
                  "w-11 h-11 rounded-2xl flex items-center justify-center",
                  tx.type === TransactionType.INCOME ? 'bg-emerald-50 text-emerald-600' : 
                  tx.type === TransactionType.EXPENSE ? 'bg-red-50 text-red-600' :
                  'bg-blue-50 text-blue-600'
                )}>
                  {tx.type === TransactionType.TRANSFER ? <ArrowLeftRight size={20} strokeWidth={2.5} /> : (CATEGORIES.find(c => c.id === tx.category)?.name.charAt(0) || 'T')}
                </div>
                <div>
                  <p className="font-bold text-slate-900">{tx.notes}</p>
                  <p className="text-[11px] text-slate-500 font-medium">{new Date(tx.date).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })} • {tx.category}</p>
                </div>
              </div>
              <div className="text-right">
                <p className={cn(
                  "font-bold",
                  tx.type === TransactionType.INCOME ? 'text-success' : 
                  tx.type === TransactionType.EXPENSE ? 'text-slate-900' :
                  'text-blue-600'
                )}>
                  {tx.type === TransactionType.INCOME ? '+' : tx.type === TransactionType.EXPENSE ? '-' : '⇄'} {formatCurrency(tx.amount, tx.currency)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Search size={32} />
            </div>
            <p className="text-slate-400 font-medium italic">No transactions found matching your search.</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}


function Analytics({ transactions, defaultCurrency }: { transactions: Transaction[], defaultCurrency: string }) {
  const expenseData = CATEGORIES.map(cat => ({
    name: cat.name,
    value: transactions
      .filter(t => t.category === cat.id && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + t.convertedAmount, 0)
  })).filter(d => d.value > 0);

  const COLORS = ['#0f172a', '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const monthlyData = [
    { name: 'Mon', amount: 1200 },
    { name: 'Tue', amount: 900 },
    { name: 'Wed', amount: 1560 },
    { name: 'Thu', amount: 1100 },
    { name: 'Fri', amount: 2100 },
    { name: 'Sat', amount: 1800 },
    { name: 'Sun', amount: 1400 },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-6 px-5 pb-24"
    >
      <h2 className="text-2xl font-bold text-slate-900 mt-4">Analytics</h2>
      
      <div className="card !p-6 shadow-sm border border-slate-50">
        <h3 className="font-bold text-xs text-slate-400 mb-5 uppercase tracking-widest">Weekly Activity</h3>
        <div className="h-48 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#94a3b8', fontWeight: 600}} />
              <Tooltip 
                cursor={{fill: '#f1f5f9'}}
                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
              />
              <Bar dataKey="amount" fill="#0f172a" radius={[4, 4, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <h3 className="font-bold text-sm text-slate-400 mb-4 uppercase tracking-wider">Spending Distribution</h3>
        <div className="h-64 w-full">
          {expenseData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <Pie
                  data={expenseData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {expenseData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
              </RePieChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-slate-400 italic text-sm">
              No expense data yet
            </div>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-bold text-slate-800">By Category</h3>
        {expenseData.sort((a, b) => b.value - a.value).map((data, index) => (
          <div key={data.name} className="flex items-center gap-4">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
            <div className="flex-1">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-medium text-slate-700">{data.name}</span>
                <span className="font-bold">{formatCurrency(data.value, defaultCurrency)}</span>
              </div>
              <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${(data.value / expenseData.reduce((s, d) => s + d.value, 0)) * 100}%` }}
                  className="bg-emerald-500 h-full"
                ></motion.div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function Settings({ defaultCurrency, setDefaultCurrency, budgets, setBudgets }: { 
  defaultCurrency: string, 
  setDefaultCurrency: (c: string) => void,
  budgets: Budget[],
  setBudgets: React.Dispatch<React.SetStateAction<Budget[]>>
}) {
  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      className="space-y-8 px-5 pb-24 overflow-y-auto"
    >
      <h2 className="text-2xl font-bold text-slate-900 mt-4">Settings</h2>
      
      <section className="space-y-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Base Currency</h3>
        <div className="grid grid-cols-2 gap-3">
          {SUPPORTED_CURRENCIES.map((currency) => (
            <button
              key={currency.code}
              onClick={() => setDefaultCurrency(currency.code)}
              className={cn(
                "p-4 rounded-2xl border-2 text-left transition-all",
                defaultCurrency === currency.code ? "border-primary bg-primary/5 text-slate-900" : "border-slate-100 bg-white"
              )}
            >
              <p className="text-lg font-bold">{currency.symbol} {currency.code}</p>
              <p className="text-[10px] text-slate-500 font-medium">{currency.name}</p>
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Category Budgets</h3>
        <div className="space-y-3">
          {budgets.map(budget => (
            <div key={budget.id} className="card !py-4 flex items-center justify-between">
              <span className="font-semibold text-slate-700 capitalize">{budget.category}</span>
              <input 
                type="number"
                value={budget.amount}
                onChange={(e) => setBudgets(budgets.map(b => b.id === budget.id ? { ...b, amount: parseFloat(e.target.value) || 0 } : b))}
                className="w-24 text-right font-bold text-primary bg-transparent border-b border-slate-100 focus:border-primary outline-none"
              />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-[0.15em]">Preferences</h3>
        <div className="card flex items-center justify-between !py-4 shadow-none border border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-lg"><Bell size={18} className="text-slate-500" /></div>
            <p className="font-semibold text-slate-700">Notifications</p>
          </div>
          <div className="w-10 h-6 bg-primary rounded-full flex items-center justify-end p-1">
            <div className="w-4 h-4 bg-white rounded-full"></div>
          </div>
        </div>
        <div className="card flex items-center justify-between !py-4 shadow-none border border-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-slate-50 rounded-xl flex items-center justify-center text-xs font-bold text-slate-500">PIN</div>
            <p className="font-semibold text-slate-700">App Lock</p>
          </div>
          <ChevronRight size={18} className="text-slate-300" />
        </div>
      </section>
    </motion.div>
  );
}

// --- Interaction Modals ---

function AddTransactionSlideOver({ onClose, onSave, onDelete, defaultCurrency, editingTransaction, wallets }: { 
  onClose: () => void, 
  onSave: (tx: any) => void,
  onDelete?: (id: string) => void,
  defaultCurrency: string,
  editingTransaction?: Transaction | null,
  wallets: Wallet[]
}) {
  const [type, setType] = useState<TransactionType>(editingTransaction?.type || TransactionType.EXPENSE);
  const [amount, setAmount] = useState(editingTransaction?.amount.toString() || '');
  const [currency, setCurrency] = useState(editingTransaction?.currency || defaultCurrency);
  const [category, setCategory] = useState(editingTransaction?.category || CATEGORIES[1].id);
  const [notes, setNotes] = useState(editingTransaction?.notes || '');
  const [walletId, setWalletId] = useState(editingTransaction?.walletId || wallets[0]?.id);
  const [fromWalletId, setFromWalletId] = useState(editingTransaction?.fromWalletId || wallets[0]?.id);
  const [toWalletId, setToWalletId] = useState(editingTransaction?.toWalletId || wallets[1]?.id || wallets[0]?.id);
  const [date, setDate] = useState(() => {
    const d = editingTransaction ? new Date(editingTransaction.date) : new Date();
    return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  });

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', damping: 25, stiffness: 300 }}
      className="fixed inset-0 z-[100] bg-white flex flex-col p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-6">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400 hover:text-slate-900 transition-colors">
          <X size={24} />
        </button>
        <h2 className="text-xl font-bold">{editingTransaction ? 'Edit Transaction' : 'New Transaction'}</h2>
        {editingTransaction && onDelete ? (
          <button onClick={() => onDelete(editingTransaction.id)} className="p-2 text-rose-500 hover:text-rose-700 transition-colors">
            <MoreVertical size={24} />
          </button>
        ) : (
          <div className="w-10"></div>
        )}
      </div>

      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
        <button 
          onClick={() => setType(TransactionType.EXPENSE)}
          className={cn("flex-1 py-2.5 font-bold rounded-xl transition-all text-xs uppercase tracking-wider", type === TransactionType.EXPENSE ? "bg-white text-rose-600 shadow-sm" : "text-slate-400")}
        >
          Expense
        </button>
        <button 
          onClick={() => setType(TransactionType.INCOME)}
          className={cn("flex-1 py-2.5 font-bold rounded-xl transition-all text-xs uppercase tracking-wider", type === TransactionType.INCOME ? "bg-white text-emerald-600 shadow-sm" : "text-slate-400")}
        >
          Income
        </button>
        <button 
          onClick={() => setType(TransactionType.TRANSFER)}
          className={cn("flex-1 py-2.5 font-bold rounded-xl transition-all text-xs uppercase tracking-wider", type === TransactionType.TRANSFER ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
        >
          Transfer
        </button>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto no-scrollbar pb-10">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Amount</label>
          <div className="flex items-center gap-4 bg-slate-50 p-6 rounded-[24px] border border-slate-100">
            <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white border text-sm font-bold p-2 px-3 rounded-xl shadow-sm outline-none"
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
            <input 
              type="number" 
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="flex-1 bg-transparent text-3xl font-bold outline-none text-slate-900"
            />
          </div>
        </div>

        {type === TransactionType.TRANSFER ? (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">From Account</label>
              <select 
                value={fromWalletId}
                onChange={(e) => setFromWalletId(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none text-sm font-semibold"
              >
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
              </select>
            </div>
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">To Account</label>
              <select 
                value={toWalletId}
                onChange={(e) => setToWalletId(e.target.value)}
                className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none text-sm font-semibold"
              >
                {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
              </select>
            </div>
          </div>
        ) : (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Account</label>
            <select 
              value={walletId}
              onChange={(e) => setWalletId(e.target.value)}
              className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none text-sm font-semibold"
            >
              {wallets.map(w => <option key={w.id} value={w.id}>{w.name} ({w.currency})</option>)}
            </select>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Date & Time</label>
            <input 
              type="datetime-local"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none text-sm font-semibold"
            />
          </div>
        </div>

        {type !== TransactionType.TRANSFER && (
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Category</label>
            <div className="grid grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "flex flex-col items-center p-3 rounded-2xl border transition-all gap-1",
                    category === cat.id ? "bg-primary border-primary text-white" : "bg-white border-slate-100 text-slate-400"
                  )}
                >
                   <div className="text-[10px] font-bold truncate w-full text-center">{cat.name.split(' ')[0]}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 block">Notes</label>
          <textarea 
            placeholder="What was this for?"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none text-sm min-h-[100px]"
          />
        </div>
      </div>

      <div className="flex gap-3">
        {editingTransaction && (
          <button 
            onClick={() => onDelete && onDelete(editingTransaction.id)}
            className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-[24px] font-bold text-lg active:scale-95 transition-all mb-4"
          >
            Delete
          </button>
        )}
        <button 
          onClick={() => {
            if (!amount) return;
            onSave({
              amount: parseFloat(amount),
              currency,
              category: type === TransactionType.TRANSFER ? 'transfer' : category,
              notes: notes || (type === TransactionType.TRANSFER ? 'Wallet Transfer' : 'No notes'),
              type,
              date: new Date(date).toISOString(),
              walletId: type === TransactionType.TRANSFER ? undefined : walletId,
              fromWalletId: type === TransactionType.TRANSFER ? fromWalletId : undefined,
              toWalletId: type === TransactionType.TRANSFER ? toWalletId : undefined,
            });
          }}
          className={cn(
            "py-5 rounded-[24px] font-bold text-lg shadow-xl active:scale-95 transition-all mb-4 flex-[2] text-white",
            type === TransactionType.INCOME ? "bg-emerald-600 shadow-emerald-100" :
            type === TransactionType.EXPENSE ? "bg-primary shadow-slate-200" :
            "bg-blue-600 shadow-blue-100"
          )}
        >
          {editingTransaction ? 'Update' : 'Save'} Transaction
        </button>
      </div>
    </motion.div>
  );
}

function AddWalletSlideOver({ onClose, onSave, onDelete, editingWallet }: { 
  onClose: () => void, 
  onSave: (w: any) => void,
  onDelete?: (id: string) => void,
  editingWallet?: Wallet | null
}) {
  const [name, setName] = useState(editingWallet?.name || '');
  const [balance, setBalance] = useState(editingWallet?.balance.toString() || '');
  const [currency, setCurrency] = useState(editingWallet?.currency || 'NGN');
  const [type, setType] = useState<Wallet['type']>(editingWallet?.type || 'bank');

  return (
    <motion.div 
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      className="fixed inset-0 z-[110] bg-white flex flex-col p-6 shadow-2xl"
    >
      <div className="flex justify-between items-center mb-8">
        <button onClick={onClose} className="p-2 -ml-2 text-slate-400"><X size={24} /></button>
        <h2 className="text-xl font-bold">{editingWallet ? 'Edit Account' : 'New Account'}</h2>
        {editingWallet && onDelete ? (
          <button onClick={() => onDelete(editingWallet.id)} className="p-2 text-rose-500 hover:text-rose-700 transition-colors">
            <MoreVertical size={24} />
          </button>
        ) : (
          <div className="w-10"></div>
        )}
      </div>

      <div className="space-y-6 flex-1">
        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Account Name</label>
          <input 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Savings, Salary Account"
            className="w-full bg-slate-50 p-4 rounded-2xl border border-slate-100 outline-none font-semibold"
          />
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Balance</label>
          <div className="flex items-center gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-100">
             <select 
              value={currency} 
              onChange={(e) => setCurrency(e.target.value)}
              className="bg-white border text-xs font-bold p-2 rounded-xl outline-none"
            >
              {SUPPORTED_CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.code}</option>)}
            </select>
            <input 
              type="number"
              value={balance}
              onChange={(e) => setBalance(e.target.value)}
              placeholder="0.00"
              className="flex-1 bg-transparent font-bold text-xl outline-none"
            />
          </div>
        </div>

        <div>
          <label className="text-[10px] font-bold text-slate-400 uppercase mb-2 block tracking-widest">Account Type</label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { id: 'bank', name: 'Bank', icon: <CreditCard size={18} /> },
              { id: 'cash', name: 'Cash', icon: <Banknote size={18} /> },
              { id: 'savings', name: 'Savings', icon: <PiggyBank size={18} /> },
              { id: 'investment', name: 'Investment', icon: <TrendingUp size={18} /> },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setType(t.id as any)}
                className={cn(
                  "p-4 rounded-2xl border flex items-center gap-3 transition-all",
                  type === t.id ? "bg-primary text-white border-primary" : "bg-white text-slate-500 border-slate-100"
                )}
              >
                {t.icon}
                <span className="text-sm font-bold">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {editingWallet && onDelete && (
          <button 
            onClick={() => onDelete(editingWallet.id)}
            className="flex-1 bg-rose-50 text-rose-600 py-5 rounded-[24px] font-bold text-lg active:scale-95 transition-all mb-4"
          >
            Delete
          </button>
        )}
        <button 
          onClick={() => {
            if (!name || !balance) return;
            onSave({ name, balance: parseFloat(balance), currency, type });
            onClose();
          }}
          className="w-full bg-primary text-white py-5 rounded-[24px] font-bold text-lg shadow-xl flex-[2]"
        >
          {editingWallet ? 'Update' : 'Create'} Account
        </button>
      </div>
    </motion.div>
  );
}
