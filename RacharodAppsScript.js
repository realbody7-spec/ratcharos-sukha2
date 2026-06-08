// =========================================================================
// Google Apps Script สำหรับระบบบัญชีและคลังวัตถุดิบร้านราชรส (Racharod Apps Script)
// =========================================================================
// ลิงก์สำหรับการใช้งานร่วมกับ Google Sheets
// คัดลอกโค้ดทั้งหมดนี้ไปวางใน Extensions -> Apps Script ใน Google Sheets ของคุณ
// =========================================================================

// ==========================================
// ⚙️ การตั้งค่าระบบ (CONFIGURATION)
// ==========================================
const SPREADSHEET_ID = "1506WYegONYah2NvM6EG_ZFlvyyPHQl4nx7aXXEVaZms"; // ID ของ Google Sheets
const LINE_ACCESS_TOKEN = "YOUR_LINE_ACCESS_TOKEN"; // ใส่ Access Token ของ LINE Bot ที่นี่ (ถ้ามี)

// หมวดหมู่งบประมาณหลัก (ใช้สำหรับเปรียบเทียบในแผ่นงาน)
const BUDGETS = {
  "raw-mat": 80000,       // วัตถุดิบและของสด
  "fixed-rent": 18000,     // ค่าเช่าร้านคงที่
  "fixed-salary": 30000,   // ค่าจ้างพนักงาน
  "utilities": 10000,      // ค่าน้ำ ไฟ แก๊สหุงต้ม
  "marketing": 5000,       // ค่าโฆษณาและการตลาด
  "other-exp": 5000        // ค่าใช้จ่ายทั่วไป
};

// ==========================================
// 📥 1. ระบบ API สำหรับแดชบอร์ด Frontend (React)
// ==========================================

// ฟังก์ชันดึงข้อมูลทั้งหมดไปแสดงบนหน้าเว็บแดชบอร์ด (HTTP GET)
function doGet(e) {
  try {
    const action = e.parameter.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (action === "getData") {
      const transactions = getTransactionsData(ss);
      const inventory = getInventoryData(ss);
      
      const payload = {
        transactions: transactions,
        inventory: inventory,
        budgets: BUDGETS
      };
      
      return ContentService.createTextOutput(JSON.stringify(payload))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "ไม่พบ Action ที่ระบุ" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

// ฟังก์ชันรับการบันทึกรายการบัญชีใหม่จากแดชบอร์ด (HTTP POST)
function doPost(e) {
  try {
    const postData = JSON.parse(e.postData.contents);
    const action = postData.action;
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    
    if (action === "saveTransaction") {
      const newTx = {
        type: postData.type,
        title: postData.title,
        amount: parseFloat(postData.amount) || 0,
        date: postData.date || new Date().toISOString().split('T')[0],
        category: postData.category,
        notes: postData.notes || "",
        itemName: postData.itemName || "",
        quantity: parseFloat(postData.quantity) || "",
        unit: postData.unit || "",
        pricePerUnit: parseFloat(postData.pricePerUnit) || ""
      };
      
      // บันทึกธุรกรรมลงชีต
      saveToSheet(ss, newTx);
      
      // อัปเดตคลังสินค้าหากเป็นรายจ่ายวัตถุดิบ
      if (newTx.type === "expense" && newTx.itemName) {
        updateInventoryStock(ss, newTx.itemName, newTx.quantity, newTx.amount, newTx.category, newTx.unit);
      }
      
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON)
        .setHeader("Access-Control-Allow-Origin", "*");
    }
    
    // หากเป็นการเรียกใช้ Webhook จาก LINE Bot
    if (postData.events && postData.events.length > 0) {
      handleLineWebhook(postData);
      return ContentService.createTextOutput(JSON.stringify({ status: "ok" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({ error: "ไม่พบ Action หรือ Event ที่ถูกต้อง" }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
      
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON)
      .setHeader("Access-Control-Allow-Origin", "*");
  }
}

// ==========================================
// 🤖 2. ระบบดักจับและแยกแยะข้อความบิล LINE Bot
// ==========================================

// ฟังก์ชันวิเคราะห์คำภาษาไทยในบิลเพื่อจัดกลุ่ม 14 แคทกอรี่ย่อยหลัก
function parseTextTransaction(text) {
  const normText = text.replace(/\s+/g, "").toLowerCase();
  
  let result = {
    type: "expense", // ค่าเริ่มต้นเป็นรายจ่าย
    category: "other-exp",
    itemName: "",
    amount: 0,
    quantity: 1,
    unit: "ชิ้น",
    title: text
  };

  // 1. ตรวจสอบประเภท รายรับ / รายจ่าย
  if (normText.includes("ขาย") || normText.includes("รับเงิน") || normText.includes("รายรับ") || normText.includes("ยอดขาย")) {
    result.type = "income";
    result.category = "dine-in"; // ทานที่ร้านเป็นหลัก
    if (normText.includes("grab") || normText.includes("lineman") || normText.includes("เดลิ")) {
      result.category = "delivery";
    } else if (normText.includes("จัดเลี้ยง") || normText.includes("นอกสถานที่")) {
      result.category = "catering";
    }
  }

  // 2. ตรวจสอบจำนวนเงิน (ค้นหาตัวเลข)
  const amountMatch = text.match(/([\d,]+)\s*(?:บาท|บ\.|฿)?/);
  if (amountMatch) {
    result.amount = parseFloat(amountMatch[1].replace(/,/g, "")) || 0;
  }

  // 3. ตรวจสอบปริมาณและหน่วยนับ (เช่น 10 กิโล, 5 ถัง, 3 ลัง)
  const qtyMatch = text.match(/(\d+(?:\.\d+)?)\s*(กิโล|กก|แพ็ค|ถุง|ลัง|ถัง|คน|เดือน|ถุง|ขวด|กล่อง|ชิ้น)/i);
  if (qtyMatch) {
    result.quantity = parseFloat(qtyMatch[1]) || 1;
    result.unit = qtyMatch[2];
  }

  // หากเป็นรายรับ ไม่จำเป็นต้องประมวลผลหมวดวัตถุดิบและสต็อกย่อย
  if (result.type === "income") {
    result.title = "ยอดขายหน้าร้าน/จัดส่ง";
    return result;
  }

  // 4. แยกแยะ 14 แคทกอรี่ย่อย (สำหรับรายจ่าย)
  
  // -- หมวดวัตถุดิบและของสด (raw-mat) --
  if (normText.includes("เนื้อเช้า")) {
    result.category = "raw-mat";
    result.itemName = "เนื้อเช้า";
    result.unit = result.unit === "ชิ้น" ? "กก." : result.unit;
  } 
  else if (normText.includes("เนื้อบุฟ") || normText.includes("หมูบุฟ")) {
    result.category = "raw-mat";
    result.itemName = "เนื้อบุฟ หมูบุฟ";
    result.unit = result.unit === "ชิ้น" ? "กก." : result.unit;
  } 
  else if (normText.includes("เนื้อบด")) {
    result.category = "raw-mat";
    result.itemName = "เนื้อบด";
    result.unit = result.unit === "ชิ้น" ? "กก." : result.unit;
  } 
  else if (normText.includes("หมูลูกชิ้น") || normText.includes("ลูกชิ้น") || normText.includes("เสียบไม้")) {
    result.category = "raw-mat";
    result.itemName = "หมู ลูกชิ้น";
    result.unit = result.unit === "ชิ้น" ? "แพ็ค" : result.unit;
  } 
  else if (normText.includes("หม่าล่า") || normText.includes("ผงล่า")) {
    result.category = "raw-mat";
    result.itemName = "หม่าล่า";
    result.unit = result.unit === "ชิ้น" ? "กก." : result.unit;
  } 
  else if (normText.includes("เอส") || normText.includes("โคล่า") || normText.includes("est")) {
    result.category = "raw-mat";
    result.itemName = "เอส";
    result.unit = result.unit === "ชิ้น" ? "ลัง" : result.unit;
  } 
  else if (normText.includes("เบียร์") || normText.includes("เหล้า") || normText.includes("แอล")) {
    result.category = "raw-mat";
    result.itemName = "เบียร์ เหล้า";
    result.unit = result.unit === "ชิ้น" ? "ลัง" : result.unit;
  } 
  else if (normText.includes("ผัก") || normText.includes("ผักสด") || normText.includes("ต้นหอม")) {
    result.category = "raw-mat";
    result.itemName = "ผัก";
    result.unit = result.unit === "ชิ้น" ? "กก." : result.unit;
  } 
  else if (normText.includes("แมคโคร") || normText.includes("makro")) {
    result.category = "raw-mat";
    result.itemName = "แมคโคร";
    result.unit = result.unit === "ชิ้น" ? "รอบ" : result.unit;
  }
  
  // -- หมวดค่าเช่าร้านคงที่ (fixed-rent) --
  else if (normText.includes("ค่าเช่า") || normText.includes("เช่าร้าน") || normText.includes("ค่าเช่าร้าน")) {
    result.category = "fixed-rent";
    result.itemName = "ค่าเช่า";
    result.unit = "เดือน";
  }
  
  // -- หมวดค่าจ้างและพนักงาน (fixed-salary) --
  else if (normText.includes("ค่าจ้าง") || normText.includes("เงินเดือน") || normText.includes("พนักงาน") || normText.includes("ค่าแรง") || normText.includes("เงินวิก")) {
    result.category = "fixed-salary";
    result.itemName = "ค่าจ้างพนักงาน";
    result.unit = result.unit === "ชิ้น" ? "คน" : result.unit;
  }
  
  // -- หมวดโฆษณาและการตลาด (marketing) --
  else if (normText.includes("การตลาด") || normText.includes("โฆษณา") || normText.includes("ยิงแอด") || normText.includes("ค่าแอด") || normText.includes("fb")) {
    result.category = "marketing";
    result.itemName = "ค่าการตลาด";
    result.unit = "แคมเปญ";
  }
  
  // -- หมวดแก๊สหุงต้ม (utilities) --
  else if (normText.includes("ค่าแก๊ส") || normText.includes("แก๊ส") || normText.includes("แก๊สถัง")) {
    result.category = "utilities";
    result.itemName = "ค่าแก๊ส";
    result.unit = result.unit === "ชิ้น" ? "ถัง" : result.unit;
  }
  
  // -- หมวดค่าน้ำ ค่าไฟ และสาธารณูปโภคอื่น ๆ (utilities) --
  else if (normText.includes("ค่าน้ำ") || normText.includes("ค่าไฟ") || normText.includes("เน็ต") || normText.includes("ค่าเน็ต") || normText.includes("ไฟฟ้า") || normText.includes("ประปา")) {
    result.category = "utilities";
    result.itemName = "ค่าน้ำ ค่าไฟ อื่นๆ";
    result.unit = "เดือน";
  }
  
  // รายจ่ายอื่น ๆ ทั่วไป
  else {
    result.category = "other-exp";
    result.itemName = "";
    result.unit = "รายการ";
  }

  // ปรับแต่งข้อความหัวเรื่องให้ดูสวยงาม
  result.title = result.itemName ? "บันทึก: " + result.itemName : text;
  
  return result;
}

// ฟังก์ชันประมวลผล Webhook จาก LINE Bot
function handleLineWebhook(postData) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const event = postData.events[0];
  const replyToken = event.replyToken;
  const userMessage = event.message.text;
  
  // วิเคราะห์แยกประเภทข้อมูลจากข้อความของลูกค้า
  const tx = parseTextTransaction(userMessage);
  
  // บันทึกธุรกรรมลงในชีตฐานข้อมูล
  saveToSheet(ss, tx);
  
  // อัปเดตคลังสต็อกวัตถุดิบ หากเป็นของสดประเภทค่าวัตถุดิบ (raw-mat)
  if (tx.type === "expense" && tx.itemName) {
    updateInventoryStock(ss, tx.itemName, tx.quantity, tx.amount, tx.category, tx.unit);
  }
  
  // ข้อความตอบกลับไปยัง LINE เพื่อคอนเฟิร์มข้อมูลการบันทึก
  let replyText = "";
  if (tx.type === "income") {
    replyText = `🟢 บันทึกรายรับร้านราชรสสำเร็จ!\n` +
                `👉 ยอดขาย: ฿${tx.amount.toLocaleString()}\n` +
                `📂 ประเภท: ${tx.category === "delivery" ? "เดลิเวอรี่" : tx.category === "catering" ? "จัดเลี้ยง" : "ทานที่ร้าน"}\n` +
                `📅 วันที่: ${new Date().toLocaleDateString("th-TH")}`;
  } else {
    replyText = `🔴 บันทึกรายจ่ายสำเร็จ!\n` +
                `👉 รายการ: ${tx.itemName || "รายจ่ายทั่วไป"}\n` +
                `💵 จำนวนเงิน: ฿${tx.amount.toLocaleString()}\n` +
                `📂 หมวดหมู่หลัก: ${tx.category === "raw-mat" ? "วัตถุดิบอาหาร" : tx.category === "fixed-rent" ? "ค่าเช่าร้าน" : tx.category === "fixed-salary" ? "ค่าแรงพนักงาน" : tx.category === "utilities" ? "น้ำ/ไฟ/แก๊ส" : tx.category === "marketing" ? "โฆษณาเพจ" : "รายจ่ายทั่วไป"}\n` +
                `${tx.itemName ? `📦 อัปเดตสต็อกคลังวัตถุดิบ: +${tx.quantity} ${tx.unit}\n` : ""}` +
                `📅 วันที่: ${new Date().toLocaleDateString("th-TH")}`;
  }
  
  sendLineReply(replyToken, replyText);
}

// ==========================================
// 💾 3. ฟังก์ชันจัดการฐานข้อมูล Google Sheets
// ==========================================

// ดึงรายการประวัติบัญชี (Transactions)
function getTransactionsData(ss) {
  const sheet = ss.getSheetByName("transactions") || ss.insertSheet("transactions");
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const transactions = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const tx = {};
    headers.forEach((header, index) => {
      let val = row[index];
      // แปลงชนิดข้อมูลวันที่
      if (header === "date" && val instanceof Date) {
        val = Utilities.formatDate(val, Session.getScriptTimeZone(), "yyyy-MM-dd");
      }
      tx[header] = val;
    });
    transactions.push(tx);
  }
  return transactions;
}

// ดึงรายการในสต็อกวัตถุดิบ (Inventory)
function getInventoryData(ss) {
  const sheet = ss.getSheetByName("inventory") || ss.insertSheet("inventory");
  const data = sheet.getDataRange().getValues();
  
  // หากเป็นชีตเปล่า ให้เขียนหัวเรื่องและวัตถุดิบเริ่มต้น
  if (data.length <= 1) {
    const defaultHeaders = ["id", "name", "category", "quantity", "unit", "costPerUnit"];
    sheet.appendRow(defaultHeaders);
    
    const initialItems = [
      ["inv-1", "เนื้อเช้า", "raw-mat", 0, "กก.", 160],
      ["inv-2", "เนื้อบุฟ หมูบุฟ", "raw-mat", 0, "กก.", 150],
      ["inv-3", "เนื้อบด", "raw-mat", 0, "กก.", 150],
      ["inv-4", "หมู ลูกชิ้น", "raw-mat", 0, "แพ็ค", 120],
      ["inv-5", "หม่าล่า", "raw-mat", 0, "กก.", 300],
      ["inv-6", "เอส", "raw-mat", 0, "ลัง", 280],
      ["inv-7", "เบียร์ เหล้า", "raw-mat", 0, "ลัง", 1200],
      ["inv-8", "ผัก", "raw-mat", 0, "กก.", 80]
    ];
    initialItems.forEach(row => sheet.appendRow(row));
    return getInventoryData(ss); // โหลดซ้ำ
  }
  
  const headers = data[0];
  const items = [];
  
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    items.push(item);
  }
  return items;
}

// บันทึกธุรกรรมลงชีตประวัติ (transactions)
function saveToSheet(ss, tx) {
  const sheet = ss.getSheetByName("transactions") || ss.insertSheet("transactions");
  const data = sheet.getDataRange().getValues();
  
  if (data.length === 0) {
    sheet.appendRow(["id", "type", "title", "amount", "date", "category", "notes", "itemName", "quantity", "unit", "pricePerUnit"]);
  }
  
  const id = tx.id || "t-" + Date.now();
  const pricePerUnit = tx.quantity && tx.amount ? tx.amount / tx.quantity : "";
  
  sheet.appendRow([
    id,
    tx.type,
    tx.title,
    tx.amount,
    tx.date || new Date(),
    tx.category,
    tx.notes,
    tx.itemName,
    tx.quantity,
    tx.unit,
    pricePerUnit
  ]);
}

// อัปเดตสต็อกสินค้าและราคาทุนเฉลี่ยในแผ่นงาน (inventory)
function updateInventoryStock(ss, itemName, quantity, amount, category, unit) {
  const sheet = ss.getSheetByName("inventory") || ss.insertSheet("inventory");
  const data = sheet.getDataRange().getValues();
  
  const headers = data[0];
  const nameIndex = headers.indexOf("name");
  const qtyIndex = headers.indexOf("quantity");
  const costIndex = headers.indexOf("costPerUnit");
  const unitIndex = headers.indexOf("unit");
  const catIndex = headers.indexOf("category");
  
  let itemRowIndex = -1;
  
  // ค้นหาสินค้าว่ามีอยู่ในระบบคลังเดิมหรือไม่
  for (let i = 1; i < data.length; i++) {
    if (data[i][nameIndex].toString().trim() === itemName.toString().trim()) {
      itemRowIndex = i + 1; // ออฟเซ็ตสำหรับชีตจริงแถวเริ่มต้นที่ 1
      break;
    }
  }
  
  const addQty = parseFloat(quantity) || 1;
  const addAmount = parseFloat(amount) || 0;
  const newCostPerUnit = addQty > 0 ? addAmount / addQty : 0;
  
  if (itemRowIndex !== -1) {
    // 1. มีสินค้าอยู่แล้ว ให้ทำการสะสมจำนวนเดิมและราคาเฉลี่ยใหม่
    const currentQty = parseFloat(sheet.getRange(itemRowIndex, qtyIndex + 1).getValue()) || 0;
    const currentCost = parseFloat(sheet.getRange(itemRowIndex, costIndex + 1).getValue()) || 0;
    
    const nextQty = currentQty + addQty;
    let nextCost = currentCost;
    
    // คำนวณราคาทุนเฉลี่ยถ่วงน้ำหนักใหม่ (ถ้าทุนมีค่าจริง)
    if (newCostPerUnit > 0) {
      nextCost = ((currentQty * currentCost) + addAmount) / (currentQty + addQty);
    }
    
    sheet.getRange(itemRowIndex, qtyIndex + 1).setValue(nextQty);
    sheet.getRange(itemRowIndex, costIndex + 1).setValue(nextCost);
  } else {
    // 2. ถ้าเป็นสินค้าใหม่ ให้ทำการเพิ่มแถวรายการเข้าไปในสต็อก
    const newId = "inv-" + Date.now();
    sheet.appendRow([
      newId,
      itemName,
      category || "raw-mat",
      addQty,
      unit || "ชิ้น",
      newCostPerUnit
    ]);
  }
}

// ส่งข้อความตอบกลับหาผู้ใช้งานผ่าน LINE Messaging API
function sendLineReply(replyToken, text) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const payload = {
    replyToken: replyToken,
    messages: [{ type: "text", text: text }]
  };
  
  const options = {
    method: "post",
    contentType: "application/json",
    headers: { Authorization: "Bearer " + LINE_ACCESS_TOKEN },
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };
  
  try {
    UrlFetchApp.fetch(url, options);
  } catch (err) {
    Logger.log("ไม่สามารถส่ง LINE reply ได้: " + err.toString());
  }
}
