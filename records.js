const STORAGE_KEY = "oliveReports";

document.addEventListener("DOMContentLoaded", renderTable);

function loadReports() {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
}

function saveReports(list) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

function renderTable() {
    const reports = loadReports();
    const tbody = document.getElementById("recordsBody");
    tbody.innerHTML = "";

    if (reports.length === 0) {
        tbody.innerHTML = `<tr><td colspan="8" class="text-muted">لا يوجد تقارير محفوظة بعد بهذا الجهاز</td></tr>`;
        document.getElementById("totalFee").textContent = "0 ₪";
        return;
    }

    let totalFee = 0;

    // الأحدث أولاً
    reports.slice().reverse().forEach((r) => {
        const realIndex = reports.indexOf(r);
        totalFee += parseInt(r.feeTotal) || 0;

        const tr = document.createElement("tr");
        tr.innerHTML = `
            <td>${r.id || "-"}</td>
            <td>${r.type === "Report 2" ? "تقرير 2" : "تقرير 1"}</td>
            <td>${r.owner || "-"}</td>
            <td>${r.district || "-"}</td>
            <td>${r.reportDate || "-"}</td>
            <td>${r.feeCount || "0"}</td>
            <td>${r.feeTotal || "0 ₪"}</td>
            <td class="no-print">
                <button class="btn btn-sm btn-outline-danger" onclick="deleteReport(${realIndex})">حذف</button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    document.getElementById("totalFee").textContent = totalFee + " ₪";
}

function deleteReport(index) {
    if (!confirm("متأكد إنك بدك تحذف هاد التقرير؟")) return;
    const reports = loadReports();
    reports.splice(index, 1);
    saveReports(reports);
    renderTable();
}

function clearAll() {
    if (!confirm("هاد رح يمسح كل التقارير المحفوظة بهذا الجهاز نهائياً! متأكد؟")) return;
    localStorage.removeItem(STORAGE_KEY);
    renderTable();
}

// تصدير الجدول كملف Excel حقيقي (xlsx) مباشرة من المتصفح
function exportExcel() {
    const reports = loadReports();
    if (reports.length === 0) {
        alert("لا يوجد بيانات لتصديرها بعد");
        return;
    }

    const rows = reports.map(r => ({
        "رقم التقرير": r.id,
        "النوع": r.type === "Report 2" ? "تقرير 2" : "تقرير 1",
        "اسم صاحب الزيت": r.owner,
        "المحافظة": r.district,
        "تاريخ التقرير": r.reportDate,
        "تاريخ الاستلام": r.reciveDate,
        "جامع العينة": r.collector,
        "وجهة النقل": r.destination,
        "مستلم العينة": r.recipient,
        "الكمية": r.quantity,
        "عدد العينات": r.feeCount,
        "الرسوم": r.feeTotal,
        "تفاصيل النتائج": JSON.stringify(r.results || []),
        "التوصيات": JSON.stringify(r.recommendations || []),
        "وقت الحفظ": r.savedAt
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "تقارير فحص الزيت");
    XLSX.writeFile(wb, "تقارير_فحص_الزيت_" + new Date().toISOString().slice(0, 10) + ".xlsx");
}

// نسخة احتياطية كاملة (JSON) - تصلح لنقل البيانات بين جهازين أو للأرشفة
function exportBackup() {
    const reports = loadReports();
    if (reports.length === 0) {
        alert("لا يوجد بيانات لتصديرها بعد");
        return;
    }

    const blob = new Blob([JSON.stringify(reports, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "نسخة_احتياطية_" + new Date().toISOString().slice(0, 10) + ".json";
    a.click();
    URL.revokeObjectURL(url);
}

// استيراد نسخة احتياطية ودمجها مع البيانات الموجودة بهذا الجهاز (بدون حذف شي)
function importBackup(fileInput) {
    const file = fileInput.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const imported = JSON.parse(e.target.result);
            if (!Array.isArray(imported)) throw new Error("bad format");

            const current = loadReports();
            const existingIds = new Set(current.map(r => r.id));
            const newOnes = imported.filter(r => !existingIds.has(r.id));

            const merged = current.concat(newOnes);
            saveReports(merged);
            renderTable();
            alert("تم استيراد ودمج " + newOnes.length + " تقرير جديد بنجاح ✅");
        } catch (err) {
            alert("الملف غير صالح، تأكد إنه نسخة احتياطية JSON صحيحة تم تصديرها من هذا الموقع");
        }
        fileInput.value = "";
    };
    reader.readAsText(file);
}
