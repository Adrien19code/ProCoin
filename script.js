const SUPABASE_URL = "https://gynanrnvgwwpussgkzjh.supabase.co";
const SUPABASE_KEY = "sb_publishable__SIIelDhxaZnUXDxMWOX1A_JAW1ZmHh";

const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;

let coins = 0;
let diamonds = 100;
let adsWatchedToday = 0;
let maxAdsPerDay = 10;

let activeBets = [];
let wonBets = [];
let lostBets = [];

let availableBets = [];

function usernameToEmail(username) {
  return username.toLowerCase().trim() + "@procoin.com";
}

async function loadBetsFromSupabase() {
  const { data, error } = await supabaseClient
    .from("bets")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Erreur Supabase :", error);
    return;
  }

  availableBets = data || [];
  renderBets();
  renderAdminBets();
}

async function register() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!username || !password) {
    alert("Entre un pseudo et un mot de passe.");
    return;
  }

  const email = usernameToEmail(username);

  const { data, error } = await supabaseClient.auth.signUp({
    email: email,
    password: password
  });

  if (error) {
    console.error(error);
    alert("Erreur création compte : " + error.message);
    return;
  }

  let user = data.user;

  if (!user) {
    const loginResult = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (loginResult.error) {
      console.error(loginResult.error);
      alert("Compte créé, mais connexion impossible.");
      return;
    }

    const userResult = await supabaseClient.auth.getUser();
    user = userResult.data.user;
  }

  const { error: profileError } = await supabaseClient
    .from("profiles")
    .insert([
      {
        id: user.id,
        username: username,
        coins: 0,
        diamonds: 100,
        ads_watched_today: 0,
        active_bets: [],
        won_bets: [],
        lost_bets: []
      }
    ]);

  if (profileError) {
    console.error(profileError);
    alert("Erreur profil : pseudo déjà utilisé ou profil impossible à créer.");
    return;
  }

  alert("Compte créé ✅");
  await login();
}

async function login() {
  const username = document.getElementById("usernameInput").value.trim();
  const password = document.getElementById("passwordInput").value.trim();

  if (!username || !password) {
    alert("Entre ton pseudo et ton mot de passe.");
    return;
  }

  const email = usernameToEmail(username);

  const { error } = await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if (error) {
    console.error(error);
    alert("Pseudo ou mot de passe incorrect.");
    return;
  }

  await loadUserData();
  showApp();
}

async function logout() {
  await saveCurrentUserData();
  await supabaseClient.auth.signOut();

  currentUser = null;

  document.getElementById("authScreen").classList.remove("hidden");
  document.getElementById("app").classList.add("hidden");
  document.getElementById("bottomNav").classList.add("hidden");
}

async function loadUserData() {
  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) return;

  const { data, error } = await supabaseClient
    .from("profiles")
    .select("*")
    .eq("id", userData.user.id)
    .single();

  if (error) {
    console.error(error);
    alert("Erreur chargement profil.");
    return;
  }

  currentUser = data.username;

  coins = data.coins || 0;
  diamonds = data.diamonds || 100;
  adsWatchedToday = data.ads_watched_today || 0;

  activeBets = data.active_bets || [];
  wonBets = data.won_bets || [];
  lostBets = data.lost_bets || [];
}

async function saveCurrentUserData() {
  const { data: userData } = await supabaseClient.auth.getUser();

  if (!userData.user) return;

  const { error } = await supabaseClient
    .from("profiles")
    .update({
      coins: coins,
      diamonds: diamonds,
      ads_watched_today: adsWatchedToday,
      active_bets: activeBets,
      won_bets: wonBets,
      lost_bets: lostBets
    })
    .eq("id", userData.user.id);

  if (error) {
    console.error("Erreur sauvegarde profil :", error);
  }
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
  loadBetsFromSupabase();
}


function updateUI() {
  document.getElementById("coinsTop").innerText = "🪙 " + coins;
  document.getElementById("diamondsTop").innerText = "💎 " + diamonds;

  const coinsHome = document.getElementById("coinsHome");
  const diamondsHome = document.getElementById("diamondsHome");

  if (coinsHome) coinsHome.innerText = coins;
  if (diamondsHome) diamondsHome.innerText = diamonds;

  document.getElementById("adsText").innerText =
    "Pubs restantes aujourd'hui : " + (maxAdsPerDay - adsWatchedToday) + "/" + maxAdsPerDay;

  const wheelText = document.getElementById("wheelText");

  if (wheelText && currentUser) {
    const today = new Date().toDateString();
    const used = localStorage.getItem("procoin_wheel_date_" + currentUser) === today;

    wheelText.innerText = used
      ? "Roue déjà utilisée aujourd'hui ❌"
      : "Roue disponible aujourd'hui ✅";
  }

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

function spinWheel() {
  const today = new Date().toDateString();
  const wheelKey = "procoin_wheel_date_" + currentUser;

  if (localStorage.getItem(wheelKey) === today) {
    alert("Tu as déjà tourné la roue aujourd'hui.");
    return;
  }

  const wheel = document.getElementById("wheel");

  if (!wheel) {
    alert("Roue introuvable.");
    return;
  }

  const rewards = [10, 20, 30, 50, 75, 100];

  const rewardIndex = Math.floor(Math.random() * rewards.length);
  const reward = rewards[rewardIndex];

  const segmentAngle = 360 / rewards.length;
  const stopAngle = 360 - (rewardIndex * segmentAngle + segmentAngle / 2);

  const extraTurns = 360 * 6;
  const finalRotation = extraTurns + stopAngle;

  wheel.classList.add("spinning");
  wheel.style.transform = `rotate(${finalRotation}deg)`;

  setTimeout(() => {
    diamonds += reward;

    localStorage.setItem(wheelKey, today);

    alert("🎡 Bravo ! Tu gagnes " + reward + " diamants 💎");

    wheel.classList.remove("spinning");

    updateUI();
  }, 4200);
}

function hasAlreadyPlayed(betId) {
  return (
    activeBets.some(bet => bet.originalBetId === betId) ||
    wonBets.some(bet => bet.originalBetId === betId) ||
    lostBets.some(bet => bet.originalBetId === betId)
  );
}

function placeBet(betId, choice) {
  const bet = availableBets.find(item => item.id === betId);

  if (!bet || bet.closed) {
    alert("Ce pari est terminé.");
    return;
  }

  if (hasAlreadyPlayed(betId)) {
    alert("Tu as déjà parié sur ce pari.");
    return;
  }

  let amount = prompt(
    "Combien de diamants veux-tu miser ?\nTu as " +
    diamonds +
    " diamants."
  );

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

async function createBet() {
  const title = document.getElementById("adminTitle").value.trim();
  const category = document.getElementById("adminCategory").value.trim();
  const resultDate = document.getElementById("adminDate").value.trim();

  const options = ["Oui", "Non"];

  if (!title || !category || !resultDate) {
    alert("Remplis le titre, la catégorie et la date.");
    return;
  }

  const { error } = await supabaseClient
    .from("bets")
    .insert([
      {
        title: title,
        category: category,
        result_date: resultDate,
        options: options,
        closed: false
      }
    ]);

  if (error) {
    console.error(error);
    alert("Erreur création pari.");
    return;
  }

  document.getElementById("adminTitle").value = "";
  document.getElementById("adminCategory").value = "";
  document.getElementById("adminDate").value = "";

  alert("Pari créé ✅");

  await loadBetsFromSupabase();
}

async function validateBet(betId) {
  const bet = availableBets.find(item => item.id === betId);

  if (!bet) return;

  if (bet.closed) {
    alert("Ce résultat est déjà validé définitivement.");
    return;
  }

  const result = prompt("Résultat gagnant ?\nChoix possibles : " + bet.options.join(", "));

  if (!result || !bet.options.includes(result)) {
    alert("Résultat invalide.");
    return;
  }

  const confirmation = confirm(
    "Confirmer définitivement ce résultat ?\n\n" +
    "Pari : " + bet.title + "\n" +
    "Résultat : " + result + "\n\n" +
    "Attention : tu ne pourras plus le modifier."
  );

  if (!confirmation) return;

  const { error } = await supabaseClient
    .from("bets")
    .update({
      closed: true,
      result: result
    })
    .eq("id", betId)
    .eq("closed", false);

  if (error) {
    console.error(error);
    alert("Erreur validation résultat.");
    return;
  }

  const { data: profiles, error: profilesError } = await supabaseClient
    .from("profiles")
    .select("*");

  if (profilesError) {
    console.error(profilesError);
    alert("Résultat validé, mais erreur distribution des gains.");
    await loadBetsFromSupabase();
    updateUI();
    return;
  }

  for (const profile of profiles) {
    const profileActiveBets = profile.active_bets || [];
    const profileWonBets = profile.won_bets || [];
    const profileLostBets = profile.lost_bets || [];

    const remainingActiveBets = [];
    let newCoins = profile.coins || 0;
    let changed = false;

    profileActiveBets.forEach(userBet => {
      if (userBet.originalBetId === betId) {
        changed = true;

        if (userBet.choice === result) {
          const gain = userBet.amount * 2;
          newCoins += gain;
          profileWonBets.push({ ...userBet, gain: gain });
        } else {
          profileLostBets.push(userBet);
        }
      } else {
        remainingActiveBets.push(userBet);
      }
    });

    if (changed) {
      await supabaseClient
        .from("profiles")
        .update({
          coins: newCoins,
          active_bets: remainingActiveBets,
          won_bets: profileWonBets,
          lost_bets: profileLostBets
        })
        .eq("id", profile.id);
    }
  }

  if (currentUser) {
    await loadUserData();
  }

  alert("Résultat validé définitivement ✅");

  await loadBetsFromSupabase();
  updateUI();
}

async function deleteBet(betId) {
  const bet = availableBets.find(item => item.id === betId);

  if (bet && bet.closed) {
    alert("Impossible de supprimer un pari déjà validé.");
    return;
  }

  if (!confirm("Supprimer ce pari ? Les joueurs seront remboursés.")) return;

  const { data: profiles, error: profilesError } = await supabaseClient
    .from("profiles")
    .select("*");

  if (profilesError) {
    console.error(profilesError);
    alert("Erreur récupération profils.");
    return;
  }

  for (const profile of profiles) {
    const profileActiveBets = profile.active_bets || [];

    const remainingActiveBets = [];
    let newDiamonds = profile.diamonds || 0;
    let changed = false;

    profileActiveBets.forEach(userBet => {
      if (userBet.originalBetId === betId) {
        changed = true;
        newDiamonds += userBet.amount;
      } else {
        remainingActiveBets.push(userBet);
      }
    });

    if (changed) {
      await supabaseClient
        .from("profiles")
        .update({
          diamonds: newDiamonds,
          active_bets: remainingActiveBets
        })
        .eq("id", profile.id);
    }
  }

  const { error } = await supabaseClient
    .from("bets")
    .delete()
    .eq("id", betId)
    .eq("closed", false);

  if (error) {
    console.error(error);
    alert("Erreur suppression pari.");
    return;
  }

  if (currentUser) {
    await loadUserData();
  }

  alert("Pari supprimé et mises remboursées ✅");

  await loadBetsFromSupabase();
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
    const alreadyPlayed = hasAlreadyPlayed(bet.id);

    let optionsHTML = "";

    if (alreadyPlayed) {
      optionsHTML = `<div class="already-played">Pari déjà placé ✅</div>`;
    } else {
      bet.options.forEach(option => {
        optionsHTML += `<button onclick="placeBet(${bet.id}, '${option}')">${option}</button>`;
      });
    }

    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>Mise libre 💎</span>
        </div>

        <div class="result-date">📅 Résultat : ${bet.result_date || "Date à définir"}</div>

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
    const actions = bet.closed
      ? `
        <div class="already-played">
          ✅ Résultat validé : ${bet.result}
        </div>
      `
      : `
        <div class="result-buttons">
          <button onclick="validateBet(${bet.id})">Valider résultat</button>
          <button onclick="deleteBet(${bet.id})">Supprimer</button>
        </div>
      `;

    container.innerHTML += `
      <div class="bet-card">
        <div class="bet-top">
          <span>${bet.category}</span>
          <span>${bet.closed ? "Terminé" : "Ouvert"}</span>
        </div>

        <div class="result-date">📅 Résultat prévu : ${bet.result_date || "Date à définir"}</div>

        <div class="bet-title">${bet.title}</div>

        <p>Choix : ${bet.options.join(", ")}</p>
        <p>Résultat : ${bet.result || "Non validé"}</p>

        ${actions}
      </div>
    `;
  });
}

window.onload = async function () {
  const { data } = await supabaseClient.auth.getSession();

  if (data.session) {
    await loadUserData();
    showApp();
  }

  loadBetsFromSupabase();
};