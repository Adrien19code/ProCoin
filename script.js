let currentUser = null;

let coins = 0;
let diamonds = 100;
let adsWatchedToday = 0;
let maxAdsPerDay = 10;

let availableBets = [
  { id: 1, category: "Football", title: "PSG vs Marseille", options: ["PSG", "Nul", "OM"] },
  { id: 2, category: "Basket", title: "Lakers vs Celtics", options: ["Lakers", "Nul", "Celtics"] },
  { id: 3, category: "Gaming", title: "GTA 6 aura un trailer ce mois-ci ?", options: ["Oui", "Non"] },
  { id: 4, category: "Cinéma", title: "Le prochain Marvel sera numéro 1 ?", options: ["Oui", "Non"] },
  { id: 5, category: "Football", title: "Real Madrid vs Barcelone", options: ["Real", "Nul", "Barça"] },
  { id: 6, category: "Musique", title: "Un artiste français sera top 1 Spotify ?", options: ["Oui", "Non"] },
  { id: 7, category: "Gaming", title: "La Nintendo Switch 2 dépassera 10M de ventes ?", options: ["Oui", "Non"] },
  { id: 8, category: "Basket", title: "Warriors vs Bulls", options: ["Warriors", "Nul", "Bulls"] },
  { id: 9, category: "Foot", title: "Manchester City marquera plus de 2 buts ?", options: ["Oui", "Non"] },
  { id: 10, category: "YouTube", title: "Un créateur dépassera 1M d'abonnés ce mois-ci ?", options: ["Oui", "Non"] },
  { id: 11, category: "Gaming", title: "Fortnite sortira une grosse collaboration ?", options: ["Oui", "Non"] },
  { id: 12, category: "Sport", title: "Un match ira en prolongation ?", options: ["Oui", "Non"] }
];

let activeBets = [];
let wonBets = [];
let lostBets = [];

function getUsers() {
  return JSON.parse(localStorage.getItem("procoin_users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("procoin_users", JSON.stringify(users));
}

function register() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!username || !password) {
    alert("Entre un pseudo et un mot de passe.");
    return;
  }

  const users = getUsers();

  if (users[username]) {
    alert("Ce pseudo existe déjà.");
    return;
  }

  users[username] = {
    password: password,
    coins: 0,
    diamonds: 100,
    adsWatchedToday: 0,
    activeBets: [],
    wonBets: [],
    lostBets: []
  };

  saveUsers(users);
  alert("Compte créé ✅");
  login();
}

function login() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  const users = getUsers();

  if (!users[username] || users[username].password !== password) {
    alert("Pseudo ou mot de passe incorrect.");
    return;
  }

  currentUser = username;
  localStorage.setItem("procoin_current_user", username);

  loadUserData();
  showApp();
}

function logout() {
  saveCurrentUserData();
  localStorage.removeItem("procoin_current_user");
  currentUser = null;

  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("bottomNav").classList.add("hidden");
}

function loadUserData() {
  const users = getUsers();
  const user = users[currentUser];

  coins = user.coins;
  diamonds = user.diamonds;
  adsWatchedToday = user.adsWatchedToday;
  activeBets = user.activeBets || [];
  wonBets = user.wonBets || [];
  lostBets = user.lostBets || [];
}

function saveCurrentUserData() {
  if (!currentUser) return;

  const users = getUsers();

  users[currentUser].coins = coins;
  users[currentUser].diamonds = diamonds;
  users[currentUser].adsWatchedToday = adsWatchedToday;
  users[currentUser].activeBets = activeBets;
  users[currentUser].wonBets = wonBets;
  users[currentUser].lostBets = lostBets;

  saveUsers(users);
}

function showApp() {
  document.getElementById("authScreen").classList.add("hidden");
  document.getElementById("app").classList.remove("hidden");
  document.getElementById("bottomNav").classList.remove("hidden");
  document.getElementById("welcomeText").innerText = "Connecté : " + currentUser;
  updateUI();
}

function updateUI() {
  document.getElementById("coinsTop").innerText = "🪙 " + coins;
  document.getElementById("diamondsTop").innerText = "💎 " + diamonds;

  document.getElementById("coinsHome").innerText = coins;
  document.getElementById("diamondsHome").innerText = diamonds;

  document.getElementById("adsText").innerText =
    "Pubs restantes aujourd'hui : " + (maxAdsPerDay - adsWatchedToday) + "/" + maxAdsPerDay;

  document.getElementById("activeCountHome").innerText =
    "Tu as actuellement " + activeBets.length + " pari(s) actif(s).";

  renderBets();
  saveCurrentUserData();
}

function openPage(pageId, button) {
  document.querySelectorAll(".page").forEach(page => page.classList.remove("active"));
  document.getElementById(pageId).classList.add("active");

  document.querySelectorAll(".nav-btn").forEach(btn => btn.classList.remove("active"));
  button.classList.add("active");
}

function openBetTab(tabName, button) {
  document.getElementById("availableBets").style.display = "none";
  document.getElementById("activeBets").style.display = "none";
  document.getElementById("wonBets").style.display = "none";
  document.getElementById("lostBets").style.display = "none";

  document.querySelectorAll(".tab").forEach(tab => tab.classList.remove("active"));
  button.classList.add("active");

  if (tabName === "available") document.getElementById("availableBets").style.display = "block";
  if (tabName === "active") document.getElementById("activeBets").style.display = "block";
  if (tabName === "won") document.getElementById("wonBets").style.display = "block";
  if (tabName === "lost") document.getElementById("lostBets").style.display = "block";
}

function watchAd() {
  if (adsWatchedToday >= maxAdsPerDay) {
    alert("Tu as déjà regardé les 10 pubs disponibles aujourd'hui.");
    return;
  }

  adsWatchedToday++;
  diamonds += 20;

  alert("Pub terminée ✅\nTu gagnes +20 diamants.");
  updateUI();
}

function placeBet(betId, choice) {
  let bet = availableBets.find(item => item.id === betId);

  let amount = prompt("Combien de diamants veux-tu miser ?\nTu as " + diamonds + " diamants.");
  amount = Number(amount);

  if (!amount || amount <= 0) {
    alert("Mise invalide.");
    return;
  }

  if (amount > diamonds) {
    alert("Tu n'as pas assez de diamants.");
    return;
  }

  diamonds -= amount;

  activeBets.push({
    id: Date.now(),
    title: bet.title,
    category: bet.category,
    choice: choice,
    amount: amount
  });

  alert("Pari validé ✅");
  updateUI();
}

function markBetWon(id) {
  let bet = activeBets.find(item => item.id === id);
  let gain = bet.amount * 2;

  coins += gain;
  activeBets = activeBets.filter(item => item.id !== id);
  wonBets.push({ ...bet, gain: gain });

  alert("Pari gagné ✅\nTu gagnes " + gain + " pièces.");
  updateUI();
}

function markBetLost(id) {
  let bet = activeBets.find(item => item.id === id);

  activeBets = activeBets.filter(item => item.id !== id);
  lostBets.push(bet);

  alert("Pari perdu ❌");
  updateUI();
}

function renderBets() {
  renderAvailableBets();
  renderActiveBets();
  renderWonBets();
  renderLostBets();
}

function renderAvailableBets() {
  let container = document.getElementById("availableBets");
  container.innerHTML = "";

  availableBets.forEach((bet, index) => {
    let optionsHTML = "";

    bet.options.forEach(option => {
      optionsHTML += `<button onclick="placeBet(${bet.id}, '${option}')">${option}</button>`;
    });

    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>Mise libre 💎</span>
        </div>
        <div class="bet-title">${bet.title}</div>
        <div class="bet-options ${bet.options.length === 2 ? "two" : ""}">
          ${optionsHTML}
        </div>
      </div>
    `;

    if ((index + 1) % 4 === 0) {
      container.innerHTML += `
        <div class="ad-placeholder">
          <small>Annonce sponsorisée</small>
          <p>Emplacement pour une future vraie publicité fixe.</p>
        </div>
      `;
    }
  });
}

function renderActiveBets() {
  let container = document.getElementById("activeBets");
  container.innerHTML = "";

  if (activeBets.length === 0) {
    container.innerHTML = `<div class="empty">Aucun pari actif pour le moment.</div>`;
    return;
  }

  activeBets.forEach(bet => {
    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>${bet.amount} 💎 misés</span>
        </div>
        <div class="bet-title">${bet.title}</div>
        <p>Ton choix : <strong>${bet.choice}</strong></p>

        <div class="result-buttons">
          <button onclick="markBetWon(${bet.id})">Simuler gagné</button>
          <button onclick="markBetLost(${bet.id})">Simuler perdu</button>
        </div>
      </div>
    `;
  });
}

function renderWonBets() {
  let container = document.getElementById("wonBets");
  container.innerHTML = "";

  if (wonBets.length === 0) {
    container.innerHTML = `<div class="empty">Aucun pari gagné pour le moment.</div>`;
    return;
  }

  wonBets.forEach(bet => {
    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>+${bet.gain} 🪙</span>
        </div>
        <div class="bet-title">${bet.title}</div>
        <p>Choix : <strong>${bet.choice}</strong></p>
        <p>Mise : ${bet.amount} 💎</p>
      </div>
    `;
  });
}

function renderLostBets() {
  let container = document.getElementById("lostBets");
  container.innerHTML = "";

  if (lostBets.length === 0) {
    container.innerHTML = `<div class="empty">Aucun pari perdu pour le moment.</div>`;
    return;
  }

  lostBets.forEach(bet => {
    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>Perdu ❌</span>
        </div>
        <div class="bet-title">${bet.title}</div>
        <p>Choix : <strong>${bet.choice}</strong></p>
        <p>Mise perdue : ${bet.amount} 💎</p>
      </div>
    `;
  });
}

window.onload = function () {
  const savedUser = localStorage.getItem("procoin_current_user");

  if (savedUser) {
    currentUser = savedUser;
    loadUserData();
    showApp();
  }
};