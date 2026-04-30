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
const savingsList = document.getElementById('savings-targets-list');

async function loadData() {
    const q = query(collection(db, "transactions"), orderBy("created_at", "desc"));
    const querySnapshot = await getDocs(q);
    
    list.innerHTML = '';
    savingsList.innerHTML = '';

    let totals = { balance: 0, debt: 0, owed: 0, savings: 0 };
    let savingsBuckets = {}; 

    querySnapshot.forEach((documentSnapshot) => {
        const item = documentSnapshot.data();
        const id = documentSnapshot.id;
        const amount = Number(item.amount);
        const isPaid = item.status === 'paid';

        if (item.type === 'income') totals.balance += amount;
        else if (item.type === 'expense') totals.balance -= amount;
        else if (item.type === 'debt') {
            if (isPaid) totals.balance += amount;
            else totals.debt += amount;
        }
        else if (item.type === 'owed') {
            if (isPaid) totals.balance -= amount;
            else totals.owed += amount;
        }
        else if (item.type === 'savings') {
            totals.savings += amount;
            totals.balance -= amount; // כסף עובר מהכיס לחיסכון
            if (!savingsBuckets[item.description]) savingsBuckets[item.description] = 0;
            savingsBuckets[item.description] += amount;
        }

        renderTransaction(item, id);
    });

    // רינדור קופות חיסכון
    Object.entries(savingsBuckets).forEach(([name, sum]) => {
        const bucket = document.createElement('div');
        bucket.className = 'savings-target-card';
        bucket.innerHTML = `<h4>${name}</h4><p>₪${sum.toLocaleString()}</p>`;
        savingsList.appendChild(bucket);
    });

    // עדכון מספרים למעלה
    document.getElementById('total-balance').innerText = `₪${totals.balance.toLocaleString()}`;
    document.getElementById('total-debt').innerText = `₪${totals.debt.toLocaleString()}`;
    document.getElementById('total-owed').innerText = `₪${totals.owed.toLocaleString()}`;
    document.getElementById('total-savings').innerText = `₪${totals.savings.toLocaleString()}`;
}

function renderTransaction(item, id) {
    const isPaid = item.status === 'paid';
    const card = document.createElement('div');
    card.className = `transaction-card ${item.type}`;
    card.innerHTML = `
        <div class="transaction-info">
            <strong>${item.description}</strong>
            <small>${item.created_at?.toDate().toLocaleDateString('he-IL') || ''}</small>
        </div>
        <div style="text-align: left;">
            <div style="color: ${getAmountColor(item.type, isPaid)}">${getSymbol(item.type)}${item.amount.toLocaleString()} ₪</div>
            ${(!isPaid && (item.type === 'debt' || item.type === 'owed')) ? `<button class="pay-btn" onclick="markAsPaid('${id}')">עדכן</button>` : ''}
        </div>
    `;
    list.appendChild(card);
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
