// ייבוא פונקציות ה-SDK של Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// הגדרות הפרויקט שלך (כפי שקיבלת מ-Firebase)
const firebaseConfig = {
  apiKey: "AIzaSyBvf3RUpjeXMczTjjdlQ5ZCrJvrkaRMRNY",
  authDomain: "zviki---mony.firebaseapp.com",
  projectId: "zviki---mony",
  storageBucket: "zviki---mony.firebasestorage.app",
  messagingSenderId: "513651694765",
  appId: "1:513651694765:web:5eb7995c416a75cc7d7a24",
  measurementId: "G-Q66RZM0BDF"
};

// אתחול Firebase ו-Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// קישור לאלמנטים ב-HTML
const form = document.getElementById('transaction-form');
const list = document.getElementById('transactions-list');
const balanceDisplay = document.getElementById('total-balance');

// פונקציה לטעינת נתונים מ-Firebase
async function loadData() {
    try {
        const q = query(collection(db, "transactions"), orderBy("created_at", "desc"));
        const querySnapshot = await getDocs(q);
        
        list.innerHTML = '';
        let total = 0;

        querySnapshot.forEach((doc) => {
            const item = doc.data();
            const amount = Number(item.amount);
            const isExpense = item.type === 'expense';
            
            total += isExpense ? -amount : amount;

            const card = document.createElement('div');
            card.className = 'transaction-card';
            card.style.borderBottom = "1px solid #eee";
            card.style.padding = "10px";
            card.style.display = "flex";
            card.style.justifyContent = "space-between";

            card.innerHTML = `
                <div>
                    <strong>${item.description}</strong>
                </div>
                <span style="color: ${isExpense ? '#fb7185' : '#4ade80'}; font-weight: bold;">
                    ${isExpense ? '-' : '+'}${amount.toLocaleString()} ₪
                </span>
            `;
            list.appendChild(card);
        });

        balanceDisplay.innerText = `${total.toLocaleString()} ₪`;
        balanceDisplay.style.color = total >= 0 ? '#4ade80' : '#fb7185';
    } catch (err) {
        console.error("שגיאה בטעינת הנתונים:", err);
    }
}

// הוספת תנועה חדשה בלחיצה על כפתור השמירה
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const type = document.getElementById('type').value;

    try {
        await addDoc(collection(db, "transactions"), {
            description: description,
            amount: Number(amount),
            type: type,
            created_at: serverTimestamp() // זמן השרת
        });
        
        form.reset();
        await loadData(); // רענון הרשימה
    } catch (err) {
        alert("אופס, הייתה שגיאה בשמירה: " + err.message);
    }
});

// הפעלה ראשונית של הטעינה
loadData();