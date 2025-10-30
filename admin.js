let adminToken = localStorage.getItem("adminToken") || null;

function setLoggedInState() {
  document.getElementById("loginSection").classList.add("hidden");
  document.getElementById("adminDashboard").classList.remove("hidden");
}

function setLoggedOutState() {
  localStorage.removeItem("adminToken");
  adminToken = null;
  document.getElementById("loginSection").classList.remove("hidden");
  document.getElementById("adminDashboard").classList.add("hidden");
}

// Connexion admin
document.getElementById("loginBtn").addEventListener("click", async () => {
  const password = document.getElementById("adminPassInput").value.trim();
  const msg = document.getElementById("loginMsg");
  if (!password) return msg.textContent = "❌ Entrez le mot de passe";

  try {
    const res = await fetch("/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password }),
    });
    const data = await res.json();
    if (res.ok && data.success) {
      adminToken = data.token;
      localStorage.setItem("adminToken", adminToken);
      msg.textContent = "";
      setLoggedInState();
      document.getElementById("loadCodesBtn").click();
    } else {
      msg.textContent = "❌ " + (data.error || "Mot de passe incorrect");
    }
  } catch (err) {
    msg.textContent = "❌ Erreur de connexion au serveur";
  }
});

// Génération, révocation et export de codes
document.getElementById("generateBtn").addEventListener("click", async () => {
  if (!adminToken) return alert("Connectez-vous d'abord");
  const ttl = document.getElementById("ttlInput").value.trim() || "1h";
  let count = Math.min(Math.max(parseInt(document.getElementById("countInput").value) || 1, 1), 100);
  let length = Math.min(Math.max(parseInt(document.getElementById("lengthInput").value) || 8, 4), 32);
  try {
    const res = await fetch("/codes", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ ttl, count, length }),
    });
    const data = await res.json();
    document.getElementById("generateMsg").textContent = data.success
      ? "✅ Codes générés : " + data.created.map(c => c.code).join(", ")
      : "❌ Erreur génération";
    document.getElementById("loadCodesBtn").click();
  } catch {
    document.getElementById("generateMsg").textContent = "❌ Erreur serveur";
  }
});

document.getElementById("revokeBtn").addEventListener("click", async () => {
  if (!adminToken) return alert("Connectez-vous d'abord");
  const code = document.getElementById("revokeInput").value.trim();
  if (!code) return alert("Entrez un code à révoquer");
  try {
    const res = await fetch("/codes/revoke", {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-token": adminToken },
      body: JSON.stringify({ code }),
    });
    const data = await res.json();
    document.getElementById("revokeMsg").textContent = data.success ? "✅ Code révoqué" : "❌ Code non trouvé";
    document.getElementById("loadCodesBtn").click();
  } catch {
    document.getElementById("revokeMsg").textContent = "❌ Erreur serveur";
  }
});

document.getElementById("exportBtn").addEventListener("click", () => {
  if (!adminToken) return alert("Connectez-vous d'abord");
  window.open(`/codes/export?token=${adminToken}`, "_blank");
});

document.getElementById("loadCodesBtn").addEventListener("click", async () => {
  if (!adminToken) return alert("Connectez-vous d'abord");
  try {
    const res = await fetch("/codes", { headers: { "x-admin-token": adminToken } });
    const data = await res.json();
    document.getElementById("codesList").textContent = res.ok
      ? data.codes.map(c => `${c.code} (${c.valid_until || "permanent"})`).join("\n")
      : "❌ Accès refusé";
    if (!res.ok) setLoggedOutState();
  } catch {
    document.getElementById("codesList").textContent = "❌ Erreur serveur";
  }
});

// Auto-login si token valide
if (adminToken) setLoggedInState();

