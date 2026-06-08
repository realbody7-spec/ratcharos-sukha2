import React, { useState } from 'react';

export default function Inventory({ inventory }) {
  const [search, setSearch] = useState('');

  const filteredInventory = inventory.filter(item => 
    (item.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (item.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const getCategoryName = (cat) => {
    const norm = (cat || "").toLowerCase();
    if (norm.includes("raw-mat") || norm.includes("วัตถุดิบ")) return "วัตถุดิบ / ของสด 🥩";
    if (norm.includes("fixed-rent")) return "ค่าเช่า 🏢";
    if (norm.includes("fixed-salary") || norm.includes("พนักงาน")) return "ค่าจ้างพนักงาน 👥";
    if (norm.includes("utilities") || norm.includes("ไฟ") || norm.includes("แก๊ส")) return "สาธารณูปโภค ⚡";
    if (norm.includes("marketing") || norm.includes("การตลาด")) return "การตลาด 📢";
    return cat || "อื่นๆ 📦";
  };

  const totalAssetValue = filteredInventory.reduce((acc, curr) => {
    const qty = parseFloat(curr.quantity) || 0;
    const cost = parseFloat(curr.costPerUnit) || parseFloat(curr.cost) || 0;
    return acc + (qty * cost);
  }, 0);

  return (
    <div className="glass-card inventory-card">
      <div className="card-header inventory-header-row">
        <div className="header-left">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-main">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
          </svg>
          <h3>📦 สต็อกคลังสินค้าและวัตถุดิบ (Inventory)</h3>
        </div>
        <div className="total-value-tag">
          มูลค่าสินทรัพย์รวม: <span className="highlight-text">฿{totalAssetValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
        </div>
      </div>

      <div className="card-body">
        {/* Search Bar */}
        <div className="search-bar-wrapper">
          <input 
            type="text" 
            placeholder="🔍 ค้นหาชื่อวัตถุดิบ หรือหมวดหมู่..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="glass-input search-input"
          />
        </div>

        {filteredInventory.length === 0 ? (
          <div className="empty-state">
            <p>ไม่พบรายการสินค้าในคลัง</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="glass-table">
              <thead>
                <tr>
                  <th>รหัส</th>
                  <th>ชื่อวัตถุดิบ/สินค้า</th>
                  <th>หมวดหมู่</th>
                  <th style={{ textAlign: 'right' }}>จำนวนคงเหลือ</th>
                  <th>หน่วย</th>
                  <th style={{ textAlign: 'right' }}>ราคาทุนล่าสุด</th>
                  <th style={{ textAlign: 'right' }}>มูลค่ารวม</th>
                  <th>สถานะคลัง</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((item, index) => {
                  const qty = parseFloat(item.quantity) || 0;
                  const cost = parseFloat(item.costPerUnit) || parseFloat(item.cost) || 0;
                  const total = qty * cost;

                  // Define stock level threshold
                  let statusText = "ปกติ";
                  let statusClass = "stock-good";

                  if (qty <= 5) {
                    statusText = "วิกฤต (ควรซื้อด่วน)";
                    statusClass = "stock-danger";
                  } else if (qty <= 15) {
                    statusText = "ค่อนข้างต่ำ";
                    statusClass = "stock-warning";
                  }

                  return (
                    <tr key={item.id || index}>
                      <td>{item.id || `inv-${index + 1}`}</td>
                      <td className="font-bold">{item.name || item.name}</td>
                      <td>{getCategoryName(item.category)}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono font-bold">
                        {qty.toLocaleString(undefined, { maximumFractionDigits: 2 })}
                      </td>
                      <td>{item.unit || "กก."}</td>
                      <td style={{ textAlign: 'right' }} className="font-mono">
                        ฿{cost.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 2 })}
                      </td>
                      <td style={{ textAlign: 'right' }} className="font-mono font-bold text-blue">
                        ฿{total.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </td>
                      <td>
                        <span className={`status-badge ${statusClass}`}>{statusText}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
