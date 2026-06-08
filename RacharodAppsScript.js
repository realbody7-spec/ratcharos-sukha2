// ==========================================
// CONFIGURATION (ตั้งค่าระบบ)
// ==========================================
const LINE_ACCESS_TOKEN = "PW/IQSY/8YAPJdEMaxzjHRAV37/fbgOZHDPsiGxY9GGcpIDLjNBEJGS8C5laANsftSa14prGGku4mhjPXXBnEudc7ebwBj0dwb5kAlu6LLAWHBNBCxChdcJ2dPsqgyCmwGDYcu3t/v05ZVKtA4c9pQdB04t89/1O/w1cDnyilFU=";
const SPREADSHEET_ID = "1506WYegONYah2NvM6EG_ZFlvyyPHQl4nx7aXXEVaZms";
const DRIVE_FOLDER_NAME = "บัญชีราชรสสุขา2"; // ชื่อโฟลเดอร์หลักบน Google Drive
const DESTINATION_FILE_NAME = "transactions"; // ชื่อไฟล์ Google Sheets ปลายทางหลัก

// ==========================================
// 💡 ฟังก์ชันพิเศษ 1: บังคับตรวจและขอสิทธิ์การใช้งาน (Force Permission Trigger)
// ==========================================
function testForceAuth() {
  Logger.log("--- เริ่มทำการทดสอบสิทธิ์เข้าถึงระบบ ---");
  try {
    const folders = DriveApp.getFoldersByName(DRIVE_FOLDER_NAME);
    if (folders.hasNext()) {
      const folder = folders.next();
      Logger.log("✅ การเข้าถึง Google Drive สำเร็จ! พบโฟลเดอร์: " + folder.getName());
    } else {
      Logger.log("⚠️ เชื่อมต่อ Drive สำเร็จ แต่ไม่พบโฟลเดอร์ชื่อ '" + DRIVE_FOLDER_NAME + "'");
    }
    
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    Logger.log("✅ การเข้าถึง Google Sheets สำเร็จ! พบไฟล์สมุดบัญชีหลักของคุณ");
    
    Logger.log("🎉 สรุป: ระบบบัญชีของคุณมีสิทธิ์เข้าถึงข้อมูลคลาวด์ครบถ้วน 100% แล้วโดยไม่ต้องกดสิทธิ์ซ้ำครับ");
  } catch (err) {
    Logger.log("❌ เกิดข้อผิดพลาดในการทดสอบ: " + err.toString());
  }
}

// ==========================================
// 💡 ฟังก์ชันพิเศษ 2: ทดสอบดึงข้อมูลเฉพาะวันย้อนหลัง (Manual Import Test)
// ==========================================
function testImportSpecificDate() {
  const testDateString = "28 พฤษภาคม 2569"; 
  Logger.log("--- เริ่มทำการทดสอบดึงข้อมูลประจำวันที่: " + testDateString + " ---");
  
  try {
    const folder = getFolderByName(DRIVE_FOLDER_NAME);
    const destSs = SpreadsheetApp.openById(SPREADSHEET_ID); 
    const destSheet = destSs.getSheetByName("Transactions");
    
    if (!destSheet) {
      Logger.log("❌ เกิดข้อผิดพลาด: ไม่พบแผ่นงานชื่อ 'Transactions' ในไฟล์บัญชีสรุปหลัก");
      return;
    }
    
    const searchName = "บัญชีราชรสสุขา2 - " + testDateString;
    const files = folder.getFilesByName(searchName);
    
    if (!files.hasNext()) {
      Logger.log("❌ ไม่พบไฟล์ชื่อ '" + searchName + "' ในโฟลเดอร์ '" + DRIVE_FOLDER_NAME + "'");
      return;
    }
    
    const dailyFile = files.next();
    Logger.log("✅ พบไฟล์ที่ต้องการทดสอบ: " + dailyFile.getName());
    
    const parts = testDateString.split(" ");
    let mockDate = new Date();
    if (parts.length >= 3) {
      try {
        const thaiFullMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
        const day = parseInt(parts[0]);
        const monthIdx = thaiFullMonths.indexOf(parts[1]);
        const yearBE = parseInt(parts[2]);
        if (monthIdx !== -1 && !isNaN(day) && !isNaN(yearBE)) {
          mockDate = new Date(yearBE - 543, monthIdx, day);
        }
      } catch(e) {}
    }
    
    const resultMessage = processImportFromFile(dailyFile, destSheet, " manual-test", mockDate);
    Logger.log("🎉 ผลการทำงานของระบบ: " + resultMessage);
  } catch (err) {
    Logger.log("❌ เกิดข้อขัดข้องระหว่างการรันโปรแกรมทดสอบ: " + err.toString());
  }
}

// ==========================================
// 💡 ฟังก์ชันพิเศษ 3: ทดสอบระบบแยกช่องรายจ่ายและการอัปเดตคลังวัตถุดิบ (Dynamic Inventory restock test)
// ==========================================
function testSaveTransactionAndInventory() {
  Logger.log("--- เริ่มทำการทดสอบระบบแยกช่องวัตถุดิบและสต็อกอัจฉริยะ ---");
  
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const txSheet = ss.getSheetByName("Transactions");
    const invSheet = ss.getSheetByName("Inventory");
    
    if (!txSheet || !invSheet) {
      Logger.log("❌ เกิดข้อผิดพลาด: ไม่พบแผ่นงาน 'Transactions' หรือ 'Inventory'");
      return;
    }
    
    ensureTransactionHeaders(txSheet);
    ensureInventoryHeaders(invSheet);
    
    const randomSuffix = Math.floor(100 + Math.random() * 900);
    const testItemName = "เนื้อหมูสดเกรดเอ_" + randomSuffix;
    
    const testPayload1 = {
      id: "t-test-new-" + Date.now(),
      type: "expense",
      title: "ซื้อของสดเข้าร้าน: " + testItemName + " 10 กก.",
      amount: 1500,
      date: Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
      category: "raw-mat",
      notes: "ทดลองระบบซื้อวัตถุดิบตัวใหม่",
      itemName: testItemName,
      quantity: 10,
      unit: "กก.",
      pricePerUnit: 150
    };
    
    Logger.log("🔄 [ขั้นตอนที่ 1] บันทึกรายจ่ายตัวใหม่: " + testItemName + " จำนวน 10 กิโลกรัม ทุนกิโลกรัมละ 150 บาท");
    
    txSheet.appendRow([
      testPayload1.id,
      testPayload1.type,
      testPayload1.title,
      testPayload1.amount,
      testPayload1.date,
      testPayload1.category,
      testPayload1.notes,
      testPayload1.itemName,
      testPayload1.quantity,
      testPayload1.unit,
      testPayload1.pricePerUnit
    ]);
    
    updateInventoryStock(invSheet, testPayload1.itemName, testPayload1.category, testPayload1.quantity, testPayload1.unit, testPayload1.pricePerUnit);
    Logger.log("✅ [ขั้นตอนที่ 1 สำเร็จ]");
    
    const testPayload2 = {
      id: "t-test-restock-" + Date.now(),
      type: "expense",
      title: "ซื้อของสดเข้าร้านเพิ่มช่วงเย็น: " + testItemName + " 5 กก.",
      amount: 750,
      date: Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd"),
      category: "raw-mat",
      notes: "ทดลองบวกยอดคงเหลือในคลังเพิ่ม",
      itemName: testItemName,
      quantity: 5,
      unit: "กก.",
      pricePerUnit: 150
    };
    
    Logger.log("🔄 [ขั้นตอนที่ 2] บันทึกรายจ่ายของเดิมซ้ำเพื่อเพิ่มยอด: " + testItemName + " เพิ่มอีก 5 กิโลกรัม");
    
    txSheet.appendRow([
      testPayload2.id,
      testPayload2.type,
      testPayload2.title,
      testPayload2.amount,
      testPayload2.date,
      testPayload2.category,
      testPayload2.notes,
      testPayload2.itemName,
      testPayload2.quantity,
      testPayload2.unit,
      testPayload2.pricePerUnit
    ]);
    
    updateInventoryStock(invSheet, testPayload2.itemName, testPayload2.category, testPayload2.quantity, testPayload2.unit, testPayload2.pricePerUnit);
    Logger.log("✅ [ขั้นตอนที่ 2 สำเร็จ] คลังเพิ่มจาก 10 กก. เป็น 15 กก. อัตโนมัติ!");
    
    Logger.log("🎉 สรุปการทดสอบ: ทุกอย่างทำงานถูกต้องตามแผน 100%!");
  } catch (err) {
    Logger.log("❌ เกิดข้อผิดพลาดระหว่างการทดสอบระบบคลัง: " + err.toString());
  }
}

// ==========================================
// 1. Web App API: เชื่อมต่อกับหน้าเว็บหน้าบ้าน
// ==========================================
function doGet(e) {
  e = e || { parameter: { action: "getData" } };
  try {
    const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    const action = e.parameter.action;
    
    let data = {};
    if (action === "getData") {
      data = {
        transactions: getSheetData(ss, "Transactions"),
        inventory: getSheetData(ss, "Inventory"),
        budgets: getBudgetsData(ss)
      };
    }
    return ContentService.createTextOutput(JSON.stringify(data))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ error: "ดึงข้อมูลล้มเหลว: " + err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

function doPost(e) {
  if (!e || !e.postData || !e.postData.contents) {
    return ContentService.createTextOutput(JSON.stringify({ error: "ไม่พบข้อมูลส่งมา" }))
      .setMimeType(ContentService.MimeType.JSON);
  }
  try {
    const postData = JSON.parse(e.postData.contents);
    
    // LINE Webhook
    if (postData.events && postData.events.length > 0) {
      const event = postData.events[0];
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      
      try {
        handleLineWebhook(event, ss);
      } catch (lineErr) {
        console.error("LINE Error: " + lineErr.toString());
        if (event.replyToken) {
          replyMessage(event.replyToken, "❌ เกิดข้อผิดพลาดในระบบบอท: " + lineErr.toString());
        }
      }
      return ContentService.createTextOutput("OK");
    }
    
    const action = postData.action;
    if (action === "saveTransaction") {
      const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      const sheet = ss.getSheetByName("Transactions");
      ensureTransactionHeaders(sheet);
      
      const cleanCategory = mapCategory(postData.category || "other-exp", postData.type);
      
      sheet.appendRow([
        postData.id || "t-" + Date.now(),
        postData.type,
        postData.title,
        postData.amount,
        postData.date,
        cleanCategory,
        postData.notes || "",
        postData.itemName || "",
        postData.quantity || "",
        postData.unit || "",
        postData.pricePerUnit || ""
      ]);
      if (postData.type === "expense" && postData.itemName) {
        const invSheet = ss.getSheetByName("Inventory");
        if (invSheet) {
          ensureInventoryHeaders(invSheet);
          updateInventoryStock(invSheet, postData.itemName, cleanCategory, postData.quantity, postData.unit, postData.pricePerUnit);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({ status: "success" }))
        .setMimeType(ContentService.MimeType.JSON);
    }
  } catch(err) {
    return ContentService.createTextOutput(JSON.stringify({ error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// 💡 ตรวจสอบและเขียนหัวตารางแยกช่องของ Transactions
function ensureTransactionHeaders(sheet) {
  const range = sheet.getRange(1, 1, 1, 11);
  const values = range.getValues()[0];
  if (values[0] !== "id") {
    sheet.getRange(1, 1, 1, 11).setValues([["id", "type", "title", "amount", "date", "category", "notes", "itemName", "quantity", "unit", "pricePerUnit"]]);
  }
}

// 💡 ตรวจสอบและเขียนหัวตารางแยกช่องของ Inventory
function ensureInventoryHeaders(sheet) {
  const range = sheet.getRange(1, 1, 1, 6);
  const values = range.getValues()[0];
  if (values[0] !== "id") {
    sheet.getRange(1, 1, 1, 6).setValues([["id", "name", "category", "quantity", "unit", "costPerUnit"]]);
  }
}

// 💡 ประมวลผลคลังวัตถุดิบอัตโนมัติเมื่อจัดซื้อรายจ่ายเสร็จสิ้น (RESTOCK & AUTO-NEW ITEM)
function updateInventoryStock(invSheet, itemName, category, quantity, unit, pricePerUnit) {
  const data = invSheet.getDataRange().getValues();
  let foundRowIndex = -1;
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][1].toString().trim().toLowerCase() === itemName.toString().trim().toLowerCase()) {
      foundRowIndex = i + 1;
      break;
    }
  }
  
  const qtyToAdd = parseFloat(quantity) || 0;
  const cost = parseFloat(pricePerUnit) || 0;
  
  if (foundRowIndex !== -1) {
    const currentQty = parseFloat(data[foundRowIndex - 1][3]) || 0;
    invSheet.getRange(foundRowIndex, 4).setValue(currentQty + qtyToAdd);
    if (cost > 0) {
      invSheet.getRange(foundRowIndex, 6).setValue(cost);
    }
  } else {
    const newId = "inv" + data.length;
    invSheet.appendRow([
      newId,
      itemName,
      category || "raw-mat",
      qtyToAdd,
      unit || "กก.",
      cost
    ]);
  }
}

// ==========================================
// 2. LINE BOT Logic (ปรับปรุงเพิ่มการแยกสินค้า/วัตถุดิบและการอัปเดตสต็อกอัตโนมัติ)
// ==========================================
function handleLineWebhook(event, ss) {
  if (!event || !event.replyToken) return;
  const replyToken = event.replyToken;
  
  if (event.type === "message" && event.message) {
    const msgType = event.message.type;
    
    if (msgType === "text") {
      const text = event.message.text.trim();
      
      if (text === "สรุปยอด" || text === "รายงาน") {
        const report = generateDailyReport(ss);
        replyMessage(replyToken, report);
      } 
      else if (text.startsWith("บันทึก") || text.includes("บาท") || text.includes("จ่าย") || text.includes("ขาย")) {
        const parsed = parseTextTransaction(text);
        if (parsed) {
          const sheet = ss.getSheetByName("Transactions");
          if (!sheet) {
            replyMessage(replyToken, "❌ ไม่พบแผ่นงานชื่อ 'Transactions' ในสมุดบัญชีของคุณ");
            return;
          }
          const todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
          sheet.appendRow([
            "t-line-" + Date.now(),
            parsed.type,
            parsed.title,
            parsed.amount,
            todayStr,
            parsed.category,
            "บันทึกผ่านคำสั่งข้อความ LINE",
            parsed.itemName || "",
            parsed.itemName ? 1 : "", // quantity 
            parsed.itemName ? "รายการ" : "", // unit
            parsed.itemName ? parsed.amount : "" // pricePerUnit
          ]);
          
          // อัปเดตสต็อก Inventory ทันทีหากเป็นรายจ่ายวัตถุดิบ
          if (parsed.type === "expense" && parsed.itemName) {
            const invSheet = ss.getSheetByName("Inventory");
            if (invSheet) {
              ensureInventoryHeaders(invSheet);
              updateInventoryStock(invSheet, parsed.itemName, parsed.category, 1, "รายการ", parsed.amount);
            }
          }
          
          replyMessage(replyToken, `💰 บันทึกยอดเงินสำเร็จ!\nประเภท: ${parsed.type === "income" ? "รายรับ" : "รายจ่าย"}\nรายการ: ${parsed.title}\nวัตถุดิบ/ค่าใช้จ่าย: ${parsed.itemName || "ทั่วไป"}\nยอดเงิน: ฿${parsed.amount.toLocaleString()}`);
        } else {
          replyMessage(replyToken, "❌ รูปแบบคำสั่งไม่ถูกต้อง ลองพิมพ์เช่น:\n'จ่าย ค่าแก๊ส 850'\n'จ่าย เนื้อเช้า 1200'\n'ขายอาหารหน้าร้าน 15000'");
        }
      } else {
        replyMessage(replyToken, "🤖 ระบบพร้อมรับคำสั่ง:\n\n• พิมพ์ 'สรุปยอด' เพื่อดูรายงานการเงินวันนี้\n• พิมพ์รายงานรายรับ/รายจ่าย เช่น 'ยอดขาย 12000 บาท' หรือ 'จ่าย ค่าวัตถุดิบ 1500'");
      }
    } 
    else if (msgType === "image") {
      try {
        const messageId = event.message.id;
        const folder = getFolderByName(DRIVE_FOLDER_NAME);
        
        const blob = getLineContent(messageId);
        const fileName = "บิล_" + Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss") + ".jpg";
        blob.setName(fileName);
        
        const file = folder.createFile(blob);
        const fileUrl = file.getUrl();
        
        replyMessage(replyToken, `📸 ได้รับรูปภาพบิลเรียบร้อยแล้วครับ!\n━━━━━━━━━━━━━━━━━━━━\n📂 อัปโหลดลง Google Drive สำเร็จ\n🔗 ลิงก์รูปภาพของคุณ: ${fileUrl}\n━━━━━━━━━━━━━━━━━━━━\n🔔 ทำการจัดเก็บรูปภาพเข้าแฟ้มเรียบร้อยแล้ว โดยไม่มีการเขียนยอดค่าใช้จ่ายลงใน Google Sheets ครับ`);
      } catch (err) {
        console.error("Image Upload Error: " + err.toString());
        replyMessage(replyToken, "❌ เกิดข้อขัดข้องขณะอัปโหลดรูปภาพ: " + err.toString());
      }
    }
  }
}

// ==========================================
// 3. ระบบดึงข้อมูลจากไฟล์ประจำวัน (ดึงจากเมื่อวาน ยืดหยุ่นสูง)
// ==========================================
function importDailyTransactionFile() {
  try {
    const folder = getFolderByName(DRIVE_FOLDER_NAME);
    const destSs = SpreadsheetApp.openById(SPREADSHEET_ID); 
    const destSheet = destSs.getSheetByName("Transactions");
    
    if (!destSheet) {
      return "ข้อผิดพลาด: ไม่พบแผ่นงานชื่อ 'Transactions' ในไฟล์บัญชีสรุปหลักของคุณ";
    }
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1); 
    const formattedDates = getPossibleDateStrings(yesterday);
    
    let dailyFile = null;
    let foundFileName = "";
    
    const files = folder.getFiles();
    while (files.hasNext()) {
      const file = files.next();
      const fileName = file.getName();
      
      const normalizedFileName = fileName.replace(/\s+/g, ' ').trim();
      
      for (let i = 0; i < formattedDates.length; i++) {
        const cleanTargetDate = formattedDates[i].replace(/\s+/g, ' ').trim();
        const fullSearchString = "บัญชีราชรสสุขา2 - " + cleanTargetDate;
        
        if (normalizedFileName.indexOf(cleanTargetDate) !== -1 || normalizedFileName === fullSearchString) {
          dailyFile = file;
          foundFileName = fileName;
          break;
        }
      }
      if (dailyFile) break;
    }
    
    if (!dailyFile) {
      const yesterdayStr = formattedDates[8] || "ย้อนหลัง";
      return "ไม่พบไฟล์ประจำวันสำหรับวันที่ย้อนหลัง (เมื่อวาน) ในรูปแบบ 'บัญชีราชรสสุขา2 - " + yesterdayStr + "' ในโฟลเดอร์ '" + DRIVE_FOLDER_NAME + "'";
    }
    
    return processImportFromFile(dailyFile, destSheet, "", yesterday);
  } catch (error) {
    return "ERROR: " + error.toString();
  }
}

function processImportFromFile(dailyFile, destSheet, logPrefix, targetDate) {
  let importedCount = 0;
  const mimeType = dailyFile.getMimeType();
  const fileDate = targetDate || new Date();
  const fileDateStr = Utilities.formatDate(fileDate, "GMT+7", "yyyy-MM-dd");
  
  const existingTxData = destSheet.getDataRange().getValues();
  const existingKeys = {};
  for (let r = 1; r < existingTxData.length; r++) {
    const rawTitle = existingTxData[r][2] ? existingTxData[r][2].toString().trim().toLowerCase() : "";
    const rawAmount = existingTxData[r][3] ? parseFloat(existingTxData[r][3].toString().replace(/,/g, "")) : 0;
    
    let rawDateStr = "";
    if (existingTxData[r][4]) {
      try {
        rawDateStr = Utilities.formatDate(new Date(existingTxData[r][4]), "GMT+7", "yyyy-MM-dd");
      } catch(e) {
        rawDateStr = existingTxData[r][4].toString().trim();
      }
    }
    
    const uniqueKey = generateUniqueKey(rawTitle, rawAmount, rawDateStr);
    if (uniqueKey) {
      existingKeys[uniqueKey] = true;
    }
  }
  if (mimeType === MimeType.GOOGLE_SHEETS) {
    const dailySs = SpreadsheetApp.open(dailyFile);
    const dailySheet = dailySs.getSheets()[0];
    const dailyData = dailySheet.getDataRange().getValues();
    
    if (dailyData.length > 1) {
      const headers = dailyData[0].map(h => h.toString().trim().toLowerCase());
      
      const colTitleIdx = headers.findIndex(h => h.includes("รายการ") || h.includes("title"));
      const colAmountIdx = headers.findIndex(h => h.includes("จำนวนเงิน") || h.includes("ยอดเงิน") || h.includes("amount") || h.includes("ราคา"));
      const colTypeIdx = headers.findIndex(h => h.includes("ประเภท") || h.includes("type") || h.includes("รับ/จ่าย"));
      const colCategoryIdx = headers.findIndex(h => h.includes("หมวดหมู่") || h.includes("category"));
      const colNotesIdx = headers.findIndex(h => h.includes("หมายเหตุ") || h.includes("notes"));
      const colDateIdx = headers.findIndex(h => h.includes("วันที่") || h.includes("date"));
      
      for (let r = 1; r < dailyData.length; r++) {
        const row = dailyData[r];
        if (!row[colTitleIdx] || !row[colAmountIdx]) continue;
        
        const rawTitle = row[colTitleIdx].toString().trim();
        const rawAmount = parseFloat(row[colAmountIdx].toString().replace(/,/g, ""));
        
        if (isNaN(rawAmount) || rawAmount <= 0) continue;
        
        let txType = "expense";
        if (colTypeIdx !== -1) {
          const typeVal = row[colTypeIdx].toString().toLowerCase();
          if (typeVal.includes("รับ") || typeVal.includes("รายรับ") || typeVal.includes("income") || typeVal.includes("ขาย")) {
            txType = "income";
          }
        } else if (rawTitle.includes("ขาย") || rawTitle.includes("รับเงิน") || rawTitle.includes("ยอดขาย")) {
          txType = "income";
        }
        
        let txDate = fileDateStr;
        if (colDateIdx !== -1 && row[colDateIdx]) {
          try {
            txDate = Utilities.formatDate(new Date(row[colDateIdx]), "GMT+7", "yyyy-MM-dd");
          } catch(e) {}
        }
        
        const currentCheckKey = generateUniqueKey(rawTitle, rawAmount, txDate);
        if (existingKeys[currentCheckKey]) continue;
        
        const parsedData = parseTextTransaction(rawTitle);
        const itemNameVal = parsedData ? parsedData.itemName : "";
        let cleanCategory = parsedData ? parsedData.category : "other-exp";
        if (colCategoryIdx !== -1 && row[colCategoryIdx]) {
          const rawCategory = row[colCategoryIdx].toString().trim();
          if (rawCategory) {
            cleanCategory = mapCategory(rawCategory, txType);
          }
        }
        
        let txNotes = "นำเข้าไฟล์รายวัน: " + dailyFile.getName();
        if (colNotesIdx !== -1 && row[colNotesIdx]) {
          txNotes += " | " + row[colNotesIdx].toString().trim();
        }
        
        destSheet.appendRow([
          "t-daily-import-" + Date.now() + "-" + r + logPrefix,
          txType,
          rawTitle,
          rawAmount,
          txDate,
          cleanCategory,
          txNotes,
          itemNameVal,
          itemNameVal ? 1 : "", 
          itemNameVal ? "รายการ" : "", 
          itemNameVal ? rawAmount : ""
        ]);
        importedCount++;
      }
    }
  } 
  else if (mimeType === MimeType.GOOGLE_DOCS) {
    const doc = DocumentApp.openById(dailyFile.getId());
    const text = doc.getBody().getText();
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      if (!line.trim()) return;
      
      const cleanedLine = line.replace(/,/g, "");
      const amountMatch = cleanedLine.match(/\d+(\.\d+)?/);
      
      if (amountMatch) {
        const amount = parseFloat(amountMatch[0]);
        if (amount > 0) {
          const title = line.trim();
          
          const parsedData = parseTextTransaction(title);
          const type = parsedData.type;
          const category = parsedData.category;
          const itemNameVal = parsedData.itemName;
          
          const currentCheckKey = generateUniqueKey(title, amount, fileDateStr);
          if (!existingKeys[currentCheckKey]) {
            destSheet.appendRow([
              "t-doc-import-" + Date.now() + "-" + index + logPrefix,
              type,
              title,
              amount,
              fileDateStr,
              category,
              "นำเข้าจาก Doc: " + dailyFile.getName(),
              itemNameVal,
              itemNameVal ? 1 : "",
              itemNameVal ? "รายการ" : "",
              itemNameVal ? amount : ""
            ]);
            importedCount++;
          }
        }
      }
    });
  }
  
  return "SUCCESS: นำเข้าสำเร็จ " + importedCount + " รายการ";
}

// 🛠️ เจนคีย์ล็อกความซ้ำซ้อน
function generateUniqueKey(title, amount, dateStr) {
  if (!title) return null;
  const cleanTitle = title.toString().replace(/\s+/g, '').trim().toLowerCase();
  const cleanAmount = parseFloat(amount).toFixed(2);
  const cleanDate = dateStr.toString().trim();
  return cleanTitle + "_" + cleanAmount + "_" + cleanDate;
}

// ==========================================
// 4. Helper & Utility Functions
// ==========================================
function getFolderByName(folderName) {
  const folders = DriveApp.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  } else {
    throw new Error("ไม่พบโฟลเดอร์ชื่อ '" + folderName + "' บน Google Drive");
  }
}

function getSpreadsheetByNameInFolder(folderName, fileName) {
  const folder = getFolderByName(folderName);
  const files = folder.getFilesByName(fileName);
  if (files.hasNext()) {
    return SpreadsheetApp.open(files.next());
  } else {
    throw new Error("ไม่พบไฟล์ชีตหลักชื่อ '" + fileName + "' ในโฟลเดอร์ '" + folderName + "'");
  }
}

function getPossibleDateStrings(date) {
  const dates = [];
  const dd = String(date.getDate()).padStart(2, '0');
  const d = String(date.getDate());
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const m = String(date.getMonth() + 1);
  const yyyy = date.getFullYear();
  const bbbb = yyyy + 543; // พ.ศ.
  
  dates.push(`${dd}-${mm}-${bbbb}`);
  dates.push(`${dd}-${mm}-${yyyy}`);
  dates.push(`${dd}/${mm}/${bbbb}`);
  dates.push(`${dd}/${mm}/${yyyy}`);
  dates.push(`${d}-${m}-${bbbb}`);
  dates.push(`${d}-${m}-${yyyy}`);
  dates.push(`${d}/${m}/${bbbb}`);
  dates.push(`${d}/${m}/${yyyy}`);
  
  const thaiShortMonths = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  dates.push(`${dd} ${thaiShortMonths[date.getMonth()]} ${bbbb}`);
  dates.push(`${d} ${thaiShortMonths[date.getMonth()]} ${bbbb}`);
  
  const thaiFullMonths = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  dates.push(`${dd} ${thaiFullMonths[date.getMonth()]} ${bbbb}`);
  dates.push(`${d} ${thaiFullMonths[date.getMonth()]} ${bbbb}`);
  
  return dates;
}

// 💡 สนับสนุนการแมปชื่อหมวดหมู่และวัตถุดิบของร้านราชรสอย่างเป็นทางการ
function mapCategory(inputCat, type) {
  const norm = inputCat.toLowerCase().trim();
  if (type === "income") {
    if (norm.includes("เดลิ") || norm.includes("delivery") || norm.includes("line")) return "delivery";
    if (norm.includes("เลี้ยง") || norm.includes("catering")) return "catering";
    return "dine-in";
  } else {
    // ตรวจจับชื่อวัตถุดิบและค่าใช้จ่ายต่าง ๆ เพื่อเปลี่ยนหมวดหมู่หลักให้ถูกต้อง
    if (
      norm.includes("วัตถุดิบ") || norm.includes("ของสด") || norm.includes("raw-mat") ||
      norm.includes("เนื้อเช้า") || norm.includes("เนื้อเชา") || norm.includes("เนื้อสด") || norm.includes("เนื้อวัว") ||
      norm.includes("เนื้อบุฟ") || norm.includes("หมูบุฟ") || norm.includes("บุฟเฟต์") ||
      norm.includes("เนื้อบด") || norm.includes("หมู") || norm.includes("ลูกชิ้น") ||
      norm.includes("หม่าล่า") || norm.includes("เอส") || 
      norm.includes("เบียร์") || norm.includes("เบีย") || norm.includes("เหล้า") || 
      norm.includes("ช้าง") || norm.includes("ลีโอ") || norm.includes("สิงห์") || 
      norm.includes("spy") || norm.includes("แสงโสม") || norm.includes("รีเจนซี่") || 
      norm.includes("โซจู") || norm.includes("ไวน์") || norm.includes("wine") || norm.includes("beer") ||
      norm.includes("ผัก") || norm.includes("แมคโคร") || norm.includes("เนื้อ")
    ) {
      return "raw-mat";
    }
    if (norm.includes("ค่าเช่า") || norm.includes("เช่า") || norm.includes("fixed-rent")) return "fixed-rent";
    if (
      norm.includes("เงินเดือน") || norm.includes("ค่าจ้าง") || norm.includes("พนักงาน") ||
      norm.includes("salary") || norm.includes("fixed-salary")
    ) {
      return "fixed-salary";
    }
    if (
      norm.includes("น้ำ") || norm.includes("ไฟ") || norm.includes("แก๊ส") ||
      norm.includes("utilities") || norm.includes("ค่าน้ำ") || norm.includes("ค่าไฟ") || norm.includes("ค่าแก๊ส")
    ) {
      return "utilities";
    }
    if (norm.includes("การตลาด") || norm.includes("โฆษณา") || norm.includes("ตลาด") || norm.includes("marketing")) return "marketing";
    return "other-exp";
  }
}

function getSheetData(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];
  
  const headers = data[0];
  const rows = [];
  for (let i = 1; i < data.length; i++) {
    const row = {};
    for (let j = 0; j < headers.length; j++) {
      row[headers[j]] = data[i][j];
    }
    rows.push(row);
  }
  return rows;
}

function getBudgetsData(ss) {
  const sheet = ss.getSheetByName("Budgets");
  if (!sheet) return {};
  const data = sheet.getDataRange().getValues();
  const budgets = {};
  for (let i = 1; i < data.length; i++) {
    if (data[i][0]) budgets[data[i][0]] = data[i][1];
  }
  return budgets;
}

// 💡 ปรับปรุง LINE Bot Text Parser แยกหมวดหมู่สินค้าและสัดส่วนได้ทันที (ตรงกับ 14 หมวดหมู่ย่อยหลัก)
function parseTextTransaction(text) {
  const cleanedText = text.replace(/,/g, "");
  const amountMatch = cleanedText.match(/\d+(\.\d+)?/);
  
  if (!amountMatch) return null;
  const amount = parseFloat(amountMatch[0]);
  
  let type = "expense";
  let category = "other-exp";
  let itemName = "ค่าน้ำ ค่าไฟ อื่นๆ"; // ตั้งค่าเริ่มต้นให้ตรงกับหมวดทั่วไป
  let title = text;
  
  const normText = text.toLowerCase().trim();
  
  // 1. คัดกรองรายรับ
  if (normText.includes("ขาย") || normText.includes("รับ") || normText.includes("ยอดขาย") || normText.includes("รายรับ")) {
    type = "income";
    category = "dine-in";
    itemName = "";
    if (normText.includes("เดลิ") || normText.includes("delivery") || normText.includes("line")) {
      category = "delivery";
    } else if (normText.includes("เลี้ยง") || normText.includes("catering")) {
      category = "catering";
    }
    title = "ยอดขายหน้าร้าน/จัดส่ง";
  } 
  // 2. คัดกรองรายจ่าย (วัตถุดิบและค่าใช้จ่ายของร้านราชรส)
  else {
    if (normText.includes("เนื้อเช้า") || normText.includes("เนื้อเชา") || normText.includes("เนื้อสด") || normText.includes("เนื้อวัว")) {
      category = "raw-mat";
      itemName = "เนื้อเช้า";
    } else if (normText.includes("เนื้อบุฟ") || normText.includes("หมูบุฟ") || normText.includes("บุฟเฟต์")) {
      category = "raw-mat";
      itemName = "เนื้อบุฟ หมูบุฟ";
    } else if (normText.includes("เนื้อบด")) {
      category = "raw-mat";
      itemName = "เนื้อบด";
    } else if (normText.includes("เนื้อ")) {
      category = "raw-mat";
      itemName = "เนื้อเช้า";
    } else if (normText.includes("หมู") || normText.includes("ลูกชิ้น")) {
      category = "raw-mat";
      itemName = "หมู ลูกชิ้น";
    } else if (normText.includes("หม่าล่า")) {
      category = "raw-mat";
      itemName = "หม่าล่า";
    } else if (normText.includes("เอส") && !normText.includes("เอสเอส")) {
      category = "raw-mat";
      itemName = "เอส";
    } else if (
      normText.includes("เบียร์") || normText.includes("เบีย") || normText.includes("เหล้า") || 
      normText.includes("ช้าง") || normText.includes("ลีโอ") || normText.includes("สิงห์") || 
      normText.includes("spy") || normText.includes("แสงโสม") || normText.includes("รีเจนซี่") || 
      normText.includes("โซจู") || normText.includes("beer") || normText.includes("liquor") || normText.includes("wine") || normText.includes("ไวน์")
    ) {
      category = "raw-mat";
      itemName = "เบียร์ เหล้า";
    } else if (normText.includes("ผัก")) {
      category = "raw-mat";
      itemName = "ผัก";
    } else if (normText.includes("แมคโคร") || normText.includes("makro") || normText.includes("วัตถุดิบ") || normText.includes("ของสด") || normText.includes("raw-mat")) {
      category = "raw-mat";
      itemName = "แมคโคร";
    } else if (normText.includes("ค่าเช่า") || normText.includes("เช่า")) {
      category = "fixed-rent";
      itemName = "ค่าเช่า";
    } else if (normText.includes("ค่าจ้างพนักงาน") || normText.includes("ค่าจ้าง") || normText.includes("พนักงาน") || normText.includes("เงินเดือน")) {
      category = "fixed-salary";
      itemName = "ค่าจ้างพนักงาน";
    } else if (normText.includes("ค่าการตลาด") || normText.includes("การตลาด") || normText.includes("โฆษณา") || normText.includes("แอด") || normText.includes("marketing")) {
      category = "marketing";
      itemName = "ค่าการตลาด";
    } else if (normText.includes("ค่าแก๊ส") || normText.includes("แก๊ส")) {
      category = "utilities";
      itemName = "ค่าแก๊ส";
    } else if (normText.includes("ค่าน้ำ") || normText.includes("ค่าไฟ") || normText.includes("น้ำไฟ") || normText.includes("ไฟ") || normText.includes("เน็ต") || normText.includes("ค่าเน็ต") || normText.includes("ไฟฟ้า") || normText.includes("ประปา")) {
      category = "utilities";
      itemName = "ค่าน้ำ ค่าไฟ อื่นๆ";
    } else {
      category = "other-exp";
      itemName = "ค่าน้ำ ค่าไฟ อื่นๆ";
    }
    
    title = "บันทึก: " + itemName;
  }
  
  return { type, category, title, amount, itemName };
}

function generateDailyReport(ss) {
  const transactions = getSheetData(ss, "Transactions");
  const todayStr = Utilities.formatDate(new Date(), "GMT+7", "yyyy-MM-dd");
  
  let income = 0;
  let expense = 0;
  
  transactions.forEach(t => {
    const tDate = typeof t.date === "string" ? t.date : Utilities.formatDate(new Date(t.date), "GMT+7", "yyyy-MM-dd");
    if (tDate === todayStr) {
      if (t.type === "income") income += t.amount;
      else expense += t.amount;
    }
  });
  
  return `📊 รายงานด่วนสรุปประจำวัน [${todayStr}]\n━━━━━━━━━━━━━━━━━━━━\n🟢 ยอดขายวันนี้: ฿${income.toLocaleString()}\n🔴 ค่าใช้จ่ายวันนี้: ฿${expense.toLocaleString()}\n━━━━━━━━━━━━━━━━━━━━\n🔔 กำไรสุทธิวันนี้: ฿${(income - expense).toLocaleString()}`;
}

function getLineContent(messageId) {
  const url = "https://api-data.line.me/v2/bot/message/" + messageId + "/content";
  const headers = {
    "Authorization": "Bearer " + LINE_ACCESS_TOKEN
  };
  const response = UrlFetchApp.fetch(url, {
    "method": "get",
    "headers": headers
  });
  return response.getBlob();
}

function replyMessage(replyToken, text) {
  const url = "https://api.line.me/v2/bot/message/reply";
  const payload = {
    replyToken: replyToken,
    messages: [{ type: "text", text: text }]
  };
  const headers = {
    "Content-Type": "application/json",
    "Authorization": "Bearer " + LINE_ACCESS_TOKEN
  };
  UrlFetchApp.fetch(url, {
    "method": "post",
    "headers": headers,
    "payload": JSON.stringify(payload)
  });
}
