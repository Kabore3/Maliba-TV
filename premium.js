// premium-secure.js
const API_BASE = "http://localhost:3000"; // à adapter selon ton serveur

// --- Sélecteurs ---
const codeInput = document.getElementById("abonnementCode");
const validateBtn = document.getElementById("validateCodeBtn");
const accessMsg = document.getElementById("accessMessage");
const categoryButtons = document.getElementById("categoryButtons");

const savedToken = localStorage.getItem("premiumToken");
if (savedToken) verifyToken(savedToken);

// --- Vérification du code ---
validateBtn.addEventListener("click", async () => {
  const code = codeInput.value.trim();
  if (!code) return showStatus("❌ Entrez un code d'accès", true);

  showStatus("⏳ Vérification du code...");

  try {
    const res = await fetch(`${API_BASE}/codes/request-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code })
    });
    const data = await res.json();

    if (!data.success) return showStatus("❌ Code invalide ou expiré", true);

    const token = data.token;
    localStorage.setItem("premiumToken", token);

    await verifyToken(token);

  } catch (err) {
    console.error(err);
    showStatus("⚠️ Erreur de connexion au serveur", true);
  }
});

// --- Vérification du token JWT ---
async function verifyToken(token) {
  try {
    const res = await fetch(`${API_BASE}/codes/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });
    const data = await res.json();

    if (!data.valid) {
      localStorage.removeItem("premiumToken");
      categoryButtons.style.display = "none";
      return showStatus("❌ Code expiré ou invalide", true);
    }

    // Token valide : affichage
    showStatus(`✅ Accès Premium actif jusqu’au ${formatDate(data.valid_until)}`);
    categoryButtons.style.display = "flex";
    document.body.classList.add("premium-active");

  } catch (err) {
    console.error(err);
    showStatus("⚠️ Erreur lors de la vérification du code", true);
  }
}

// --- Formatage de date ---
function formatDate(iso) {
  if (!iso) return "∞";
  return new Date(iso).toLocaleString();
}

// --- Affichage d’un message ---
function showStatus(msg, isError = false) {
  accessMsg.textContent = msg;
  accessMsg.style.color = isError ? "red" : "green";
}

