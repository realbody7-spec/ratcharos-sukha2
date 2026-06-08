import React, { useState } from 'react';

export default function BarChart({ transactions }) {
  const [chartMode, setChartMode] = useState('dual'); // 'dual' (up/down) or 'stacked' (stacked positive)
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  // 1. Group transactions by date
  const dailyDataMap = {};
  transactions.forEach(tx => {
    const dateStr = tx.date;
    if (!dailyDataMap[dateStr]) {
      dailyDataMap[dateStr] = { date: dateStr, income: 0, expense: 0 };
    }
    const amt = parseFloat(tx.amount) || 0;
    if (tx.type === 'income') {
      dailyDataMap[dateStr].income += amt;
    } else {
      dailyDataMap[dateStr].expense += amt;
    }
  });

  // Convert to sorted array
  const dailyData = Object.values(dailyDataMap).sort((a, b) => new Date(a.date) - new Date(b.date));

  // If no data, display empty state
  if (dailyData.length === 0) {
    return (
      <div className="glass-card chart-card">
        <div className="card-header">
          <h3>📊 สรุปกระแสเงินสดรายวัน</h3>
        </div>
        <div className="empty-state">
          <p>ไม่มีข้อมูลการทำธุรกรรมในตัวกรองนี้</p>
        </div>
      </div>
    );
  }

  // Find max values to scale the chart
  let maxVal = 1000;
  dailyData.forEach(d => {
    if (chartMode === 'dual') {
      const val = Math.max(d.income, d.expense);
      if (val > maxVal) maxVal = val;
    } else {
      const val = d.income + d.expense;
      if (val > maxVal) maxVal = val;
    }
  });

  // Make scale nice (round to next thousand or ten thousand)
  const roundScale = (val) => {
    const digits = Math.floor(val).toString().length;
    const factor = Math.pow(10, digits - 1);
    return Math.ceil(val / factor) * factor;
  };
  const yMax = roundScale(maxVal * 1.1); // Add 10% padding

  // Formatting helper
  const formatMoney = (num) => {
    return '฿' + num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const formatDateThai = (dateStr) => {
    try {
      const date = new Date(dateStr);
      const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
      return `${date.getDate()} ${months[date.getMonth()]}`;
    } catch(e) {
      return dateStr;
    }
  };

  const chartHeight = 220;
  const paddingX = 60;
  const paddingY = 25;
  const chartWidth = 550;

  const graphWidth = chartWidth - paddingX * 2;
  const graphHeight = chartHeight - paddingY * 2;
  const colWidth = dailyData.length > 0 ? graphWidth / dailyData.length : 30;

  return (
    <div className="glass-card chart-card">
      <div className="card-header chart-header-row">
        <div className="header-left">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-main">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3>📊 แผนภูมิกระแสเงินสดรายวัน (รายรับ-รายจ่ายใน 1 แท่ง)</h3>
        </div>
        <div className="chart-mode-toggle">
          <button 
            className={`btn-toggle-tab ${chartMode === 'dual' ? 'active' : ''}`} 
            onClick={() => setChartMode('dual')}
            title="แสดงรายรับพุ่งขึ้นบน และรายจ่ายดิ่งลงล่าง"
          >
            สองทิศทาง (Cashflow)
          </button>
          <button 
            className={`btn-toggle-tab ${chartMode === 'stacked' ? 'active' : ''}`} 
            onClick={() => setChartMode('stacked')}
            title="แสดงรายรับและรายจ่ายซ้อนรวมในแท่งเดียวกัน"
          >
            ซ้อนรวมสะสม
          </button>
        </div>
      </div>
      
      <div className="card-body chart-body">
        <div className="svg-container">
          <svg 
            viewBox={`0 0 ${chartWidth} ${chartHeight}`} 
            width="100%" 
            height="100%"
            className="bar-chart-svg"
          >
            {/* Gradients */}
            <defs>
              <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.55" />
              </linearGradient>
              <linearGradient id="expenseGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.85" />
                <stop offset="100%" stopColor="#e11d48" stopOpacity="0.55" />
              </linearGradient>
            </defs>

            {/* Grid Lines & Y-Axis Labels */}
            {chartMode === 'dual' ? (
              // Dual mode: central zero line, lines above & below
              <>
                {/* Upper line */}
                <line 
                  x1={paddingX} 
                  y1={paddingY + graphHeight / 4} 
                  x2={chartWidth - paddingX} 
                  y2={paddingY + graphHeight / 4} 
                  stroke="rgba(255,255,255,0.08)" 
                  strokeDasharray="3 3"
                />
                <text x={paddingX - 10} y={paddingY + graphHeight / 4 + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                  {formatMoney(yMax / 2)}
                </text>

                {/* Central Baseline */}
                <line 
                  x1={paddingX} 
                  y1={paddingY + graphHeight / 2} 
                  x2={chartWidth - paddingX} 
                  y2={paddingY + graphHeight / 2} 
                  stroke="rgba(255,255,255,0.25)" 
                  strokeWidth="1.5"
                />
                <text x={paddingX - 10} y={paddingY + graphHeight / 2 + 4} fill="#cbd5e1" fontSize="10" textAnchor="end" fontWeight="bold">
                  ฿0
                </text>

                {/* Lower line */}
                <line 
                  x1={paddingX} 
                  y1={paddingY + (graphHeight * 3) / 4} 
                  x2={chartWidth - paddingX} 
                  y2={paddingY + (graphHeight * 3) / 4} 
                  stroke="rgba(255,255,255,0.08)" 
                  strokeDasharray="3 3"
                />
                <text x={paddingX - 10} y={paddingY + (graphHeight * 3) / 4 + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                  -{formatMoney(yMax / 2)}
                </text>
              </>
            ) : (
              // Stacked mode: zero baseline at the bottom
              <>
                {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                  const yVal = paddingY + graphHeight * (1 - ratio);
                  return (
                    <g key={idx}>
                      <line 
                        x1={paddingX} 
                        y1={yVal} 
                        x2={chartWidth - paddingX} 
                        y2={yVal} 
                        stroke={ratio === 0 ? "rgba(255,255,255,0.25)" : "rgba(255,255,255,0.08)"} 
                        strokeDasharray={ratio === 0 ? "" : "3 3"}
                      />
                      <text x={paddingX - 10} y={yVal + 4} fill="#94a3b8" fontSize="10" textAnchor="end">
                        {formatMoney(yMax * ratio)}
                      </text>
                    </g>
                  );
                })}
              </>
            )}

            {/* Bars */}
            {dailyData.map((d, index) => {
              const x = paddingX + index * colWidth + colWidth / 2;
              const barWidth = Math.max(colWidth * 0.65, 8); // 65% of column spacing

              let incHeight = 0;
              let expHeight = 0;
              let incY = 0;
              let expY = 0;

              if (chartMode === 'dual') {
                const centerVal = paddingY + graphHeight / 2;
                incHeight = (d.income / yMax) * (graphHeight / 2);
                expHeight = (d.expense / yMax) * (graphHeight / 2);
                incY = centerVal - incHeight;
                expY = centerVal;
              } else {
                incHeight = (d.income / yMax) * graphHeight;
                expHeight = (d.expense / yMax) * graphHeight;
                expY = paddingY + graphHeight - expHeight;
                incY = expY - incHeight;
              }

              return (
                <g 
                  key={index} 
                  onMouseEnter={(e) => {
                    setHoveredIndex(index);
                    const rect = e.currentTarget.getBoundingClientRect();
                    setTooltipPos({
                      x: x,
                      y: chartMode === 'dual' ? paddingY + graphHeight / 2 - 20 : incY - 10
                    });
                  }}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{ cursor: 'pointer' }}
                >
                  {/* Invisible broad hitbox for hovering on small bars */}
                  <rect 
                    x={x - colWidth / 2} 
                    y={paddingY} 
                    width={colWidth} 
                    height={graphHeight} 
                    fill="transparent"
                  />

                  {/* Income Bar (Green) */}
                  {d.income > 0 && (
                    <rect 
                      x={x - barWidth / 2} 
                      y={incY} 
                      width={barWidth} 
                      height={incHeight} 
                      fill="url(#incomeGrad)" 
                      rx="3" 
                      className="chart-bar-rect"
                    />
                  )}

                  {/* Expense Bar (Red) */}
                  {d.expense > 0 && (
                    <rect 
                      x={x - barWidth / 2} 
                      y={expY} 
                      width={barWidth} 
                      height={expHeight} 
                      fill="url(#expenseGrad)" 
                      rx="3" 
                      className="chart-bar-rect"
                    />
                  )}

                  {/* Date Label (Only show every 2nd or 3rd bar on mobile to avoid overcrowding) */}
                  {(dailyData.length < 8 || index % Math.ceil(dailyData.length / 7) === 0) && (
                    <text 
                      x={x} 
                      y={chartHeight - paddingY / 3} 
                      fill="#94a3b8" 
                      fontSize="9" 
                      textAnchor="middle"
                    >
                      {formatDateThai(d.date)}
                    </text>
                  )}

                  {/* Highlight overlay for active column */}
                  {hoveredIndex === index && (
                    <rect 
                      x={x - barWidth / 2 - 2} 
                      y={chartMode === 'dual' ? incY - 2 : incY - 2}
                      width={barWidth + 4} 
                      height={chartMode === 'dual' ? incHeight + expHeight + 4 : incHeight + expHeight + 4} 
                      fill="none" 
                      stroke="#ffffff" 
                      strokeWidth="1" 
                      strokeOpacity="0.4"
                      rx="4"
                    />
                  )}
                </g>
              );
            })}

            {/* Hover Tooltip inside SVG */}
            {hoveredIndex !== null && dailyData[hoveredIndex] && (
              <g>
                {/* Background Box */}
                <rect 
                  x={Math.min(Math.max(tooltipPos.x - 70, paddingX), chartWidth - paddingX - 140)} 
                  y={Math.max(tooltipPos.y - 75, 5)} 
                  width="140" 
                  height="70" 
                  fill="rgba(15, 23, 42, 0.95)" 
                  stroke="rgba(255,255,255,0.15)" 
                  strokeWidth="1" 
                  rx="6" 
                  filter="drop-shadow(0 4px 6px rgba(0,0,0,0.4))"
                />
                
                {/* Text Content */}
                <text 
                  x={Math.min(Math.max(tooltipPos.x, paddingX + 70), chartWidth - paddingX - 70)} 
                  y={Math.max(tooltipPos.y - 58, 22)} 
                  fill="#ffffff" 
                  fontSize="10" 
                  fontWeight="bold" 
                  textAnchor="middle"
                >
                  📅 วันที่ {formatDateThai(dailyData[hoveredIndex].date)}
                </text>
                <text 
                  x={Math.min(Math.max(tooltipPos.x - 60, paddingX + 10), chartWidth - paddingX - 130)} 
                  y={Math.max(tooltipPos.y - 40, 40)} 
                  fill="#10b981" 
                  fontSize="10" 
                  textAnchor="start"
                >
                  🟢 รับ: {formatMoney(dailyData[hoveredIndex].income)}
                </text>
                <text 
                  x={Math.min(Math.max(tooltipPos.x - 60, paddingX + 10), chartWidth - paddingX - 130)} 
                  y={Math.max(tooltipPos.y - 25, 55)} 
                  fill="#f43f5e" 
                  fontSize="10" 
                  textAnchor="start"
                >
                  🔴 จ่าย: {formatMoney(dailyData[hoveredIndex].expense)}
                </text>
                <text 
                  x={Math.min(Math.max(tooltipPos.x - 60, paddingX + 10), chartWidth - paddingX - 130)} 
                  y={Math.max(tooltipPos.y - 10, 70)} 
                  fill="#f59e0b" 
                  fontSize="10" 
                  fontWeight="bold"
                  textAnchor="start"
                >
                  📌 สุทธิ: {formatMoney(dailyData[hoveredIndex].income - dailyData[hoveredIndex].expense)}
                </text>
              </g>
            )}
          </svg>
        </div>

        {/* Legend */}
        <div className="chart-legend">
          <div className="legend-item">
            <span className="dot green"></span>
            <span>รายรับ (Income)</span>
          </div>
          <div className="legend-item">
            <span className="dot red"></span>
            <span>รายจ่าย (Expense)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
