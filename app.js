import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// הגדרות ה-Firebase שלך
const firebaseConfig = {
  apiKey: "AIzaSyBvf3RUpjeXMczTjjdlQ5ZCrJvrkaRMRNY",
  authDomain: "zviki---mony.firebaseapp.com",
  projectId: "zviki---mony",
  storageBucket: "zviki---mony.firebasestorage.app",
  messagingSenderId: "513651694765",
  appId: "1:513651694765:web:5eb7995c416a75cc7d7a24"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const form = document.getElementById('transaction-form');
const list = document.getElementById('transactions-list');

async function loadData() {
    const q = query(collection(db, "transactions"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = '';
    let balance = 0;    // כסף שיש לי כרגע בחשבון
    let debtToMe = 0;   // כסף שאנשים חייבים לי
    let owedByMe = 0;   // כסף שאני חייב לאחרים

    querySnapshot.forEach((documentSnapshot) => {
        const item = documentSnapshot.data();
        const id = documentSnapshot.id;
        const amount = Number(item.amount);
        const isPaid = item.status === 'paid';
        
        // לוגיקת חישוב סכומים
        if (item.type === 'income') {
            balance += amount;
        } else if (item.type === 'expense') {
            balance -= amount;
        } else if (item.type === 'debt') {
            if (isPaid) balance += amount; // החוב שולם, הכסף נכנס ליתרה
            else debtToMe += amount;       // חוב פתוח
        } else if (item.type === 'owed') {
            if (isPaid) balance -= amount; // שילמתי את החוב, הכסף יצא מהיתרה
            else owedByMe += amount;       // חוב שעדיין אצלי בחשבון
        }

        // יצירת כרטיסיית תנועה לרשימה
        const card = document.createElement('div');
        card.className = `transaction-card ${item.type}`;
        
        card.innerHTML = `
            <div class="transaction-info">
                <strong>${item.description}</strong>
                ${isPaid ? '<span class="paid-badge">(בוצע ✅)</span>' : ''}
                <div style="font-size: 0.8em; color: #94a3b8;">${item.created_at?.toDate().toLocaleDateString('he-IL') || ''}</div>
            </div>
            <div style="text-align: left;">
                <div style="font-weight: bold; color: ${getAmountColor(item.type, isPaid)}">
                    ${getSymbol(item.type)}${amount.toLocaleString()} ₪
                </div>
                ${(!isPaid && (item.type === 'debt' || item.type === 'owed')) ? 
                    `<button class="pay-btn" onclick="markAsPaid('${id}')">${item.type === 'debt' ? "קיבלתי ת'כסף" : "שילמתי חוב"}</button>` : ''}
            </div>
        `;
        list.appendChild(card);
    });

    // עדכון התצוגה למעלה - התיקון הקריטי כאן:
    document.getElementById('total-balance').innerText = `₪${balance.toLocaleString()}`;
    document.getElementById('total-debt').innerText = `₪${debtToMe.toLocaleString()}`;
    
    // מוודא שהאלמנט קיים לפני העדכון כדי למנוע שגיאות
    const owedDisplay = document.getElementById('total-owed');
    if (owedDisplay) {
        owedDisplay.innerText = `₪${owedByMe.toLocaleString()}`;
    }
}

// פונקציה לעדכון סטטוס "שולם"
window.markAsPaid = async (id) => {
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, { status: 'paid' });
    loadData();
};

function getSymbol(type) {
    if (type === 'income') return '+';
    if (type === 'expense') return '-';
    if (type === 'debt') return '⏳';
    return '💸';
}

function getAmountColor(type, isPaid) {
    if (isPaid) return '#94a3b8'; // אפור למה שסגור
    if (type === 'income') return '#4ade80'; // ירוק
    if (type === 'expense') return '#fb7185'; // אדום
    if (type === 'debt') return '#facc15';    // צהוב
    return '#a855f7'; // סגול (Owed)
}

form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    const type = document.getElementById('type').value;

    await addDoc(collection(db, "transactions"), {
        description,
        amount: Number(amount),
        type,
        status: (type === 'debt' || type === 'owed') ? 'pending' : 'completed',
        created_at: serverTimestamp()
    });

    form.reset();
    loadData();
});

// טעינה ראשונית
loadData();
