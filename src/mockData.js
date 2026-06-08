export const mockTransactions = [
  // 28 พฤษภาคม 2569 (Thai year BE 2569 = AD 2026)
  { id: "t-1", type: "income", title: "ยอดขายหน้าร้าน (Dine-in)", amount: 18500, date: "2026-05-28", category: "dine-in", notes: "ลูกค้ารอบเย็นแน่นร้าน", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-2", type: "income", title: "ยอดขายเดลิเวอรี่ (Grab/Lineman)", amount: 4800, date: "2026-05-28", category: "delivery", notes: "", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-3", type: "expense", title: "ซื้อเนื้อเช้าเข้าร้าน", amount: 3200, date: "2026-05-28", category: "raw-mat", notes: "", itemName: "เนื้อเช้า", quantity: 20, unit: "กก.", pricePerUnit: 160 },
  { id: "t-4", type: "expense", title: "ซื้อเนื้อบุฟเฟต์และหมูบุฟเฟต์", amount: 4500, date: "2026-05-28", category: "raw-mat", notes: "สั่งจากซัพพลายเออร์หลัก", itemName: "เนื้อบุฟ หมูบุฟ", quantity: 30, unit: "กก.", pricePerUnit: 150 },
  { id: "t-5", type: "expense", title: "จ่ายค่าแก๊สหุงต้ม 2 ถัง", amount: 920, date: "2026-05-28", category: "utilities", notes: "", itemName: "ค่าแก๊ส", quantity: 2, unit: "ถัง", pricePerUnit: 460 },
  { id: "t-6", type: "expense", title: "ซื้อผักสดจากตลาดไท", amount: 1200, date: "2026-05-28", category: "raw-mat", notes: "", itemName: "ผัก", quantity: 15, unit: "กก.", pricePerUnit: 80 },

  // 29 พฤษภาคม 2569
  { id: "t-7", type: "income", title: "ยอดขายหน้าร้าน (Dine-in)", amount: 15200, date: "2026-05-29", category: "dine-in", notes: "", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-8", type: "income", title: "ยอดขายเดลิเวอรี่", amount: 3900, date: "2026-05-29", category: "delivery", notes: "", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-9", type: "expense", title: "ซื้อเนื้อบดทำกะเพรา", amount: 1800, date: "2026-05-29", category: "raw-mat", notes: "", itemName: "เนื้อบด", quantity: 12, unit: "กก.", pricePerUnit: 150 },
  { id: "t-10", type: "expense", title: "ซื้อหมูและลูกชิ้นเสียบไม้", amount: 2400, date: "2026-05-29", category: "raw-mat", notes: "", itemName: "หมู ลูกชิ้น", quantity: 20, unit: "แพ็ค", pricePerUnit: 120 },
  { id: "t-11", type: "expense", title: "ซื้อเครื่องดื่ม เอส โคล่า", amount: 850, date: "2026-05-29", category: "raw-mat", notes: "เอสขวดแก้ว 3 ลัง", itemName: "เอส", quantity: 3, unit: "ลัง", pricePerUnit: 283.33 },
  { id: "t-12", type: "expense", title: "ซื้อของใช้ทั่วไป แมคโคร", amount: 3100, date: "2026-05-29", category: "raw-mat", notes: "เครื่องปรุงรส, ทิชชู่, น้ำยาล้างจาน", itemName: "แมคโคร", quantity: 1, unit: "รอบ", pricePerUnit: 3100 },

  // 30 พฤษภาคม 2569
  { id: "t-13", type: "income", title: "ยอดขายหน้าร้าน", amount: 22400, date: "2026-05-30", category: "dine-in", notes: "วันเสาร์ คนเยอะมาก", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-14", type: "income", title: "ยอดขายจัดเลี้ยงนอกสถานที่", amount: 9500, date: "2026-05-30", category: "catering", notes: "งานวันเกิดคุณสมชาย", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-15", type: "expense", title: "ซื้อผงหม่าล่าและวัตถุดิบปิ้งย่าง", amount: 1500, date: "2026-05-30", category: "raw-mat", notes: "", itemName: "หม่าล่า", quantity: 5, unit: "กก.", pricePerUnit: 300 },
  { id: "t-16", type: "expense", title: "เบียร์ และ เหล้าเข้าร้าน", amount: 4800, date: "2026-05-30", category: "raw-mat", notes: "เติมบาร์เบียร์เสาร์-อาทิตย์", itemName: "เบียร์ เหล้า", quantity: 4, unit: "ลัง", pricePerUnit: 1200 },
  { id: "t-17", type: "expense", title: "ค่าน้ำ-ค่าไฟของร้าน", amount: 4500, date: "2026-05-30", category: "utilities", notes: "", itemName: "ค่าน้ำ ค่าไฟ", quantity: 1, unit: "เดือน", pricePerUnit: 4500 },

  // 31 พฤษภาคม 2569
  { id: "t-18", type: "income", title: "ยอดขายหน้าร้าน", amount: 24100, date: "2026-05-31", category: "dine-in", notes: "", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-19", type: "income", title: "ยอดขายเดลิเวอรี่", amount: 5600, date: "2026-05-31", category: "delivery", notes: "", itemName: "", quantity: "", unit: "", pricePerUnit: "" },
  { id: "t-20", type: "expense", title: "ซื้อของสด ผักสดเพิ่ม", amount: 950, date: "2026-05-31", category: "raw-mat", notes: "", itemName: "ผัก", quantity: 10, unit: "กก.", pricePerUnit: 95 },
  { id: "t-21", type: "expense", title: "จ่ายค่าเช่าร้านคงที่ประจำเดือน", amount: 18000, date: "2026-05-31", category: "fixed-rent", notes: "โอนจ่ายค่าเช่ารายเดือน", itemName: "ค่าเช่า", quantity: 1, unit: "เดือน", pricePerUnit: 18000 },
  { id: "t-22", type: "expense", title: "จ่ายเงินเดือนและค่าจ้างพนักงาน", amount: 28000, date: "2026-05-31", category: "fixed-salary", notes: "โอนจ่าย 3 คน FOH/BOH", itemName: "ค่าจ้างพนักงาน", quantity: 3, unit: "คน", pricePerUnit: 9333.33 },
  { id: "t-23", type: "expense", title: "จ่ายค่าโฆษณาเพจ Facebook", amount: 2500, date: "2026-05-31", category: "marketing", notes: "ยิงแอดโปรโมชั่นบุฟเฟต์", itemName: "ค่าการตลาด", quantity: 1, unit: "แคมเปญ", pricePerUnit: 2500 }
];

export const mockInventory = [
  { id: "inv-1", name: "เนื้อเช้า", category: "raw-mat", quantity: 45, unit: "กก.", costPerUnit: 160 },
  { id: "inv-2", name: "เนื้อบุฟ หมูบุฟ", category: "raw-mat", quantity: 82, unit: "กก.", costPerUnit: 150 },
  { id: "inv-3", name: "เนื้อบด", category: "raw-mat", quantity: 18, unit: "กก.", costPerUnit: 150 },
  { id: "inv-4", name: "หมู ลูกชิ้น", category: "raw-mat", quantity: 35, unit: "แพ็ค", costPerUnit: 120 },
  { id: "inv-5", name: "หม่าล่า", category: "raw-mat", quantity: 12, unit: "กก.", costPerUnit: 300 },
  { id: "inv-6", name: "เอส", category: "raw-mat", quantity: 15, unit: "ลัง", costPerUnit: 280 },
  { id: "inv-7", name: "เบียร์ เหล้า", category: "raw-mat", quantity: 8, unit: "ลัง", costPerUnit: 1200 },
  { id: "inv-8", name: "ผัก", category: "raw-mat", quantity: 25, unit: "กก.", costPerUnit: 80 }
];

export const mockBudgets = {
  "raw-mat": 80000,
  "fixed-rent": 18000,
  "fixed-salary": 30000,
  "utilities": 10000,
  "marketing": 5000,
  "other-exp": 5000
};
