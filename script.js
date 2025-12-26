// --- LẤY THÔNG TIN TỪ URL ---
const urlParams = new URLSearchParams(window.location.search);
const currentID = urlParams.get('id');
let currentViewClass = "";

window.onload = function() {
    if (window.location.pathname.includes('teacher.html')) {
        checkTeacherRole();
    } else if (window.location.pathname.includes('student.html')) {
        loadStudentData();
    } else if (window.location.pathname.includes('parent.html')) {
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
            // Dành cho GV Bộ môn: Hiện menu chọn lớp
            if (zoneAdd) zoneAdd.style.display = "none";
            if (zoneSelect) zoneSelect.style.display = "block";
            document.getElementById('student-list').innerHTML = "<p style='font-size:12px; opacity:0.6;'>Vui lòng chọn lớp để chấm điểm.</p>";
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
        let listXinNghi = []; // Danh sách học sinh xin nghỉ
        let listDiTre = [];   // Danh sách học sinh đi trễ

        if (!snap.exists()) {
            listUI.innerHTML = "<p style='font-size:12px; opacity:0.5;'>Lớp này chưa có học sinh.</p>";
            return;
        }

        snap.forEach((child) => {
            const hs = child.val();
            const id = child.key;

            // Phân loại thông báo
            if (hs.trang_thai === "Xin nghỉ") listXinNghi.push(hs.ten);
            if (hs.trang_thai === "Đi trễ") listDiTre.push(hs.ten);

            listUI.innerHTML += `
                <div style="background:rgba(255,255,255,0.15); padding:15px; border-radius:15px; margin-bottom:10px; display:flex; justify-content:space-between; align-items:center;">
                    <div>
                        <b>${hs.ten}</b><br>
                        <span style="font-size:11px;">ID: ${id} | Điểm: <span style="color:#55efc4; font-weight:bold;">${hs.diem_ren_luyen || 0}</span></span><br>
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

        // HIỂN THỊ THÔNG BÁO TỔNG HỢP CHO GIÁO VIÊN
        const alertZone = document.getElementById('teacher-alert-zone');
        if (alertZone) {
            let thongBaoHTML = "";
            if (listXinNghi.length > 0) thongBaoHTML += `⚠️ NGHỈ: ${listXinNghi.join(", ")}<br>`;
            if (listDiTre.length > 0) thongBaoHTML += `⏰ TRỄ: ${listDiTre.join(", ")}`;

            if (thongBaoHTML !== "") {
                alertZone.style.display = "block";
                alertZone.innerHTML = `
                    <div style="background: #d63031; color: white; padding: 10px; border-radius: 10px; margin-bottom: 15px; animation: pulse 1s infinite; font-size: 13px; font-weight: bold; border: 2px solid white; text-align: center;">
                        ${thongBaoHTML}
                    </div>`;
            } else {alertZone.style.display = "none";
            }
        }
    });
}
    
// Thêm hiệu ứng nhấp nháy (copy dán vào cuối file script.js)
const style = document.createElement('style');
style.innerHTML = `@keyframes pulse { 0% { opacity: 1; } 50% { opacity: 0.7; } 100% { opacity: 1; } }`;
document.head.appendChild(style);

function capNhatDiem(id, value) {
    database.ref('users/' + id + '/diem_ren_luyen').transaction(c => (c || 0) + value);
}

function taoTaiKhoanMoi() {
    const id = document.getElementById('new-hs-id').value.trim().toUpperCase();
    const ten = document.getElementById('new-hs-name').value.trim();
    if (!id || !ten || !currentViewClass) return alert("Vui lòng nhập đủ thông tin!");
    
    database.ref('users/' + id).set({
        ten: ten,
        lop: currentViewClass,
        diem_ren_luyen: 100,
        trang_thai: "Đang ở lớp",
        ly_do_nghi: ""
    }).then(() => {
        alert("Đã cấp tài khoản thành công!");
        document.getElementById('new-hs-id').value = "";
        document.getElementById('new-hs-name').value = "";
    });
}

// --- LOGIC HỌC SINH ---
function loadStudentData() {
    if (!currentID) return;
    database.ref('users/' + currentID).on('value', (snap) => {
        const data = snap.val();
        localStorage.setItem("user-class", data.lop || "12A1"); // Thay 'lop' bằng tên cột lớp trên Firebase của bạn
        // Nếu học sinh đã đăng ký mặt, lưu vào máy để so sánh khi điểm danh
        // Nếu học sinh đã đăng ký mặt, tải mẫu về máy để so sánh
if (data.face_data) {
    localStorage.setItem("user-face", JSON.stringify(data.face_data));
}
    if (data.face_data) {
    localStorage.setItem("user-face", JSON.stringify(data.face_data));
}
        if (!data) return;
        document.getElementById('student-name').innerText = data.ten;
        document.getElementById('student-score').innerText = data.diem_ren_luyen || 0;
    });
}

function baoDanh() {
    // 1. Lấy thời gian hiện tại từ máy tính
    const bayGio = new Date();
    const gio = bayGio.getHours();
    const phut = bayGio.getMinutes();

    // 2. Thiết lập mốc thời gian trễ (6h55)
    let trangThaiMoi = "Đang ở lớp";
    let thongBao = "Đã báo danh có mặt!";

    if (gio > 6 || (gio === 6 && phut > 55)) {
        trangThaiMoi = "Đi trễ";
        thongBao = `Bạn đã báo danh muộn lúc ${gio}:${phut < 10 ? '0' + phut : phut}. Hệ thống đã ghi nhận đi trễ!`;
    }

    // 3. Cập nhật lên Firebase
    database.ref('users/' + currentID).update({ 
        trang_thai: trangThaiMoi, 
        ly_do_nghi: trangThaiMoi === "Đi trễ" ? `Vào lớp lúc ${gio}:${phut}` : "" 
    }).then(() => {
        alert(thongBao);
    });
}

function xinNghi() {
    const lyDo = document.getElementById('reason-input').value.trim();
    if (!lyDo) return alert("Vui lòng nhập lý do nghỉ!");
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
        if (!data) {
            document.getElementById('p-student-name').innerText = "Không tìm thấy dữ liệu con!";
            return;
        }
        document.getElementById('p-student-name').innerText = "Học sinh: " + data.ten;
        document.getElementById('p-student-score-btn').innerText = "Điểm hiện tại: " + (data.diem_ren_luyen || 0);
        
        const statusEl = document.getElementById('p-student-status');
        const actionZone = document.getElementById('parent-action-zone');
        
        let thongBao = "Trạng thái: " + (data.trang_thai || "Đang ở lớp");if (data.ly_do_nghi) thongBao += " (Lý do: " + data.ly_do_nghi + ")";
        if (statusEl) statusEl.innerText = thongBao;

        // Hiện nút Duyệt nếu con đang trạng thái "Xin nghỉ"
        if (actionZone) {
            actionZone.style.display = (data.trang_thai === "Xin nghỉ") ? "block" : "none";
        }
    });
}

function duyetDon() {
    database.ref('users/' + currentID).update({ 
        trang_thai: "Nghỉ có phép (PH đã duyệt)" 
    }).then(() => alert("Đã xác nhận cho con nghỉ!"));

}




