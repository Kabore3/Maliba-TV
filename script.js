// --- Code d’abonnement simulé ---
const codeValide = "SPORT2025"; // à changer comme tu veux

// --- Listes de chaînes ---
const chaines = {
  sport: [
    { nom: "Canal+ Sport", flux: "https://exemple.com/sport1.m3u8" },
    { nom: "beIN Sports", flux: "https://exemple.com/sport2.m3u8" },
  ],
  doc: [
    { nom: "National Geographic", flux: "https://exemple.com/doc1.m3u8" },
    { nom: "Discovery", flux: "https://exemple.com/doc2.m3u8" },
  ],
  anime: [
    { nom: "Toonami", flux: "https://exemple.com/anime1.m3u8" },
    { nom: "Animax", flux: "https://exemple.com/anime2.m3u8" },
  ]
};

// --- Vérification du code ---
function verifierCode() {
  const code = document.getElementById("codeInput").value.trim();
  const msg = document.getElementById("message");
  if (code === codeValide) {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("contenu").classList.remove("hidden");
  } else {
    msg.textContent = "❌ Code invalide !";
    msg.style.color = "red";
  }
}

// --- Afficher les chaînes selon la catégorie ---
function afficherCategorie(cat) {
  const zone = document.getElementById("listeChaines");
  zone.innerHTML = "";
  chaines[cat].forEach(ch => {
    const div = document.createElement("div");
    div.innerHTML = `<h4>${ch.nom}</h4>
                     <video width="300" controls>
                       <source src="${ch.flux}" type="application/x-mpegURL">
                     </video>`;
    zone.appendChild(div);
  });
}

