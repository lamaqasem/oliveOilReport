const FEE_PER_SAMPLE = 29;
const STORAGE_KEY = "oliveReports";

document.addEventListener("DOMContentLoaded", () => {
    const reportIdField = document.getElementById("reportId");
    if (reportIdField) {
        reportIdField.value = "REP-" + Date.now();
    }

    // تفعيل حساب الرسوم عند تحميل الصفحة (لو فيها جدول نتائج)
    if (document.getElementById("resultsBody")) {
        updateFee();
        document.getElementById("resultsBody").addEventListener("input", updateFee);
        document.getElementById("resultsBody").addEventListener("change", updateFee);
    }
});

// حفظ التقرير محلياً بالمتصفح بدل إرساله لأي سيرفر خارجي
const reportForm = document.getElementById("reportForm");
if (reportForm) {
    reportForm.addEventListener("submit", function (e) {
        e.preventDefault();
        saveReportLocally(this);
    });
}

function saveReportLocally(form) {
    const fd = new FormData(form);

    const report = {
        id: fd.get("reportId"),
        type: fd.get("report_type") || "Report 1",
        owner: fd.get("owner"),
        district: fd.get("district"),
        reportDate: fd.get("reportDate"),
        reciveDate: fd.get("reciveDate"),
        collector: fd.get("collector"),
        destination: fd.get("destination"),
        recipient: fd.get("recipient"),
        quantity: fd.get("quantity"),
        sampleNo: fd.get("sampleNo"),
        feeCount: document.getElementById("feeCount") ? document.getElementById("feeCount").textContent : "0",
        feeTotal: document.getElementById("feeTotal") ? document.getElementById("feeTotal").textContent : "0 ₪",
        results: collectResults(),
        savedAt: new Date().toISOString()
    };

    if (report.type === "Report 2") {
        report.recommendations = collectRecommendations();
    }

    const all = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    all.push(report);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all));

    alert("تم حفظ التقرير بنجاح ✅\nرقم التقرير: " + report.id + "\n\nتقدر تشوف كل التقارير من صفحة \"سجل التقارير\"");

    // رقم تقرير جديد جاهز للتقرير التالي
    document.getElementById("reportId").value = "REP-" + Date.now();
}

function addResultRow() {
    const tbody = document.getElementById("resultsBody");
    const rowCount = tbody.rows.length + 1;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input name="sampleNo[]" value="${rowCount}" required></td>
        <td><input name="acidity[]" required></td>
        <td><input name="peroxide[]" required></td>
        <td>
            <select name="adulteration[]" required>
                <option value="">-</option>
                <option>-Ve</option>
                <option>+Ve</option>
            </select>
        </td>
    `;
    tbody.appendChild(row);
    updateFee();
}

function addRecommendationRow() {
    const tbody = document.getElementById("recommendationBody");
    const rowCount = tbody.rows.length + 1;

    const row = document.createElement("tr");
    row.innerHTML = `
        <td><input name="rec_no[]" value="${rowCount}" required></td>
        <td><input name="rec_en[]" required></td>
        <td class="rtl"><input name="rec_ar[]" required></td>
    `;
    tbody.appendChild(row);
}

function collectResults() {
    const rows = document.querySelectorAll("#resultsBody tr");
    let results = [];

    rows.forEach(row => {
        results.push({
            no: row.querySelector('input[name="sampleNo[]"]').value,
            acidity: row.querySelector('input[name="acidity[]"]').value,
            peroxide: row.querySelector('input[name="peroxide[]"]').value,
            adulteration: row.querySelector('select[name="adulteration[]"]').value
        });
    });

    return results;
}

function collectRecommendations() {
    const rows = document.querySelectorAll("#recommendationBody tr");
    let recs = [];

    rows.forEach(row => {
        recs.push({
            no: row.querySelector('input[name="rec_no[]"]').value,
            en: row.querySelector('input[name="rec_en[]"]').value,
            ar: row.querySelector('input[name="rec_ar[]"]').value
        });
    });

    return recs;
}

// يحسب عدد الصفوف التي فيها ولو خلية واحدة معبأة، ويحدّث الوصل
function updateFee() {
    const rows = document.querySelectorAll("#resultsBody tr");
    let filledCount = 0;

    rows.forEach(row => {
        const inputs = row.querySelectorAll("input, select");
        const hasValue = Array.from(inputs).some(el => el.value && el.value.trim() !== "");
        if (hasValue) filledCount++;
    });

    const total = filledCount * FEE_PER_SAMPLE;

    const countEl = document.getElementById("feeCount");
    const totalEl = document.getElementById("feeTotal");
    const priceField = document.getElementById("price");

    if (countEl) countEl.textContent = filledCount;
    if (totalEl) totalEl.textContent = total + " ₪";
    if (priceField) priceField.value = total;
}

// طباعة وصل مستقل (بدون طباعة التقرير كامل)
function printReceipt() {
    const owner = (document.getElementById("owner") || {}).value || "-";
    const reportId = (document.getElementById("reportId") || {}).value || "-";
    const count = (document.getElementById("feeCount") || {}).textContent || "0";
    const total = (document.getElementById("feeTotal") || {}).textContent || "0 ₪";
    const today = new Date().toLocaleDateString("ar-EG");

    const w = window.open("", "_blank", "width=420,height=650");
    if (!w) {
        alert("يرجى السماح بالنوافذ المنبثقة لطباعة الوصل");
        return;
    }

    w.document.write(`
        <html dir="rtl" lang="ar">
        <head>
            <meta charset="UTF-8">
            <title>وصل فحص زيت الزيتون</title>
            <style>
                body { font-family: Tahoma, Arial, sans-serif; padding: 24px; text-align: center; color:#222; }
                img { width: 55px; margin-bottom: 6px; }
                h2 { margin: 6px 0 0; }
                p { margin: 2px 0; }
                .line { border-top: 1px dashed #333; margin: 14px 0; }
                .row { display: flex; justify-content: space-between; margin: 6px 0; font-size: 15px; }
                .total { font-weight: bold; font-size: 18px; }
            </style>
        </head>
        <body onload="window.print()">
            <img src="./Picture1.png">
            <h2>وصل فحص زيت زيتون</h2>
            <p>المركز الوطني الفلسطيني للبحوث الزراعية</p>
            <p>مديرية المختبرات / مختبر طولكرم</p>
            <div class="line"></div>
            <div class="row"><span>رقم التقرير</span><span>${reportId}</span></div>
            <div class="row"><span>اسم صاحب الزيت</span><span>${owner}</span></div>
            <div class="row"><span>التاريخ</span><span>${today}</span></div>
            <div class="line"></div>
            <div class="row"><span>عدد العينات</span><span>${count}</span></div>
            <div class="row"><span>سعر العينة الواحدة</span><span>${FEE_PER_SAMPLE} ₪</span></div>
            <div class="row total"><span>الإجمالي</span><span>${total}</span></div>
            <div class="line"></div>
            <p>شكراً لكم</p>
        </body>
        </html>
    `);
    w.document.close();
}
