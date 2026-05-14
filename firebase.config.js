const firebaseConfig = {
  apiKey: "AIzaSyBuwC_mqQ0uO-5NSHLIJ5wq11dB-2kIop8",
  authDomain: "quanly-428c3.firebaseapp.com",
  databaseURL: "https://quanly-428c3-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "quanly-428c3",
  storageBucket: "quanly-428c3.firebasestorage.app",
  messagingSenderId: "1061659403130",
  appId: "1:1061659403130:web:1a2a23280aae1de0d3ecc3"
};

// Khởi tạo Firebase nếu chưa có
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}
const database = firebase.database();
