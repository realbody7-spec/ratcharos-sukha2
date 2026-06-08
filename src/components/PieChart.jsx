import React, { useState } from 'react';

// Helper to classify category (re-declared/exported to match App.jsx filter logic)
export function getTransactionCategory(tx) {
  if (tx.type !== 'expense') return null;
  const title = (tx.title || "").toLowerCase();
  const itemName = (tx.itemName || "").trim();
  const cat = (tx.category || "").toLowerCase();

  // 1. Direct itemName match
  if (itemName) {
    if (itemName.includes("เนื้อเช้า")) return "เนื้อเช้า";
    if (itemName.includes("เนื้อบุฟ") || itemName.includes("หมูบุฟ")) return "เนื้อบุฟ หมูบุฟ";
    if (itemName.includes("เนื้อบด")) return "เนื้อบด";
    if (itemName.includes("หมู ลูกชิ้น") || itemName.includes("ลูกชิ้น")) return "หมู ลูกชิ้น";
    if (itemName.includes("หม่าล่า")) return "หม่าล่า";
    if (itemName.includes("เอส")) return "เอส";
    if (itemName.includes("เบียร์") || itemName.includes("เหล้า")) return "เบียร์ เหล้า";
    if (itemName.includes("ผัก")) return "ผัก";
    if (itemName.includes("แมคโคร")) return "แมคโคร";
    if (itemName.includes("ค่าเช่า") || itemName.includes("เช่า")) return "ค่าเช่า";
    if (itemName.includes("ค่าจ้าง") || itemName.includes("พนักงาน") || itemName.includes("เงินเดือน")) return "ค่าจ้างพนักงาน";
    if (itemName.includes("การตลาด") || itemName.includes("โฆษณา")) return "ค่าการตลาด";
    if (itemName.includes("แก๊ส")) return "ค่าแก๊ส";
    if (itemName.includes("น้ำ") || itemName.includes("ไฟ")) return "ค่าน้ำ ค่าไฟ อื่นๆ";
  }

  // 2. Keyword check
  if (title.includes("เนื้อเช้า")) return "เนื้อเช้า";
  if (title.includes("เนื้อบุฟ") || title.includes("หมูบุฟ")) return "เนื้อบุฟ หมูบุฟ";
  if (title.includes("เนื้อบด")) return "เนื้อบด";
  if (title.includes("หมู ลูกชิ้น") || title.includes("ลูกชิ้น")) return "หมู ลูกชิ้น";
  if (title.includes("หม่าล่า")) return "หม่าล่า";
  if (title.includes("เอส")) return "เอส";
  if (title.includes("เบียร์") || title.includes("เหล้า")) return "เบียร์ เหล้า";
  if (title.includes("ผัก")) return "ผัก";
  if (title.includes("แมคโคร") || title.includes("makro")) return "แมคโคร";
  if (cat === "fixed-rent" || title.includes("เช่า") || title.includes("ค่าเช่า")) return "ค่าเช่า";
  if (cat === "fixed-salary" || title.includes("เงินเดือน") || title.includes("ค่าจ้าง") || title.includes("พนักงาน")) return "ค่าจ้างพนักงาน";
  if (cat === "marketing" || title.includes("โฆษณา") || title.includes("การตลาด") || title.includes("แอด") || title.includes("ads")) return "ค่าการตลาด";
  if (title.includes("แก๊ส")) return "ค่าแก๊ส";
  if (cat === "utilities" || title.includes("น้ำ") || title.includes("ไฟ")) return "ค่าน้ำ ค่าไฟ อื่นๆ";
  
  return "ค่าน้ำ ค่าไฟ อื่นๆ";
}

export default function PieChart({ transactions, selectedCategory, setSelectedCategory, setActiveTab }) {
  const [hoveredSlice, setHoveredSlice] = useState(null);

  // Define the 14 target categories
  const categories = [
    { name: "เนื้อเช้า", color: "#f43f5e" },
    { name: "เนื้อบุฟ หมูบุฟ", color: "#ec4899" },
    { name: "เนื้อบด", color: "#d946ef" },
    { name: "หมู ลูกชิ้น", color: "#8b5cf6" },
    { name: "หม่าล่า", color: "#ff7b00" },
    { name: "เอส", color: "#0ea5e9" },
    { name: "เบียร์ เหล้า", color: "#a855f7" },
    { name: "ผัก", color: "#10b981" },
    { name: "แมคโคร", color: "#64748b" },
    { name: "ค่าเช่า", color: "#f59e0b" },
    { name: "ค่าจ้างพนักงาน", color: "#eab308" },
    { name: "ค่าการตลาด", color: "#3b82f6" },
    { name: "ค่าแก๊ส", color: "#06b6d4" },
    { name: "ค่าน้ำ ค่าไฟ อื่นๆ", color: "#14b8a6" }
  ];

  // Initialize data map
  const dataMap = {};
  categories.forEach(c => {
    dataMap[c.name] = 0;
  });

  let totalExpense = 0;

  // Process and map transactions
  transactions.forEach(tx => {
    if (tx.type !== 'expense') return;
    const amount = parseFloat(tx.amount) || 0;
    totalExpense += amount;
    
    const mappedCat = getTransactionCategory(tx);
    if (mappedCat && dataMap[mappedCat] !== undefined) {
      dataMap[mappedCat] += amount;
    } else {
      dataMap["ค่าน้ำ ค่าไฟ อื่นๆ"] += amount;
    }
  });

  // Build pie data items
  const pieData = categories.map(cat => ({
    name: cat.name,
    value: dataMap[cat.name] || 0,
    color: cat.color
  })).filter(d => d.value > 0); // Only show slices with values > 0

  if (totalExpense === 0 || pieData.length === 0) {
    return (
      <div className="glass-card chart-card" style={{ minHeight: '320px', display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span className="icon-main">🍕</span>
          <h3>สัดส่วนวัตถุดิบและรายจ่าย</h3>
        </div>
        <div className="empty-state" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p>ไม่มีข้อมูลรายจ่ายในช่วงเวลานี้</p>
        </div>
      </div>
    );
  }

  // Dimension scaling (Enlarged)
  const r = 85; // Increased radius from 70 to 85
  const strokeWidth = 30; // Increased thickness from 24 to 30
  const cx = 125; // Adjusted center to match canvas width (250)
  const cy = 125;
  const circumference = 2 * Math.PI * r;

  let currentOffset = 0;

  const handleSliceClick = (catName) => {
    if (selectedCategory === catName) {
      setSelectedCategory('all'); // Toggle clear
    } else {
      setSelectedCategory(catName); // Set filter
      if (setActiveTab) {
        setActiveTab('transactions'); // Go to transactions tab
      }
    }
  };

  return (
    <div className="glass-card chart-card pie-chart-card" style={{ overflow: 'visible' }}>
      <div className="card-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-main">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.003 9.003 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <h3>🍕 สัดส่วนวัตถุดิบและรายจ่ายของร้าน (คลิกที่สีเพื่อเจาะดู)</h3>
      </div>
      
      <div className="card-body pie-chart-body-layout" style={{ overflow: 'visible' }}>
        {/* Enlarged Donut SVG */}
        <div className="pie-svg-wrapper" style={{ width: '250px', height: '250px' }}>
          <svg width="250" height="250" viewBox="0 0 250 250" className="donut-svg">
            <circle 
              cx={cx} 
              cy={cy} 
              r={r} 
              fill="transparent" 
              stroke="rgba(0,0,0,0.05)" 
              strokeWidth={strokeWidth}
            />
            {pieData.map((d, index) => {
               const percentage = d.value / totalExpense;
               const strokeLength = percentage * circumference;
               const strokeOffset = -currentOffset; // Correct clockwise offset when period is exactly circumference
               currentOffset += strokeLength;
 
               const isHovered = hoveredSlice === index;
               const isSelected = selectedCategory === d.name;
               
               // Determine opacity: fade other slices if one is selected
               let sliceOpacity = 1.0;
               if (selectedCategory !== 'all') {
                 sliceOpacity = isSelected ? 1.0 : 0.25;
               }
 
               return (
                 <circle
                   key={index}
                   cx={cx}
                   cy={cy}
                   r={r}
                   fill="transparent"
                   stroke={d.color}
                   strokeWidth={isSelected ? strokeWidth + 8 : isHovered ? strokeWidth + 4 : strokeWidth}
                   strokeDasharray={`${strokeLength} ${circumference - strokeLength}`}
                   strokeDashoffset={strokeOffset}
                   transform={`rotate(-90 ${cx} ${cy})`}
                   opacity={sliceOpacity}
                   onClick={() => handleSliceClick(d.name)}
                   style={{
                     transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                     cursor: 'pointer',
                     filter: (isSelected || isHovered) ? `drop-shadow(0px 0px 6px ${d.color}88)` : 'none'
                   }}
                   onMouseEnter={() => setHoveredSlice(index)}
                   onMouseLeave={() => setHoveredSlice(null)}
                 />
               );
             })}
            
            {/* Center Info Text */}
            <foreignObject x={cx - r + 12} y={cy - r + 12} width={(r - 12) * 2} height={(r - 12) * 2}>
              <div className="donut-center-content" style={{ padding: '4px' }}>
                <span className="donut-label" style={{ color: selectedCategory !== 'all' ? 'var(--color-primary)' : 'var(--text-secondary)', fontWeight: 'bold' }}>
                  {hoveredSlice !== null 
                    ? pieData[hoveredSlice].name 
                    : selectedCategory !== 'all' 
                      ? `กรอง: ${selectedCategory}` 
                      : 'รายจ่ายรวม'}
                </span>
                <span className="donut-value" style={{ fontSize: '1.25rem', fontFamily: 'monospace', fontWeight: 700 }}>
                  ฿{(hoveredSlice !== null 
                    ? pieData[hoveredSlice].value 
                    : selectedCategory !== 'all'
                      ? pieData.find(pd => pd.name === selectedCategory)?.value || 0
                      : totalExpense
                  ).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
                <span className="donut-percent" style={{ fontSize: '0.8rem', fontWeight: 700 }}>
                  {hoveredSlice !== null 
                    ? `${((pieData[hoveredSlice].value / totalExpense) * 100).toFixed(1)}%` 
                    : selectedCategory !== 'all'
                      ? `${(((pieData.find(pd => pd.name === selectedCategory)?.value || 0) / totalExpense) * 100).toFixed(1)}%`
                      : '100%'}
                </span>
                {selectedCategory !== 'all' && (
                  <span style={{ fontSize: '0.65rem', color: '#ea580c', cursor: 'pointer', marginTop: '2px', textDecoration: 'underline' }} onClick={(e) => { e.stopPropagation(); setSelectedCategory('all'); }}>
                    ล้างตัวกรอง
                  </span>
                )}
              </div>
            </foreignObject>
          </svg>
        </div>

        {/* Legend Panel (No scrollbar, wider space) */}
        <div className="pie-legend-panel">
          {pieData.map((d, index) => {
            const pct = ((d.value / totalExpense) * 100).toFixed(1);
            const isHovered = hoveredSlice === index;
            const isSelected = selectedCategory === d.name;
            const isAnySelected = selectedCategory !== 'all';
            
            return (
              <div 
                key={index} 
                className={`pie-legend-row ${isHovered ? 'active' : ''}`}
                style={{
                  opacity: isAnySelected ? (isSelected ? 1.0 : 0.4) : 1.0,
                  backgroundColor: isSelected ? 'var(--color-primary-light)' : 'transparent',
                  border: isSelected ? '1px solid var(--color-primary)' : '1px solid transparent',
                  padding: '6px 10px',
                  borderRadius: '10px',
                  transition: 'all 0.2s'
                }}
                onClick={() => handleSliceClick(d.name)}
                onMouseEnter={() => setHoveredSlice(index)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <span className="legend-color-indicator" style={{ backgroundColor: d.color }}></span>
                <span className="legend-name" style={{ fontWeight: isSelected ? '700' : '500', color: isSelected ? 'var(--color-primary)' : 'var(--text-primary)' }}>{d.name}</span>
                <span className="legend-value" style={{ fontWeight: '700' }}>฿{d.value.toLocaleString(undefined, { maximumFractionDigits: 0 })}</span>
                <span className="legend-pct">({pct}%)</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
