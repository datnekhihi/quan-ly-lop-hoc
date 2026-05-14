// --- KẾT NỐI DATABASE (Đảm bảo biến 'database' đã được định nghĩa từ Firebase Config) ---
const urlParams = new URLSearchParams(window.location.search);
const currentID = urlParams.get('id');
let currentViewClass = "";

window.onload = function() {
    const path = window.location.pathname;
    if (path.includes('teacher.html')) {
        checkTeacherRole();
        loadLeaveRequests(); // Tự động load danh sách xin nghỉ cho GV
    } else if (path.includes('student.html')) {
        loadStudentData();
    } else if (path.includes('parent.html')) {
        loadParentData();
    }
};

// --- LOGIC GIÁO VIÊN ---
function checkTeacherRole() {
    if (!currentID) return;
    database.ref('teachers/' + currentID).on('value', (snap) => {
        const data = snap.val();
        if (!data) {
            document.getElementById('gv-display').innerText = "Không tìm thấy GV!";
            return;
        }

        document.getElementById('gv-display').innerText = "GV: " + data.ten;
        const zoneAdd = document.getElementById('add-student-zone');
        const zoneSelect = document.getElementById('class-selector-zone');

        if (data.role === "chu_nhiem") {
            currentViewClass = data.lop_chu_nhiem;
            if (zoneAdd) zoneAdd.style.display = "block";
            if (zoneSelect) zoneSelect.style.display = "none";
            loadClassData(currentViewClass);
        } else {
            if (zoneAdd) zoneAdd.style.display = "none";
            if (zoneSelect) zoneSelect.style.display = "block";
            document.getElementById('student-list').innerHTML = "<p style='font-size:12px; opacity:0.6;'>Vui lòng chọn lớp.</p>";
        }
    });
}

function changeClass(className) {
    if (!className) return;
    currentViewClass = className;
    loadClassData(className);
}

function loadClassData(className) {
    const listUI = document.getElementById('student-list');
    database.ref('users').orderByChild('lop').equalTo(className).on('value', (snap) => {
        listUI.innerHTML = "";
        let listXinNghi = []; 
        let listDiTre = [];

        if (!snap.exists()) {
            listUI.innerHTML = "<p style='font-size:12px; opacity:0.5;'>Lớp chưa có học sinh.</p>";
            return;
        }

        snap.forEach((child) => {
            const hs = child.val();
            const id = child.key;
            if (hs.trang_thai === "Xin nghỉ") listXinNghi.push(hs.ten);
            if (hs.trang_thai === "Đi trễ") listDiTre.push(hs.ten);

            listUI.innerHTML += `
                <div style="background:rgba(255,255,255,0.15); padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b>${hs.ten}</b><br> <span style="font-size:11px;">ID: ${id} | Điểm: <span style="color:#55efc4; font-weight:bold;">${hs.diem_ren_luyen || 0}</span></span><br>
                        <span style="font-size:10px; color:${hs.trang_thai === 'Xin nghỉ' || hs.trang_thai === 'Đi trễ' ? '#ff7675' : '#ffeaa7'}; font-weight:bold;">
                            ${hs.trang_thai || "Đang ở lớp"}${hs.ly_do_nghi ? " - " + hs.ly_do_nghi : ""}
                        </span>
                    </div>
                    <div style="display:flex; gap:5px;">
                        <button onclick="capNhatDiem('${id}', -1)" style="background:#ff7675; border:none; color:white; width:30px; height:30px; border-radius:5px; cursor:pointer;">-</button>
                        <button onclick="capNhatDiem('${id}', 1)" style="background:#55efc4; border:none; width:30px; height:30px; border-radius:5px; cursor:pointer;">+</button>
                    </div>
                </div>`;
        });
        updateAlertZone(listXinNghi, listDiTre);
    });
}

function updateAlertZone(xinNghi, diTre) {
    const alertZone = document.getElementById('teacher-alert-zone');
    if (!alertZone) return;
    let html = "";
    if (xinNghi.length > 0) html += `⚠️ NGHỈ: ${xinNghi.join(", ")}<br>`;
    if (diTre.length > 0) html += `⏰ TRỄ: ${diTre.join(", ")}`;
    
    if (html !== "") {
        alertZone.style.display = "block";
        alertZone.innerHTML = `<div style="background:#d63031; color:white; padding:10px; border-radius:10px; animation:pulse 1s infinite; font-size:13px; font-weight:bold; text-align:center;">${html}</div>`;
    } else { alertZone.style.display = "none"; }
}

// --- QUẢN LÝ DANH SÁCH XIN NGHỈ (Cập nhật theo image_28.png) ---
function loadLeaveRequests() {
    database.ref('xin_nghi').on('value', (snap) => {
        const leaveUI = document.getElementById('leave-list-container');
        if (!leaveUI) return;
        leaveUI.innerHTML = "";
        if (!snap.exists()) return;

        snap.forEach((child) => {
            const id = child.key;
            const data = child.val();
            leaveUI.innerHTML += `
                <div style="position:relative; background:rgba(233,69,96,0.1); padding:15px; border-radius:15px; margin-bottom:10px; border:1px solid rgba(233,69,96,0.3);">
                    <span onclick="xoaDonLe('${id}')" style="position:absolute; top:10px; right:15px; color:#ff7675; cursor:pointer; font-weight:bold;">✕</span>
                    <div style="color:#ff7675; font-weight:bold;">🚩 ${data.ten}</div>
                    <div style="font-size:13px; margin-top:5px;">Lý do: ${data.ly_do}</div>
                    <div style="font-size:10px; opacity:0.6; margin-top:5px;">${data.thoi_gian}</div>
                </div>`;
    });
});
}

function xoaDonLe(id) { if(confirm("Xoá đơn này?")) database.ref('xin_nghi/' + id).remove(); }
function xoaToanBoDanhSach() { if(confirm("Làm sạch danh sách xin nghỉ?")) database.ref('xin_nghi').remove(); }

function capNhatDiem(id, value) { database.ref('users/' + id + '/diem_ren_luyen').transaction(c => (c || 0) + value); }

// --- LOGIC HỌC SINH ---
function loadStudentData() {
    if (!currentID) return;
    database.ref('users/' + currentID).on('value', (snap) => {
        const data = snap.val();
        if (!data) return;
        document.getElementById('student-name').innerText = data.ten;
        document.getElementById('student-score').innerText = data.diem_ren_luyen || 0;
    });
}

function baoDanh() {
    const bayGio = new Date();
    const gio = bayGio.getHours();
    const phut = bayGio.getMinutes();
    let trangThaiMoi = "Đang ở lớp";
    let thongBao = "Đã báo danh có mặt!";

    if (gio > 6 || (gio === 6 && phut > 55)) {
        trangThaiMoi = "Đi trễ";
        thongBao = `Bạn vào lớp muộn lúc ${gio}:${phut < 10 ? '0' + phut : phut}.`;
    }

    database.ref('users/' + currentID).update({ 
        trang_thai: trangThaiMoi, 
        ly_do_nghi: trangThaiMoi === "Đi trễ" ? `Vào lúc ${gio}:${phut}` : "" 
    }).then(() => alert(thongBao));
}

function xinNghi() {
    const lyDo = document.getElementById('reason-input').value.trim();
    if (!lyDo) return alert("Vui lòng nhập lý do!");
    
    // Gửi lên bảng tin Giáo viên
    database.ref('xin_nghi/' + currentID).set({
        ten: document.getElementById('student-name').innerText,
        ly_do: lyDo,
        thoi_gian: new Date().toLocaleString()
    });

    // Cập nhật trạng thái cá nhân
    database.ref('users/' + currentID).update({ 
        trang_thai: "Xin nghỉ", 
        ly_do_nghi: lyDo 
    }).then(() => {
        alert("Đã gửi đơn xin nghỉ!");
        document.getElementById('reason-input').value = "";
    });
}

// --- LOGIC PHỤ HUYNH ---
function loadParentData() {
    if (!currentID) return;
    database.ref('users/' + currentID).on('value', (snap) => {
        const data = snap.val();
        if (!data) return;
        document.getElementById('p-student-name').innerText = "Học sinh: " + data.ten;
        document.getElementById('p-student-score-btn').innerText = "Điểm: " + (data.diem_ren_luyen || 0);
        
        const statusEl = document.getElementById('p-student-status');
        const actionZone = document.getElementById('parent-action-zone');
        
        if (statusEl) statusEl.innerText = "Trạng thái: " + (data.trang_thai || "Đang ở lớp") + (data.ly_do_nghi ? ` (${data.ly_do_nghi})` : "");
        if (actionZone) actionZone.style.display = (data.trang_thai === "Xin nghỉ") ? "block" : "none";
    });
}

function duyetDon() {
    database.ref('users/' + currentID).update({ trang_thai: "Nghỉ có phép (PH đã duyệt)" })
    .then(() => alert("Đã xác nhận cho con nghỉ!"));
}

// --- STYLE BỔ SUNG ---
const style = document.createElement('style');
style.innerHTML = `@keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }`;
document.head.appendChild(style);
