const SUPABASE_URL = "https://gynanrnvgwwpussgkzjh.supabase.co";

const SUPABASE_KEY = "sb_publishable__SIIelDhxaZnUXDxMWOX1A_JAW1ZmHh";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;

let coins = 0;
let diamonds = 100;
let adsWatchedToday = 0;
let maxAdsPerDay = 10;

let availableBets = JSON.parse(localStorage.getItem("procoin_available_bets")) || [
  { id: 1, category: "Football", title: "PSG vs Marseille", options: ["PSG", "Nul", "OM"], closed: false },
  { id: 2, category: "Basket", title: "Lakers vs Celtics", options: ["Lakers", "Nul", "Celtics"], closed: false },
  { id: 3, category: "Gaming", title: "GTA 6 sortira-t-il en 2026 ?", options: ["Oui", "Non"], closed: false },
  { id: 4, category: "Cinéma", title: "Le prochain Marvel sera numéro 1 ?", options: ["Oui", "Non"], closed: false },
  { id: 5, category: "Football", title: "Real Madrid vs Barcelone", options: ["Real", "Nul", "Barça"], closed: false },
  { id: 6, category: "Musique", title: "Un artiste français sera top 1 Spotify ?", options: ["Oui", "Non"], closed: false },
  { id: 7, category: "Gaming", title: "La Nintendo Switch 2 dépassera 10M de ventes ?", options: ["Oui", "Non"], closed: false },
  { id: 8, category: "Basket", title: "Warriors vs Bulls", options: ["Warriors", "Nul", "Bulls"], closed: false }
];

let activeBets = [];
let wonBets = [];
let lostBets = [];


async function loadBetsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("bets")
    .select("*");

  if (error) {
    console.error("Erreur Supabase :", error);
    return;
  }

  console.log("Paris récupérés :", data);
}

function getUsers() {
  return JSON.parse(localStorage.getItem("procoin_users")) || {};
}

function saveUsers(users) {
  localStorage.setItem("procoin_users", JSON.stringify(users));
}

function saveAvailableBets() {
  localStorage.setItem("procoin_available_bets", JSON.stringify(availableBets));
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
  adsWatchedToday = user.adsWatchedToday || 0;
  activeBets = user.activeBets || [];
  wonBets = user.wonBets || [];
  lostBets = user.lostBets || [];
}

function saveCurrentUserData() {
  if (!currentUser) return;

  const users = getUsers();

  if (!users[currentUser]) return;

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

  const adminBtn = document.getElementById("adminNavBtn");

  if (currentUser === "admin") {
    adminBtn.classList.remove("hidden");
  } else {
    adminBtn.classList.add("hidden");
  }

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
  renderAdminBets();
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

  if (!bet || bet.closed) {
    alert("Ce pari est terminé.");
    return;
  }

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
    originalBetId: bet.id,
    title: bet.title,
    category: bet.category,
    choice: choice,
    amount: amount
  });

  alert("Pari validé ✅");
  updateUI();
}

function createBet() {
  const title = document.getElementById("adminTitle").value.trim();
  const category = document.getElementById("adminCategory").value.trim();
  const optionsText = document.getElementById("adminOptions").value.trim();

  const options = optionsText.split(",").map(option => option.trim()).filter(option => option !== "");

  if (!title || !category || options.length < 2) {
    alert("Remplis le titre, la catégorie et au moins 2 choix.");
    return;
  }

  availableBets.push({
    id: Date.now(),
    category: category,
    title: title,
    options: options,
    closed: false
  });

  saveAvailableBets();

  document.getElementById("adminTitle").value = "";
  document.getElementById("adminCategory").value = "";
  document.getElementById("adminOptions").value = "";

  alert("Pari créé ✅");
  updateUI();
}

function validateBet(betId) {
  const bet = availableBets.find(item => item.id === betId);

  if (!bet) return;

  const result = prompt("Résultat gagnant ?\nChoix possibles : " + bet.options.join(", "));

  if (!result || !bet.options.includes(result)) {
    alert("Résultat invalide.");
    return;
  }

  bet.closed = true;
  bet.result = result;

  const users = getUsers();

  Object.keys(users).forEach(username => {
    const user = users[username];
    const remainingActiveBets = [];

    user.activeBets.forEach(userBet => {
      if (userBet.originalBetId === betId) {
        if (userBet.choice === result) {
          const gain = userBet.amount * 2;
          user.coins += gain;
          user.wonBets.push({ ...userBet, gain: gain });
        } else {
          user.lostBets.push(userBet);
        }
      } else {
        remainingActiveBets.push(userBet);
      }
    });

    user.activeBets = remainingActiveBets;
  });

  saveUsers(users);
  saveAvailableBets();

  loadUserData();

  alert("Résultat validé ✅");
  updateUI();
}

function deleteBet(betId) {
  if (!confirm("Supprimer ce pari ?")) return;

  availableBets = availableBets.filter(item => item.id !== betId);
  saveAvailableBets();
  updateUI();
}

function renderBets() {
  renderAvailableBets();
  renderActiveBets();
  renderWonBets();
  renderLostBets();
}

function renderAvailableBets() {
  const container = document.getElementById("availableBets");
  container.innerHTML = "";

  const openBets = availableBets.filter(bet => !bet.closed);

  if (openBets.length === 0) {
    container.innerHTML = `<div class="empty">Aucun pari disponible.</div>`;
    return;
  }

  openBets.forEach((bet, index) => {
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
  const container = document.getElementById("activeBets");
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
      </div>
    `;
  });
}

function renderWonBets() {
  const container = document.getElementById("wonBets");
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
  const container = document.getElementById("lostBets");
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

function renderAdminBets() {
  const container = document.getElementById("adminBetsList");

  if (!container) return;

  container.innerHTML = "";

  availableBets.forEach(bet => {
    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>${bet.closed ? "Terminé" : "Ouvert"}</span>
        </div>
        <div class="bet-title">${bet.title}</div>
        <p>Choix : ${bet.options.join(", ")}</p>
        <p>Résultat : ${bet.result || "Non validé"}</p>

        <div class="result-buttons">
          <button onclick="validateBet(${bet.id})">Valider résultat</button>
          <button onclick="deleteBet(${bet.id})">Supprimer</button>
        </div>
      </div>
    `;
  });
}

window.onload = function () {
  
  loadBetsFromSupabase();

  const users = getUsers();

  if (!users["admin"]) {
    users["admin"] = {
      password: "admin123",
      coins: 0,
      diamonds: 100,
      adsWatchedToday: 0,
      activeBets: [],
      wonBets: [],
      lostBets: []
    };

    saveUsers(users);
  }

  const savedUser = localStorage.getItem("procoin_current_user");

  if (savedUser) {
    currentUser = savedUser;
    loadUserData();
    showApp();
  }
};