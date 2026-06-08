import React, { useState } from 'react';

export default function Dashboard({ 
  transactions, 
  budgets, 
  onAddTransaction
}) {
  // Filters local to the Transactions tab
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [type, setType] = useState('expense');
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('raw-mat');
  const [notes, setNotes] = useState('');
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('กก.');
  const [pricePerUnit, setPricePerUnit] = useState('');

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (!title || !amount) {
      alert('กรุณากรอกรายการและยอดเงิน');
      return;
    }

    const payload = {
      id: `t-manual-${Date.now()}`,
      type,
      title,
      amount: parseFloat(amount),
      date,
      category,
      notes,
      itemName: type === 'expense' ? itemName : '',
      quantity: type === 'expense' && quantity ? parseFloat(quantity) : '',
      unit: type === 'expense' ? unit : '',
      pricePerUnit: type === 'expense' && pricePerUnit ? parseFloat(pricePerUnit) : ''
    };

    onAddTransaction(payload);

    // Reset Form
    setTitle('');
    setAmount('');
    setNotes('');
    setItemName('');
    setQuantity('');
    setPricePerUnit('');
    setShowAddForm(false);
  };

  const handleAmountChange = (val) => {
    setAmount(val);
    if (quantity && val) {
      setPricePerUnit((parseFloat(val) / parseFloat(quantity)).toFixed(2));
    }
  };

  const handleQuantityChange = (val) => {
    setQuantity(val);
    if (amount && val) {
      setPricePerUnit((parseFloat(amount) / parseFloat(val)).toFixed(2));
    }
  };

  // Filter transactions based on search, type, and category filters
  const displayedTransactions = transactions.filter(tx => {
    const titleMatch = (tx.title || '').toLowerCase().includes(searchTerm.toLowerCase()) || 
                       (tx.notes || '').toLowerCase().includes(searchTerm.toLowerCase());
    const typeMatch = filterType === 'all' || tx.type === filterType;
    const catMatch = filterCategory === 'all' || tx.category === filterCategory;
    return titleMatch && typeMatch && catMatch;
  });

  const translateCategory = (cat, txType) => {
    const norm = (cat || "").toLowerCase();
    if (txType === 'income') {
      if (norm === 'dine-in') return 'ทานที่ร้าน (Dine-in)';
      if (norm === 'delivery') return 'เดลิเวอรี่ (Delivery)';
      if (norm === 'catering') return 'จัดเลี้ยง (Catering)';
      return cat;
    } else {
      if (norm === 'raw-mat') return 'จัดซื้อวัตถุดิบอาหาร 🥩';
      if (norm === 'fixed-rent') return 'ค่าเช่าร้านคงที่ 🏢';
      if (norm === 'fixed-salary') return 'ค่าจ้างพนักงาน 👥';
      if (norm === 'utilities') return 'ค่าน้ำ ไฟ แก๊สหุงต้ม ⚡';
      if (norm === 'marketing') return 'ค่าการตลาด 📢';
      if (norm === 'other-exp') return 'รายจ่ายอื่น ๆ 📦';
      return cat;
    }
  };

  return (
    <div className="transactions-tab-content">
      {/* Filters Toolbar */}
      <div className="glass-card filter-card" style={{ padding: '16px 20px', marginBottom: '20px' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '15px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '12px', flex: 1 }}>
            <div style={{ position: 'relative', minWidth: '240px', flex: 1 }}>
              <input 
                type="text" 
                placeholder="🔍 ค้นหาบันทึก หรือคำอธิบาย..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input"
                style={{ paddingLeft: '14px' }}
              />
            </div>
            
            <select 
              value={filterCategory} 
              onChange={(e) => setFilterCategory(e.target.value)}
              className="glass-select"
              style={{ width: 'auto', minWidth: '130px' }}
            >
              <option value="all">ทุกหมวดหมู่</option>
              <option value="dine-in">ทานที่ร้าน (Dine-in)</option>
              <option value="delivery">เดลิเวอรี่ (Delivery)</option>
              <option value="catering">จัดเลี้ยง (Catering)</option>
              <option value="raw-mat">วัตถุดิบและของสด</option>
              <option value="fixed-rent">ค่าเช่าร้านคงที่</option>
              <option value="fixed-salary">เงินเดือน/พนักงาน</option>
              <option value="utilities">ค่าน้ำ ไฟ แก๊ส</option>
              <option value="marketing">ค่าการตลาด</option>
              <option value="other-exp">รายจ่ายอื่น ๆ</option>
            </select>

            <select 
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
              className="glass-select"
              style={{ width: 'auto', minWidth: '150px' }}
            >
              <option value="all">ทุกประเภท (รับ/จ่าย)</option>
              <option value="income">🟢 รายรับ (ยอดขาย)</option>
              <option value="expense">🔴 รายจ่าย</option>
            </select>
          </div>

          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '✕ ปิดฟอร์มบันทึก' : '➕ บันทึกรายการใหม่'}
          </button>
        </div>
      </div>

      {/* Add Transaction Form */}
      {showAddForm && (
        <div className="glass-card form-card" style={{ marginBottom: '20px' }}>
          <div className="card-header">
            <span className="icon-main">📝</span>
            <h3>ฟอร์มบันทึกรายรับ-รายจ่ายร้านราชรส</h3>
          </div>
          <form onSubmit={handleFormSubmit} className="card-body">
            <div className="form-grid">
              <div className="form-group">
                <label>ประเภทบัญชี</label>
                <div className="radio-group">
                  <button 
                    type="button" 
                    className={`btn-radio ${type === 'income' ? 'active' : ''}`}
                    onClick={() => { setType('income'); setCategory('dine-in'); }}
                  >
                    🟢 รายรับ (Income)
                  </button>
                  <button 
                    type="button" 
                    className={`btn-radio ${type === 'expense' ? 'active' : ''}`}
                    onClick={() => { setType('expense'); setCategory('raw-mat'); }}
                  >
                    🔴 รายจ่าย (Expense)
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label>วันที่ทำรายการ</label>
                <input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)} 
                  className="glass-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>ชื่อรายการ (คำอธิบายสั้นๆ)</label>
                <input 
                  type="text" 
                  placeholder="เช่น ยอดขายหน้าร้านรอบเย็น, ซื้อเนื้อเช้าเข้าร้าน" 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)} 
                  className="glass-input" 
                  required 
                />
              </div>

              <div className="form-group">
                <label>จำนวนเงินรวม (บาท)</label>
                <input 
                  type="number" 
                  placeholder="0.00" 
                  value={amount} 
                  onChange={(e) => handleAmountChange(e.target.value)} 
                  className="glass-input" 
                  min="0"
                  step="any"
                  required 
                />
              </div>

              <div className="form-group">
                <label>หมวดหมู่หลัก</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value)}
                  className="glass-select"
                >
                  {type === 'income' ? (
                    <>
                      <option value="dine-in">ทานที่ร้าน (Dine-in)</option>
                      <option value="delivery">เดลิเวอรี่ (Delivery)</option>
                      <option value="catering">จัดเลี้ยงนอกสถานที่ (Catering)</option>
                    </>
                  ) : (
                    <>
                      <option value="raw-mat">จัดซื้อวัตถุดิบอาหาร/ของสด</option>
                      <option value="fixed-rent">ค่าเช่าร้านคงที่</option>
                      <option value="fixed-salary">เงินเดือน/ค่าจ้างพนักงาน</option>
                      <option value="utilities">ค่าน้ำ ไฟ แก๊สหุงต้ม</option>
                      <option value="marketing">ค่าโฆษณาและการตลาด</option>
                      <option value="other-exp">รายจ่ายอื่นๆ</option>
                    </>
                  )}
                </select>
              </div>

              {type === 'expense' && (
                <>
                  <div className="form-group">
                    <label>ชนิดวัตถุดิบ (อัปเดตสต็อกคลังสินค้า)</label>
                    <select 
                      value={itemName} 
                      onChange={(e) => setItemName(e.target.value)}
                      className="glass-select"
                    >
                      <option value="">-- ไม่จัดเก็บสต็อก (รายจ่ายทั่วไป) --</option>
                      <option value="เนื้อเช้า">เนื้อเช้า</option>
                      <option value="เนื้อบุฟ หมูบุฟ">เนื้อบุฟ หมูบุฟ</option>
                      <option value="เนื้อบด">เนื้อบด</option>
                      <option value="หมู ลูกชิ้น">หมู ลูกชิ้น</option>
                      <option value="หม่าล่า">หม่าล่า</option>
                      <option value="เอส">เอส (Est Cola)</option>
                      <option value="เบียร์ เหล้า">เบียร์ เหล้า</option>
                      <option value="ผัก">ผัก</option>
                      <option value="แมคโคร">แมคโคร</option>
                      <option value="ค่าแก๊ส">ค่าแก๊ส</option>
                      <option value="ค่าน้ำ ค่าไฟ">ค่าน้ำ ค่าไฟ</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>ปริมาณ/จำนวน</label>
                    <input 
                      type="number" 
                      placeholder="เช่น 10" 
                      value={quantity} 
                      onChange={(e) => handleQuantityChange(e.target.value)} 
                      className="glass-input" 
                      min="0"
                      step="any"
                      disabled={!itemName}
                    />
                  </div>

                  <div className="form-group">
                    <label>หน่วยนับ</label>
                    <input 
                      type="text" 
                      placeholder="กก. / แพ็ค / ลัง / ถัง" 
                      value={unit} 
                      onChange={(e) => setUnit(e.target.value)} 
                      className="glass-input" 
                      disabled={!itemName}
                    />
                  </div>

                  <div className="form-group">
                    <label>ราคาทุนต่อหน่วย (บาท)</label>
                    <input 
                      type="number" 
                      placeholder="0.00" 
                      value={pricePerUnit} 
                      onChange={(e) => setPricePerUnit(e.target.value)} 
                      className="glass-input" 
                      min="0"
                      step="any"
                      disabled={!itemName}
                    />
                  </div>
                </>
              )}

              <div className="form-group full-width">
                <label>หมายเหตุ</label>
                <textarea 
                  placeholder="ข้อมูลการทำรายการเพิ่มเติม..." 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  className="glass-input text-area"
                />
              </div>
            </div>
            
            <div className="form-actions">
              <button 
                type="button" 
                onClick={() => setShowAddForm(false)} 
                className="btn btn-secondary"
              >
                ยกเลิก
              </button>
              <button type="submit" className="btn btn-primary">
                บันทึกรายการบัญชี
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table */}
      <div className="glass-card tx-list-card">
        <div className="card-header">
          <span className="icon-main">📋</span>
          <h3>ประวัติรายการบัญชี (Transactions Log)</h3>
        </div>
        <div className="card-body">
          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>วันที่</th>
                  <th>รายการ</th>
                  <th>ประเภท</th>
                  <th>หมวดหมู่</th>
                  <th style={{ textAlign: 'right' }}>ยอดเงิน</th>
                  <th>สินค้าคงคลัง</th>
                  <th>หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {displayedTransactions.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="empty-row-text">ไม่พบรายการบัญชีที่ตรงกับเงื่อนไขการค้นหา</td>
                  </tr>
                ) : (
                  displayedTransactions.map((tx, idx) => {
                    const amt = parseFloat(tx.amount) || 0;
                    const isIncome = tx.type === 'income';
                    return (
                      <tr key={tx.id || idx}>
                        <td className="font-mono">{tx.date}</td>
                        <td className="font-bold">{tx.title}</td>
                        <td>
                          <span className={`status-badge ${isIncome ? 'income' : 'expense'}`}>
                            {isIncome ? '🟢 รายรับ' : '🔴 รายจ่าย'}
                          </span>
                        </td>
                        <td>{translateCategory(tx.category, tx.type)}</td>
                        <td style={{ textAlign: 'right' }} className={`font-mono font-bold ${isIncome ? 'text-green' : 'text-red'}`}>
                          {isIncome ? '+' : '-'}฿{amt.toLocaleString(undefined, { minimumFractionDigits: 0 })}
                        </td>
                        <td>
                          {tx.itemName ? (
                            <span className="stock-tag">📦 {tx.itemName} ({tx.quantity || 1} {tx.unit || 'ชิ้น'})</span>
                          ) : (
                            <span className="empty-dash">-</span>
                          )}
                        </td>
                        <td className="notes-cell" title={tx.notes}>{tx.notes || '-'}</td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
