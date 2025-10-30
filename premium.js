// premium.js

// --- Adresse du backend ---
// Remplace par l'URL publique de ton serveur Node.js (Render, Railway, Vercel)
const API_BASE = "https://mon-backend-maliba.onrender.com";

// --- Sélecteurs ---
const codeInput = document.getElementById("abonnementCode");
const validateBtn = document.getElementById("validateCodeBtn");
const accessMsg = document.getElementById("accessMessage");
const categoryButtons = document.getElementById("categoryButtons");

// --- Vérifier le token existant ---
const savedToken = localStorage.getItem("premiumToken");
if (savedToken) verifyToken(savedToken);

// --- Vérification du code premium ---
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

    if (!res.ok) throw new Error("Erreur serveur");

    const data = await res.json();
    if (!data.success) return showStatus("❌ Code invalide ou expiré", true);

    const token = data.token;
    localStorage.setItem("premiumToken", token);

    await verifyToken(token);

  } catch (err) {
    console.error(err);
    showStatus("⚠️ Impossible de contacter le serveur", true);
  }
});

// --- Vérification du token JWT auprès du backend ---
async function verifyToken(token) {
  try {
    const res = await fetch(`${API_BASE}/codes/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token })
    });

    if (!res.ok) throw new Error("Erreur serveur");

    const data = await res.json();
    if (!data.valid) {
      localStorage.removeItem("premiumToken");
      categoryButtons.style.display = "none";
      return showStatus("❌ Code expiré ou invalide", true);
    }

    showStatus(`✅ Accès Premium actif jusqu’au ${formatDate(data.valid_until)}`);
    categoryButtons.style.display = "flex";
    document.body.classList.add("premium-active");

  } catch (err) {
    console.error(err);
    showStatus("⚠️ Impossible de vérifier le token", true);
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
