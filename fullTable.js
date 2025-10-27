 // Import the functions you need from the SDKs you need
  import { initializeApp } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-app.js";
 import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";
  // TODO: Add SDKs for Firebase products that you want to use
  // https://firebase.google.com/docs/web/setup#available-libraries

  // Your web app's Firebase configuration
  // For Firebase JS SDK v7.20.0 and later, measurementId is optional
  const firebaseConfig = {
    apiKey: "AIzaSyB1I3pwHK93CiZxSMtF-biFAhadBmRbOO0",
    authDomain: "tablefirestore.firebaseapp.com",
    projectId: "tablefirestore",
    storageBucket: "tablefirestore.firebasestorage.app",
    messagingSenderId: "505196557689",
    appId: "1:505196557689:web:c0b17563da2382f7296ba8",
    measurementId: "G-XLGK2KYV8G"
  };

 // Initialisation Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const etudiantsRef = collection(db, "etudiants");

    // Variables globales
    let etudiants = [];
    let currentPage = 1;
    const itemsPerPage = 5;

    // Références DOM
    const form = document.getElementById("formEtudiant");
    const table = document.getElementById("tableEtudiants");
    const formEdit = document.getElementById("formEdit");
    const modalEdit = new bootstrap.Modal(document.getElementById("modalEdit"));
    const modalAjout = new bootstrap.Modal(document.getElementById("modalAjout"));
    const searchInput = document.getElementById("searchInput");
    const sortSelect = document.getElementById("sortSelect");
    const prevBtn = document.getElementById("prevBtn");
    const nextBtn = document.getElementById("nextBtn");
    const pageInfo = document.getElementById("pageInfo");

    // --- Ajouter un étudiant ---
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const data = {
        prenom: form.prenom.value,
        nom: form.nom.value,
        age: parseInt(form.age.value),
        moyenne: parseFloat(form.moyenne.value),
        estEtudiant: form.estEtudiant.value === "true",
        bloque: false
      };
      await addDoc(etudiantsRef, data);
      alert("Étudiant ajouté avec succès !");
      form.reset();
      modalAjout.hide();
      await chargerEtudiants();
    });

    // --- Charger tous les étudiants ---
    async function chargerEtudiants() {
      const snapshot = await getDocs(etudiantsRef);
      etudiants = snapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));
      afficherEtudiants();
    }

    // --- Afficher étudiants ---
    function afficherEtudiants() {
      const recherche = searchInput.value.toLowerCase();
      let filtres = etudiants.filter(e =>
        e.nom.toLowerCase().includes(recherche) ||
        e.prenom.toLowerCase().includes(recherche)
      );

      const tri = sortSelect.value;
      if (tri === "moyenneDesc") filtres.sort((a, b) => b.moyenne - a.moyenne);
      if (tri === "moyenneAsc") filtres.sort((a, b) => a.moyenne - b.moyenne);
      if (tri === "ageDesc") filtres.sort((a, b) => b.age - a.age);
      if (tri === "ageAsc") filtres.sort((a, b) => a.age - b.age);

      const totalPages = Math.ceil(filtres.length / itemsPerPage);
      if (currentPage > totalPages) currentPage = totalPages || 1;
      const start = (currentPage - 1) * itemsPerPage;
      const pageEtudiants = filtres.slice(start, start + itemsPerPage);

      table.innerHTML = "";
      pageEtudiants.forEach(etu => {
        const tr = document.createElement("tr");
        tr.innerHTML = `
          <td>${etu.prenom}</td>
          <td>${etu.nom}</td>
          <td>${etu.age}</td>
          <td>${etu.moyenne}</td>
          <td>${etu.estEtudiant ? "True" : "False"}</td>
          <td>
            <button class="btn btn-warning btn-sm" onclick="ouvrirModal('${etu.id}', '${etu.prenom}', '${etu.nom}', ${etu.age}, ${etu.moyenne}, ${etu.estEtudiant})">✏</button>
            <button class="btn btn-danger btn-sm" onclick="supprimerEtudiant('${etu.id}')">🗑</button>
            <button class="btn btn-${etu.bloque ? "secondary" : "info"} btn-sm" onclick="bloquerEtudiant('${etu.id}', ${etu.bloque})">
              ${etu.bloque ? "Débloquer" : "Bloquer"}
            </button>
          </td>`;
        table.appendChild(tr);
      });

      // Correction ici
      pageInfo.textContent = `Page ${currentPage} / ${totalPages || 1}`;
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = currentPage === totalPages || totalPages === 0;
    }

    // --- Pagination ---
    prevBtn.addEventListener("click", () => {
      if (currentPage > 1) {
        currentPage--;
        afficherEtudiants();
      }
    });
    nextBtn.addEventListener("click", () => {
      const totalPages = Math.ceil(etudiants.length / itemsPerPage);
      if (currentPage < totalPages) {
        currentPage++;
        afficherEtudiants();
      }
    });

    // --- Recherche et tri instantané ---
    searchInput.addEventListener("input", () => { currentPage = 1; afficherEtudiants(); });
    sortSelect.addEventListener("change", () => { currentPage = 1; afficherEtudiants(); });

    // --- Supprimer ---
    window.supprimerEtudiant = async (id) => {
      await deleteDoc(doc(db, "etudiants", id));
      await chargerEtudiants();
    };

    // --- Bloquer / Débloquer ---
    window.bloquerEtudiant = async (id, etat) => {
      await updateDoc(doc(db, "etudiants", id), { bloque: !etat });
      await chargerEtudiants();
    };

    // --- Ouvrir modal modification ---
    window.ouvrirModal = (id, prenom, nom, age, moyenne, estEtudiant) => {
      document.getElementById("editId").value = id;
      document.getElementById("editPrenom").value = prenom;
      document.getElementById("editNom").value = nom;
      document.getElementById("editAge").value = age;
      document.getElementById("editMoyenne").value = moyenne;
      document.getElementById("editEstEtudiant").value = estEtudiant;
      modalEdit.show();
    };

    // --- Modifier ---
    formEdit.addEventListener("submit", async (e) => {
      e.preventDefault();
      const id = document.getElementById("editId").value;
      const data = {
        prenom: document.getElementById("editPrenom").value,
        nom: document.getElementById("editNom").value,
        age: parseInt(document.getElementById("editAge").value),
        moyenne: parseFloat(document.getElementById("editMoyenne").value),
        estEtudiant: document.getElementById("editEstEtudiant").value === "true",
      };
      await updateDoc(doc(db, "etudiants", id), data);
      modalEdit.hide();
      await chargerEtudiants();
    });

    // --- Initialisation ---
    chargerEtudiants();

