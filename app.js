import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp, updateDoc, doc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

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

// אלמנטים מה-HTML
const form = document.getElementById('transaction-form');
const list = document.getElementById('transactions-list');
const balanceDisplay = document.getElementById('total-balance');
const debtDisplay = document.getElementById('total-debt');

async function loadData() {
    const q = query(collection(db, "transactions"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = '';
    let totalBalance = 0;
    let pendingDebt = 0;

    querySnapshot.forEach((documentSnapshot) => {
        const item = documentSnapshot.data();
        const id = documentSnapshot.id;
        const amount = Number(item.amount);
        const isPaid = item.status === 'paid';
        
        // לוגיקת חישוב יתרה וחובות
        if (item.type === 'income') {
            totalBalance += amount;
        } else if (item.type === 'expense') {
            totalBalance -= amount;
        } else if (item.type === 'debt') {
            if (isPaid) {
                totalBalance += amount; // חוב ששולם נכנס ליתרה
            } else {
                pendingDebt += amount; // חוב פתוח מופיע בכרטיסייה נפרדת
            }
        }

        // יצירת כרטיסיית תנועה לרשימה
        const card = document.createElement('div');
        card.className = `transaction-card ${item.type}`;
        
        card.innerHTML = `
            <div class="transaction-info">
                <strong>${item.description}</strong>
                ${isPaid ? '<span class="paid-badge">שולם ✅</span>' : ''}
                <div class="date">${item.created_at?.toDate().toLocaleDateString('he-IL') || ''}</div>
            </div>
            <div class="transaction-amount" style="text-align: left;">
                <div style="font-weight: bold; color: ${getAmountColor(item.type, isPaid)}">
                    ${getSymbol(item.type)}${amount.toLocaleString()} ₪
                </div>
                ${(item.type === 'debt' && !isPaid) ? 
                    `<button class="pay-btn" onclick="markAsPaid('${id}')">קיבלתי ת'כסף</button>` : ''}
            </div>
        `;
        list.appendChild(card);
    });

    // עדכון הכרטיסיות למעלה
    balanceDisplay.innerText = `₪${totalBalance.toLocaleString()}`;
    debtDisplay.innerText = `₪${pendingDebt.toLocaleString()}`;
}

// פונקציה גלובלית לכפתור "קיבלתי ת'כסף"
window.markAsPaid = async (id) => {
    const docRef = doc(db, "transactions", id);
    await updateDoc(docRef, { status: 'paid' });
    loadData();
};

function getSymbol(type) {
    if (type === 'income') return '+';
    if (type === 'expense') return '-';
    return '⏳';
}

function getAmountColor(type, isPaid) {
    if (isPaid) return '#94a3b8'; // אפור לחוב שנסגר
    if (type === 'income') return '#4ade80'; // ירוק
    if (type === 'expense') return '#fb7185'; // אדום
    return '#facc15'; // צהוב לחוב מחכה
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
        status: type === 'debt' ? 'pending' : 'completed',
        created_at: serverTimestamp()
    });

    form.reset();
    loadData();
});

loadData();
