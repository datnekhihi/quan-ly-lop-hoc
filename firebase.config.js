const firebaseConfig = {
    apiKey: "AIzaSy...", // Thay bằng key của bạn
    authDomain: "quanly-428c3.firebaseapp.com",
    databaseURL: "https://quanly-428c3-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "quanly-428c3",
    storageBucket: "quanly-428c3.appspot.com",
    messagingSenderId: "...",
    appId: "..."
};
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// Hàm lấy ID từ URL (?id=HS01)
const urlParams = new URLSearchParams(window.location.search);
const currentID = urlParams.get('id');
