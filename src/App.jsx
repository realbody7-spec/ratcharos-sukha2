import React, { useState, useEffect } from 'react';
import { mockTransactions, mockInventory, mockBudgets } from './mockData';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Settings from './components/Settings';
import BarChart from './components/BarChart';
import PieChart, { getTransactionCategory, getParentBudgetCategory } from './components/PieChart';

// Helper to format a JS Date object into "YYYY-MM-DD" in Bangkok timezone
function formatLocalDateToBangkok(d) {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: 'Asia/Bangkok',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
    const parts = formatter.formatToParts(d);
    const month = parts.find(p => p.type === 'month').value;
    const day = parts.find(p => p.type === 'day').value;
    let year = parseInt(parts.find(p => p.type === 'year').value);
    if (year > 2400) {
      year -= 543;
    }
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("formatLocalDateToBangkok error:", e);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y > 2400 ? y - 543 : y}-${m}-${day}`;
  }
}

// Helper to parse dates in various formats into a "YYYY-MM-DD" string in Bangkok timezone
function parseDateToBangkokString(dt) {
  if (!dt) return '';
  
  if (typeof dt === 'string') {
    if (dt.includes('T')) {
      try {
        const d = new Date(dt);
        if (!isNaN(d.getTime())) {
          return formatLocalDateToBangkok(d);
        }
      } catch (e) {
        console.error("Error parsing ISO date string:", e);
      }
    }
    
    let clean = dt.replace(/\//g, '-').trim();
    clean = clean.split(' ')[0];
    const parts = clean.split('-');
    if (parts.length === 3) {
      let year = parseInt(parts[0]);
      let month = parseInt(parts[1]);
      let day = parseInt(parts[2]);
      
      if (parts[2].length === 4) { // DD-MM-YYYY format
        year = parseInt(parts[2]);
        month = parseInt(parts[1]);
        day = parseInt(parts[0]);
      }
      
      if (!isNaN(year) && !isNaN(month) && !isNaN(day)) {
        if (year > 2400) {
          year -= 543;
        }
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }
  
  if (dt instanceof Date || (typeof dt === 'object' && dt !== null && typeof dt.getTime === 'function')) {
    return formatLocalDateToBangkok(dt);
  }
  
  try {
    const d = new Date(dt);
    if (!isNaN(d.getTime())) {
      return formatLocalDateToBangkok(d);
    }
  } catch (e) {}
  
  return String(dt);
}

// Helper to normalize transaction keys from Google Sheets (handles case variations and Thai headers)
function normalizeTransaction(t) {
  if (!t) return t;
  const normalized = {};
  
  const keyMap = {
    id: ['id', 'รหัส', 'id/รหัส'],
    type: ['type', 'ประเภท', 'รับ/จ่าย', 'รับ-จ่าย', 'ประเภทธุรกรรม', 'ประเภทรายการ', 'รายการรับ/จ่าย', 'รับจ่าย'],
    title: ['title', 'รายการ', 'ชื่อรายการ', 'คำอธิบาย', 'รายละเอียด'],
    amount: ['amount', 'ยอดเงิน', 'จำนวนเงิน', 'ราคา', 'ยอดรวม', 'เงิน', 'จำนวนเงิน (บาท)', 'ยอดเงิน (บาท)'],
    date: ['date', 'วันที่', 'วัน', 'วันที่ทำรายการ'],
    category: ['category', 'หมวดหมู่', 'ประเภทรายจ่าย', 'กลุ่ม'],
    notes: ['notes', 'หมายเหตุ', 'คำอธิบายเพิ่มเติม'],
    itemName: ['itemname', 'item_name', 'itemName', 'สินค้าคงคลัง', 'สินค้า', 'ชนิดวัตถุดิบ', 'ชื่อสินค้า', 'รายการสินค้า', 'ชื่อวัตถุดิบ', 'วัตถุดิบ', 'วัตถุดิบ/สินค้า', 'ชื่อสินค้า/วัตถิบ', 'สินค้า/วัตถิบ', 'สินค้าคงคลัง/วัตถุดิบ'],
    quantity: ['quantity', 'จำนวน', 'ปริมาณ', 'qty'],
    unit: ['unit', 'หน่วย', 'หน่วยนับ'],
    pricePerUnit: ['priceperunit', 'price_per_unit', 'pricePerUnit', 'ราคาต่อหน่วย', 'ราคาทุนต่อหน่วย', 'ราคาทุนล่าสุด', 'ราคา/หน่วย', 'ทุน/หน่วย', 'ทุนต่อหน่วย']
  };

  Object.keys(t).forEach(rawKey => {
    const cleanRawKey = rawKey.trim().toLowerCase();
    let foundStandardKey = null;
    for (const [stdKey, variants] of Object.entries(keyMap)) {
      if (stdKey.toLowerCase() === cleanRawKey || 
          variants.some(v => v.toLowerCase() === cleanRawKey)) {
        foundStandardKey = stdKey;
        break;
      }
    }
    
    if (foundStandardKey) {
      normalized[foundStandardKey] = t[rawKey];
    } else {
      normalized[rawKey] = t[rawKey];
    }
  });

  // 1. Normalize cell values for 'type' (receives/payments, income/expense)
  if (normalized.type) {
    const val = normalized.type.toString().toLowerCase().trim();
    if (val.includes('รับ') || val.includes('รายรับ') || val.includes('income') || val.includes('ขาย') || val.includes('เข้า')) {
      normalized.type = 'income';
    } else {
      normalized.type = 'expense';
    }
  } else {
    // Guess type from title or category if not explicitly provided
    const title = (normalized.title || '').toString().toLowerCase();
    const cat = (normalized.category || '').toString().toLowerCase();
    if (title.includes('ขาย') || title.includes('รับเงิน') || title.includes('ยอดขาย') || cat.includes('dine-in') || cat.includes('delivery') || cat.includes('catering')) {
      normalized.type = 'income';
    } else {
      normalized.type = 'expense';
    }
  }

  // 2. Clean and parse amount (removes commas, currency symbols, and spaces)
  if (normalized.amount !== undefined && normalized.amount !== null) {
    if (typeof normalized.amount === 'string') {
      const cleanAmt = normalized.amount.replace(/[^0-9.-]/g, ''); // allow negative for general support
      normalized.amount = parseFloat(cleanAmt) || 0;
    } else {
      normalized.amount = parseFloat(normalized.amount) || 0;
    }
  } else {
    normalized.amount = 0;
  }

  // 3. Clean and parse quantity
  if (normalized.quantity !== undefined && normalized.quantity !== null && normalized.quantity !== '') {
    if (typeof normalized.quantity === 'string') {
      const cleanQty = normalized.quantity.replace(/[^0-9.-]/g, '');
      normalized.quantity = cleanQty !== '' ? parseFloat(cleanQty) : '';
    } else {
      normalized.quantity = parseFloat(normalized.quantity);
    }
  } else {
    normalized.quantity = '';
  }

  // 4. Clean and parse pricePerUnit
  if (normalized.pricePerUnit !== undefined && normalized.pricePerUnit !== null && normalized.pricePerUnit !== '') {
    if (typeof normalized.pricePerUnit === 'string') {
      const cleanPPU = normalized.pricePerUnit.replace(/[^0-9.-]/g, '');
      normalized.pricePerUnit = cleanPPU !== '' ? parseFloat(cleanPPU) : '';
    } else {
      normalized.pricePerUnit = parseFloat(normalized.pricePerUnit);
    }
  } else {
    normalized.pricePerUnit = '';
  }

  // 5. Normalize date format (robust parsing for Thai BE years and slashes)
  normalized.date = parseDateToBangkokString(normalized.date);

  return normalized;
}

// Helper to normalize inventory keys from Google Sheets
function normalizeInventory(item) {
  if (!item) return item;
  const normalized = {};
  const keyMap = {
    id: ['id', 'รหัส'],
    name: ['name', 'ชื่อ', 'ชื่อวัตถุดิบ', 'ชื่อสินค้า', 'ชื่อวัตถุดิบ/สินค้า', 'วัตถุดิบ/สินค้า', 'สินค้า/วัตถุดิบ', 'สินค้าคงคลัง', 'วัตถุดิบ'],
    category: ['category', 'หมวดหมู่'],
    quantity: ['quantity', 'จำนวน', 'ปริมาณ', 'จำนวนคงเหลือ', 'qty'],
    unit: ['unit', 'หน่วย', 'หน่วยนับ'],
    costPerUnit: ['costperunit', 'cost_per_unit', 'costPerUnit', 'ราคาทุนล่าสุด', 'ราคาต่อหน่วย', 'ทุนต่อหน่วย', 'cost', 'ราคาทุน', 'ราคา/หน่วย']
  };

  Object.keys(item).forEach(rawKey => {
    const cleanRawKey = rawKey.trim().toLowerCase();
    let foundStandardKey = null;
    for (const [stdKey, variants] of Object.entries(keyMap)) {
      if (stdKey.toLowerCase() === cleanRawKey || 
          variants.some(v => v.toLowerCase() === cleanRawKey)) {
        foundStandardKey = stdKey;
        break;
      }
    }
    
    if (foundStandardKey) {
      normalized[foundStandardKey] = item[rawKey];
    } else {
      normalized[rawKey] = item[rawKey];
    }
  });

  // Clean numbers
  if (normalized.quantity !== undefined && normalized.quantity !== null) {
    if (typeof normalized.quantity === 'string') {
      const cleanQty = normalized.quantity.replace(/[^0-9.-]/g, '');
      normalized.quantity = parseFloat(cleanQty) || 0;
    } else {
      normalized.quantity = parseFloat(normalized.quantity) || 0;
    }
  }

  if (normalized.costPerUnit !== undefined && normalized.costPerUnit !== null) {
    if (typeof normalized.costPerUnit === 'string') {
      const cleanCost = normalized.costPerUnit.replace(/[^0-9.-]/g, '');
      normalized.costPerUnit = parseFloat(cleanCost) || 0;
    } else {
      normalized.costPerUnit = parseFloat(normalized.costPerUnit) || 0;
    }
  }

  return normalized;
}

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');

  // Database Connection Configuration
  const [apiUrl, setApiUrl] = useState(() => localStorage.getItem('racharod_api_url') || '');
  const [useMock, setUseMock] = useState(() => {
    const saved = localStorage.getItem('racharod_use_mock');
    return saved !== null ? JSON.parse(saved) : !localStorage.getItem('racharod_api_url');
  });

  // Application Data States
  const [transactions, setTransactions] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [budgets, setBudgets] = useState(mockBudgets);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Date Filter States (Year, Month, Day)
  const [selectedYear, setSelectedYear] = useState('all');
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedDay, setSelectedDay] = useState('all');

  // Add Transaction Form visibility toggle
  const [showAddForm, setShowAddForm] = useState(false);

  // Persist useMock configuration
  useEffect(() => {
    localStorage.setItem('racharod_use_mock', JSON.stringify(useMock));
  }, [useMock]);

  // Load data based on mock or live configuration
  const loadData = async () => {
    if (useMock) {
      setLoading(true);
      setErrorMsg('');
      setTimeout(() => {
        setTransactions(mockTransactions);
        setInventory(mockInventory);
        setBudgets(mockBudgets);
        setLoading(false);
      }, 350);
    } else {
      await fetchLiveData();
    }
  };

  const fetchLiveData = async () => {
    if (!apiUrl) {
      setErrorMsg('กรุณากรอก API URL ในหน้าเชื่อมต่อระบบคลาวด์');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const response = await fetch(`${apiUrl}?action=getData`);
      const data = await response.json();
      if (data) {
        if (data.error) {
          setErrorMsg(data.error);
        } else {
          // Format transactions date, normalize fields, and sort descending
          const formattedTx = (data.transactions || []).map(t => {
            return normalizeTransaction(t);
          }).sort((a,b) => new Date(b.date) - new Date(a.date));

          setTransactions(formattedTx);
          setInventory((data.inventory || []).map(item => normalizeInventory(item)));
          if (data.budgets && Object.keys(data.budgets).length > 0) {
            setBudgets(data.budgets);
          }
        }
      } else {
        setErrorMsg('ไม่ได้รับข้อมูลการตอบกลับจากเซิร์ฟเวอร์');
      }
    } catch (err) {
      setErrorMsg(`การดึงข้อมูลล้มเหลว: ${err.message}. กำลังกลับสู่โหมดจำลอง...`);
      setUseMock(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [useMock, apiUrl]);

  // Handle adding a transaction
  const handleAddTransaction = async (newTx) => {
    if (useMock) {
      const updatedTx = [newTx, ...transactions];
      setTransactions(updatedTx);

      // Update mock inventory stock if it's an expense with a name
      if (newTx.type === 'expense' && newTx.itemName) {
        const updatedInv = [...inventory];
        const itemIndex = updatedInv.findIndex(
          item => item.name.toString().toLowerCase() === newTx.itemName.toString().toLowerCase()
        );
        const qty = parseFloat(newTx.quantity) || 1;
        const cost = parseFloat(newTx.pricePerUnit) || parseFloat(newTx.amount) || 0;

        if (itemIndex !== -1) {
          updatedInv[itemIndex].quantity = (parseFloat(updatedInv[itemIndex].quantity) || 0) + qty;
          if (cost > 0) updatedInv[itemIndex].costPerUnit = cost;
        } else {
          updatedInv.push({
            id: `inv-${Date.now()}`,
            name: newTx.itemName,
            category: newTx.category,
            quantity: qty,
            unit: newTx.unit || 'กก.',
            costPerUnit: cost
          });
        }
        setInventory(updatedInv);
      }
    } else {
      try {
        setLoading(true);
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'saveTransaction',
            ...newTx
          })
        });
        const result = await response.json();
        if (result.status === 'success') {
          await fetchLiveData();
        } else {
          alert(`ล้มเหลวในการบันทึก: ${result.error || 'กรุณาลองใหม่อีกครั้ง'}`);
        }
      } catch (err) {
        alert(`เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
  };

  // --- Date Filtering Logic ---
  const uniqueYears = Array.from(
    new Set(transactions.map(t => (t.date || '').split('-')[0]))
  ).filter(Boolean).sort().reverse();

  const filteredForMonths = selectedYear === 'all' 
    ? transactions 
    : transactions.filter(t => (t.date || '').startsWith(selectedYear));
  
  const uniqueMonths = Array.from(
    new Set(filteredForMonths.map(t => {
      const parts = (t.date || '').split('-');
      if (parts.length >= 2) {
        return (parseInt(parts[1]) - 1).toString(); // 0-11 index
      }
      return null;
    }))
  ).filter(m => m !== null).sort((a, b) => parseInt(a) - parseInt(b));

  const filteredForDays = transactions.filter(t => {
    const parts = (t.date || '').split('-');
    if (parts.length < 3) return false;
    
    const yearMatch = selectedYear === 'all' || parts[0] === selectedYear;
    const monthMatch = selectedMonth === 'all' || (parseInt(parts[1]) - 1).toString() === selectedMonth;
    return yearMatch && monthMatch;
  });

  const uniqueDays = Array.from(
    new Set(filteredForDays.map(t => (t.date || '').split('-')[2]))
  ).filter(Boolean).sort((a, b) => parseInt(a) - parseInt(b));

  // Date-filtered Transactions (Step 1)
  const dateFilteredTransactions = transactions.filter(t => {
    const parts = (t.date || '').split('-');
    if (parts.length < 3) return false;

    const yearMatch = selectedYear === 'all' || parts[0] === selectedYear;
    const monthMatch = selectedMonth === 'all' || (parseInt(parts[1]) - 1).toString() === selectedMonth;
    const dayMatch = selectedDay === 'all' || parts[2] === selectedDay.padStart(2, '0');
    return yearMatch && monthMatch && dayMatch;
  });

  // Category filter state
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Final Filtered Transactions (Step 2)
  const filteredTransactions = dateFilteredTransactions.filter(t => {
    if (selectedCategory === 'all') return true;
    return t.type === 'expense' && getTransactionCategory(t) === selectedCategory;
  });

  // Calculate statistics for currently filtered transactions
  let totalIncome = 0;
  let totalExpense = 0;
  let foodCostExpense = 0;

  filteredTransactions.forEach(tx => {
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'income') {
      totalIncome += amt;
    } else {
      totalExpense += amt;
      if (getParentBudgetCategory(tx) === 'raw-mat') {
        foodCostExpense += amt;
      }
    }
  });

  const netProfit = totalIncome - totalExpense;
  const foodCostPercent = totalIncome > 0 ? ((foodCostExpense / totalIncome) * 100).toFixed(1) : '0.0';

  const translateMonth = (monthIndex) => {
    const months = [
      'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
      'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'
    ];
    return months[monthIndex];
  };

  const getPageTitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'แดชบอร์ดสรุปผลการเงิน';
      case 'transactions': return 'บันทึกรายการบัญชี';
      case 'inventory': return 'คลังสต็อกวัตถุดิบ';
      case 'settings': return 'เชื่อมต่อระบบคลาวด์';
      default: return 'ResAcc Cloud';
    }
  };

  const getPageSubtitle = () => {
    switch(activeTab) {
      case 'dashboard': return 'ภาพรวมสถานะ รายรับ-รายจ่าย อัตรากำไร และต้นทุนวัตถุดิบ';
      case 'transactions': return 'คีย์บิลซื้อขาย ตรวจสอบบัญชีย้อนหลัง และสืบค้นรายการ';
      case 'inventory': return 'จัดการจำนวนสต็อกคงคลัง มูลค่าทรัพย์สิน และแจ้งเตือนวัตถุดิบใกล้หมด';
      case 'settings': return 'ตั้งค่า Google Sheets API และจัดการจำลองเซิร์ฟเวอร์';
      default: return '';
    }
  };

  return (
    <div className="app-container">
      {/* 1. Sidebar (Desktop only) */}
      <aside className="app-sidebar">
        <div className="sidebar-logo">
          <div className="sidebar-logo-icon">🍳</div>
          <div className="sidebar-logo-text">
            <h1>ResAcc Cloud</h1>
            <span>บัญชี & สต็อกร้านอาหาร</span>
          </div>
        </div>
        <nav className="sidebar-nav">
          <button 
            className={`sidebar-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setActiveTab('dashboard')}
          >
            <span className="sidebar-btn-icon">📊</span>
            <span>แดชบอร์ดสรุปผล</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'transactions' ? 'active' : ''}`}
            onClick={() => setActiveTab('transactions')}
          >
            <span className="sidebar-btn-icon">📋</span>
            <span>บันทึกรายรับ-รายจ่าย</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'inventory' ? 'active' : ''}`}
            onClick={() => setActiveTab('inventory')}
          >
            <span className="sidebar-btn-icon">📦</span>
            <span>คลังสต็อกวัตถุดิบ</span>
          </button>
          <button 
            className={`sidebar-btn ${activeTab === 'settings' ? 'active' : ''}`}
            onClick={() => setActiveTab('settings')}
          >
            <span className="sidebar-btn-icon">☁️</span>
            <span>เชื่อมต่อระบบคลาวด์</span>
          </button>
        </nav>
        <div className="sidebar-footer">
          ResAcc Cloud v1.3.0
        </div>
      </aside>

      {/* 2. Mobile Header */}
      <header className="app-mobile-header">
        <div className="mobile-logo">
          <div className="mobile-logo-icon">🍳</div>
          <h1>ResAcc Cloud</h1>
        </div>
        <div className="mobile-actions">
          {!useMock && (
            <button className="btn-mobile-sync" onClick={loadData}>
              ซิงค์
            </button>
          )}
        </div>
      </header>

      {/* 3. Main Dashboard Wrapper */}
      <main className="app-main">
        {/* Desktop Top bar */}
        <header className="app-topbar">
          <div className="topbar-title">
            <h2>{getPageTitle()}</h2>
            <p>{getPageSubtitle()}</p>
          </div>
          
          <div className="topbar-actions">
            {/* Global Month/Date Filter inside Header */}
            <div className="filter-controls" style={{ gridTemplateColumns: 'auto auto auto', gap: '8px', padding: '0px' }}>
              <select 
                value={selectedYear} 
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedMonth('all');
                  setSelectedDay('all');
                }}
                className="glass-select"
                style={{ fontSize: '0.75rem', padding: '6px 12px', minWidth: '100px' }}
              >
                <option value="all">ปีทั้งหมด</option>
                {uniqueYears.map(year => {
                  const BE = parseInt(year) + 543;
                  return <option key={year} value={year}>{BE} ({year})</option>;
                })}
              </select>

              <select 
                value={selectedMonth} 
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  setSelectedDay('all');
                }}
                className="glass-select"
                style={{ fontSize: '0.75rem', padding: '6px 12px', minWidth: '110px' }}
              >
                <option value="all">ทุกเดือน</option>
                {uniqueMonths.map(month => (
                  <option key={month} value={month}>{translateMonth(parseInt(month))}</option>
                ))}
              </select>

              <select 
                value={selectedDay} 
                onChange={(e) => setSelectedDay(e.target.value)}
                className="glass-select"
                style={{ fontSize: '0.75rem', padding: '6px 12px', minWidth: '90px' }}
              >
                <option value="all">ทุกวัน</option>
                {uniqueDays.map(day => (
                  <option key={day} value={day}>วันที่ {parseInt(day)}</option>
                ))}
              </select>
            </div>

            <div className="topbar-status">
              <span className={`status-dot ${useMock ? 'simulation' : 'live'}`}></span>
              <span>{useMock ? 'โหมดจำลอง (Local)' : 'เชื่อมต่อชีตจริง'}</span>
            </div>

            {!useMock && (
              <button className="btn btn-secondary" style={{ padding: '8px 14px' }} onClick={loadData}>
                🔄 ซิงค์ Sheets
              </button>
            )}

            {activeTab === 'transactions' && (
              <button 
                className="btn btn-primary" 
                style={{ padding: '8px 14px' }} 
                onClick={() => setShowAddForm(!showAddForm)}
              >
                {showAddForm ? '✕ ปิดฟอร์ม' : '➕ บันทึกรายการ'}
              </button>
            )}
          </div>
        </header>

        {/* Mobile Date Filter Banner */}
        <div className="app-mobile-filter-banner" style={{ display: 'none' }}>
          {/* Managed responsively via CSS and layout */}
        </div>

        {/* Loading Overlay */}
        {loading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>กำลังซิงค์และคำนวณข้อมูล...</p>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && (
          <div className="app-error-banner">
            ⚠️ {errorMsg}
            <button className="error-close-btn" onClick={() => setErrorMsg('')}>✕</button>
          </div>
        )}

        {/* Content Body */}
        <div className="app-main-content">
          
          {/* 1. TAB: DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Mobile Filter Options block (placed dynamically) */}
              <div className="glass-card filter-card md:hidden" style={{ padding: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '10px' }}>ตัวกรองรอบบัญชี (Filters):</h4>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => { setSelectedYear(e.target.value); setSelectedMonth('all'); setSelectedDay('all'); }}
                    className="glass-select"
                  >
                    <option value="all">ปีทั้งหมด</option>
                    {uniqueYears.map(year => (
                      <option key={year} value={year}>{parseInt(year) + 543} ({year})</option>
                    ))}
                  </select>

                  <select 
                    value={selectedMonth} 
                    onChange={(e) => { setSelectedMonth(e.target.value); setSelectedDay('all'); }}
                    className="glass-select"
                  >
                    <option value="all">ทุกเดือน</option>
                    {uniqueMonths.map(month => (
                      <option key={month} value={month}>{translateMonth(parseInt(month))}</option>
                    ))}
                  </select>

                  <select 
                    value={selectedDay} 
                    onChange={(e) => setSelectedDay(e.target.value)}
                    className="glass-select"
                    style={{ gridColumn: 'span 2' }}
                  >
                    <option value="all">ทุกวัน</option>
                    {uniqueDays.map(day => (
                      <option key={day} value={day}>วันที่ {parseInt(day)}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Stats Panel Cards */}
              <div className="stats-grid">
                <div className="stat-box income">
                  <div className="stat-box-inner">
                    <span className="stat-title">รายรับทั้งหมด (ยอดขาย)</span>
                    <span className="stat-amount text-green">฿{totalIncome.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>📈</div>
                </div>

                <div className="stat-box expense">
                  <div className="stat-box-inner">
                    <span className="stat-title">รายจ่ายรวม</span>
                    <span className="stat-amount text-red">฿{totalExpense.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>📉</div>
                </div>

                <div className="stat-box foodcost">
                  <div className="stat-box-inner">
                    <span className="stat-title">สัดส่วนต้นทุนวัตถุดิบ</span>
                    <span className="stat-amount" style={{ color: 'var(--color-primary)' }}>{foodCostPercent}%</span>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>🍕</div>
                </div>

                <div className={`stat-box profit ${netProfit >= 0 ? 'positive' : 'negative'}`}>
                  <div className="stat-box-inner">
                    <span className="stat-title">กำไรสุทธิ (Net Profit)</span>
                    <span className="stat-amount text-blue">
                      {netProfit >= 0 ? '+' : ''}฿{netProfit.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div style={{ fontSize: '1.5rem' }}>💰</div>
                </div>
              </div>

              {/* Category Drill-Down Banner */}
              {selectedCategory !== 'all' && (
                <div className="alert-box success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.85rem' }}>
                    🔍 กำลังแสดงเฉพาะยอดในหมวดหมู่รายจ่าย: <strong>{selectedCategory}</strong> (ยอดรวมในหมวดหมู่นี้: ฿{filteredTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', backgroundColor: '#ffffff', cursor: 'pointer' }} 
                    onClick={() => setSelectedCategory('all')}
                  >
                    แสดงหมวดหมู่ทั้งหมด ✕
                  </button>
                </div>
              )}

              {/* Charts row */}
              <div className="charts-container-row">
                <BarChart transactions={filteredTransactions} />
                <PieChart 
                  transactions={dateFilteredTransactions} 
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  setActiveTab={setActiveTab}
                />
              </div>

              {/* Budgets Card */}
              <div className="glass-card budget-card">
                <div className="card-header">
                  <span className="icon-main">📊</span>
                  <h3>งบประมาณรายจ่ายรายเดือนร้านราชรส (Fixed & Variable Costs)</h3>
                </div>
                <div className="card-body">
                  <div className="budget-grid">
                    {Object.entries(budgets).map(([cat, limit]) => {
                      const actual = filteredTransactions
                        .filter(tx => tx.type === 'expense' && getParentBudgetCategory(tx) === cat)
                        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
                      
                      const pct = Math.min((actual / limit) * 100, 100);
                      const isOver = actual > limit;
                      
                      const catNames = {
                        'raw-mat': 'วัตถุดิบและของสด 🥩',
                        'fixed-rent': 'ค่าเช่าร้านคงที่ 🏢',
                        'fixed-salary': 'ค่าจ้างพนักงาน 👥',
                        'utilities': 'ค่าน้ำ ไฟ แก๊สหุงต้ม ⚡',
                        'marketing': 'ค่าโฆษณาและการตลาด 📢',
                        'other-exp': 'ค่าใช้จ่ายทั่วไป 📦'
                      };

                      return (
                        <div key={cat} className="budget-item">
                          <div className="budget-info">
                            <span className="budget-cat-name">{catNames[cat] || cat}</span>
                            <span className={`budget-usage ${isOver ? 'over' : ''}`}>
                              ฿{actual.toLocaleString()} / ฿{limit.toLocaleString()}
                            </span>
                          </div>
                          <div className="progress-bar-bg">
                            <div 
                              className={`progress-bar-fill ${isOver ? 'danger' : pct > 80 ? 'warning' : 'success'}`} 
                              style={{ width: `${pct}%`, backgroundColor: isOver ? 'var(--color-red)' : pct > 80 ? 'var(--color-yellow)' : 'var(--color-green)' }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. TAB: TRANSACTIONS LOG */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              {/* Category Drill-Down Banner */}
              {selectedCategory !== 'all' && (
                <div className="alert-box success" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 0 20px 0', border: '1px solid var(--color-primary)', background: 'var(--color-primary-light)' }}>
                  <span style={{ color: 'var(--color-primary)', fontWeight: '600', fontSize: '0.85rem' }}>
                    🔍 กำลังแสดงเฉพาะยอดในหมวดหมู่รายจ่าย: <strong>{selectedCategory}</strong> (ยอดรวมในหมวดหมู่นี้: ฿{filteredTransactions.reduce((sum, tx) => sum + (parseFloat(tx.amount) || 0), 0).toLocaleString(undefined, { maximumFractionDigits: 0 })})
                  </span>
                  <button 
                    className="btn btn-secondary" 
                    style={{ padding: '6px 12px', fontSize: '0.75rem', color: 'var(--color-primary)', borderColor: 'var(--color-primary)', backgroundColor: '#ffffff', cursor: 'pointer' }} 
                    onClick={() => setSelectedCategory('all')}
                  >
                    แสดงหมวดหมู่ทั้งหมด ✕
                  </button>
                </div>
              )}
              <Dashboard 
                transactions={filteredTransactions} 
                budgets={budgets}
                onAddTransaction={handleAddTransaction}
                getParentBudgetCategory={getParentBudgetCategory}
                selectedYear={selectedYear}
                setSelectedYear={setSelectedYear}
                selectedMonth={selectedMonth}
                setSelectedMonth={setSelectedMonth}
                selectedDay={selectedDay}
                setSelectedDay={setSelectedDay}
                uniqueYears={uniqueYears}
                uniqueMonths={uniqueMonths}
                uniqueDays={uniqueDays}
              />
            </div>
          )}

          {/* 3. TAB: INVENTORY STOCK */}
          {activeTab === 'inventory' && (
            <Inventory inventory={inventory} />
          )}

          {/* 4. TAB: SETTINGS & CLOUD CONNECT */}
          {activeTab === 'settings' && (
            <Settings 
              apiUrl={apiUrl} 
              setApiUrl={setApiUrl} 
              useMock={useMock} 
              setUseMock={setUseMock}
              onRefresh={loadData}
            />
          )}
        </div>
      </main>

      {/* 4. Fixed Tab Navigation (Visible on mobile screens at the bottom) */}
      <nav className="tab-navigation">
        <button 
          className={`nav-tab-btn ${activeTab === 'dashboard' ? 'active' : ''}`}
          onClick={() => setActiveTab('dashboard')}
        >
          <span className="tab-icon">📊</span>
          <span>สรุปผล</span>
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <span className="tab-icon">📋</span>
          <span>บัญชี</span>
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'inventory' ? 'active' : ''}`}
          onClick={() => setActiveTab('inventory')}
        >
          <span className="tab-icon">📦</span>
          <span>สต็อก</span>
        </button>
        <button 
          className={`nav-tab-btn ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
          <span className="tab-icon">☁️</span>
          <span>คลาวด์</span>
        </button>
      </nav>
    </div>
  );
}
