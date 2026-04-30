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

const form = document.getElementById('transaction-form');
const list = document.getElementById('transactions-list');

async function loadData() {
    const q = query(collection(db, "transactions"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = '';
    let balance = 0;    // כסף נזיל
    let debtToMe = 0;   // חייבים לי
    let owedByMe = 0;   // אני חייב
    let savings = 0;    // סך הכל בחיסכון

    querySnapshot.forEach((documentSnapshot) => {
        const item = documentSnapshot.data();
        const id = documentSnapshot.id;
        const amount = Number(item.amount);
        const isPaid = item.status === 'paid';
        
        if (item.type === 'income') balance += amount;
        if (item.type === 'expense') balance -= amount;
        
        if (item.type === 'debt') {
            if (isPaid) balance += amount;
            else debtToMe += amount;
        }
        
        if (item.type === 'owed') {
            if (isPaid) balance -= amount;
            else owedByMe += amount; // זה עדיין ב-balance אבל מוצג כחוב
        }

        if (item.type === 'savings') {
            savings += amount;
            balance -= amount; // כשמעבירים לחיסכון, זה יורד מהיתרה הנזילה
        }

        const card = document.createElement('div');
        card.className = `transaction-card ${item.type}`;
        card.innerHTML = `
            <div class="transaction-info">
                <strong>${item.description}</strong>
                <span class="paid-badge">${isPaid ? '✅' : ''}</span>
            </div>
            <div style="text-align: left;">
                <div style="font-weight: bold; color: ${getAmountColor(item.type, isPaid)}">
                    ${getSymbol(item.type)}${amount.toLocaleString()} ₪
                </div>
                ${(!isPaid && (item.type === 'debt' || item.type === 'owed')) ? 
                    `<button class="pay-btn" onclick="markAsPaid('${id}')">עדכן</button>` : ''}
            </div>
        `;
        list.appendChild(card);
    });

    // עדכון תצוגה - זה החלק שמתקן את הבעיה שלך
    document.getElementById('total-balance').innerText = `₪${balance.toLocaleString()}`;
    document.getElementById('total-debt').innerText = `₪${debtToMe.toLocaleString()}`;
    document.getElementById('total-owed').innerText = `₪${owedByMe.toLocaleString()}`;
    document.getElementById('total-savings').innerText = `₪${savings.toLocaleString()}`;
}

window.markAsPaid = async (id) => {
    await updateDoc(doc(db, "transactions", id), { status: 'paid' });
    loadData();
};

function getSymbol(type) {
    if (type === 'income') return '+';
    if (type === 'expense') return '-';
    if (type === 'debt') return '⏳';
    if (type === 'savings') return '🏦';
    return '💸';
}

function getAmountColor(type, isPaid) {
    if (isPaid) return '#94a3b8';
    if (type === 'income') return '#4ade80';
    if (type === 'expense') return '#fb7185';
    if (type === 'debt') return '#facc15';
    if (type === 'savings') return '#3b82f6';
    return '#a855f7';
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

loadData();
