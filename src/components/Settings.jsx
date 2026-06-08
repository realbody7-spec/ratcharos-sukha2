import React, { useState } from 'react';

export default function Settings({ apiUrl, setApiUrl, useMock, setUseMock, onRefresh }) {
  const [tempUrl, setTempUrl] = useState(apiUrl);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleSave = () => {
    localStorage.setItem('racharod_api_url', tempUrl);
    setApiUrl(tempUrl);
    setTestResult({ status: 'success', message: 'บันทึกการตั้งค่าเรียบร้อยแล้ว!' });
    setTimeout(() => setTestResult(null), 3000);
    onRefresh();
  };

  const handleTestConnection = async () => {
    if (!tempUrl) {
      setTestResult({ status: 'error', message: 'กรุณากรอก API Web App URL ก่อนกดทดสอบ' });
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch(`${tempUrl}?action=getData`);
      const data = await response.json();
      if (data && (data.transactions || data.inventory)) {
        setTestResult({ status: 'success', message: 'เชื่อมต่อกับ Google Sheets สำเร็จ! ดึงข้อมูลได้เรียบร้อย' });
      } else if (data.error) {
        setTestResult({ status: 'error', message: `เซิร์ฟเวอร์ตอบกลับแต่เกิดข้อผิดพลาด: ${data.error}` });
      } else {
        setTestResult({ status: 'error', message: 'ไม่พบโครงสร้างข้อมูลที่ถูกต้อง (Transactions/Inventory)' });
      }
    } catch (err) {
      setTestResult({ status: 'error', message: `ไม่สามารถเชื่อมต่อได้: ${err.message}. โปรดตรวจเช็ค URL หรือตั้งค่า CORS ใน Apps Script` });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="glass-card settings-card">
      <div className="card-header">
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="icon-main">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <h3>การตั้งค่าเชื่อมต่อ Google Sheets API</h3>
      </div>
      <div className="card-body">
        <div className="form-group toggle-group" style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => setUseMock(!useMock)}>
          <div className="toggle-label">
            <span className="label-text">โหมดข้อมูลตัวอย่างจำลอง (Simulation Mode)</span>
            <span className="label-subtext">จำลองข้อมูลของร้านสำหรับการทดลองฟีเจอร์โดยไม่ต้องเชื่อมต่อฐานข้อมูลจริง</span>
          </div>
          <div className="switch-wrapper">
            <input
              type="checkbox"
              id="mock-toggle"
              checked={useMock}
              readOnly
              className="switch-input"
            />
            <span className="switch-slider"></span>
          </div>
        </div>

        <hr className="divider" />

        <div className="form-group" style={{ opacity: useMock ? 0.6 : 1, pointerEvents: useMock ? 'none' : 'auto' }}>
          <label htmlFor="api-url" className="input-label">Google Apps Script Web App URL</label>
          <div className="input-with-button">
            <input
              type="text"
              id="api-url"
              value={tempUrl}
              onChange={(e) => setTempUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/.../exec"
              className="glass-input"
              disabled={useMock}
            />
          </div>
          <span className="input-hint">
            * นำ URL ที่ได้จากการ Deployment เป็น Web App บน Google Apps Script มากรอกที่นี่
          </span>
        </div>

        {testResult && (
          <div className={`alert-box ${testResult.status}`}>
            {testResult.status === 'success' ? '✅' : '❌'} {testResult.message}
          </div>
        )}

        <div className="action-buttons">
          <button 
            type="button" 
            onClick={handleTestConnection} 
            className="btn btn-secondary"
            disabled={useMock || testing}
          >
            {testing ? 'กำลังทดสอบ...' : '🔌 ทดสอบการเชื่อมต่อ'}
          </button>
          <button 
            type="button" 
            onClick={handleSave} 
            className="btn btn-primary"
            disabled={useMock}
          >
            💾 บันทึกและดึงข้อมูลจริง
          </button>
        </div>
      </div>
    </div>
  );
}
