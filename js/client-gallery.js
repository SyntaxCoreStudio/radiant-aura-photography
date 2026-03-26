import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYIyN8Wnao-QcoiQ898rJQfnZX-c4Q97Y",
  authDomain: "radiant-aura-photography.firebaseapp.com",
  projectId: "radiant-aura-photography",
  storageBucket: "radiant-aura-photography.firebasestorage.app",
  messagingSenderId: "84953777428",
  appId: "1:84953777428:web:6b216b4664b9175c292e01",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);

// DOM elements
const galleryEl = document.getElementById("gallery");
const welcomeMsg = document.getElementById("welcome-msg");
const logoutBtn = document.getElementById("logoutBtn");
const downloadAllBtn = document.getElementById("downloadAllBtn");
const downloadErrorModal = document.getElementById("downloadErrorModal");
const closeDownloadErrorBtn = document.getElementById("closeDownloadErrorBtn");

const logoutConfirmModal = document.getElementById("logoutConfirmModal");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

// Helper to sanitize email for folder name
function sanitizeEmail(email) {
  return email.replace(/\./g, "_dot_").replace(/@/g, "_at_");
}


// Load client images from their folder
async function loadClientGallery(email) {
  const sanitizedEmail = sanitizeEmail(email);
  const clientFolderPath = `client-gallery/${sanitizedEmail}/`;
  const clientRef = ref(storage, clientFolderPath);

  try {
    const res = await listAll(clientRef);

    galleryEl.innerHTML = ""; // Clear previous content

    if (res.items.length === 0) {
      galleryEl.innerHTML = "<p>No images in your gallery yet.</p>";
      return;
    }

    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);

      const wrapper = document.createElement("div");
      wrapper.className = "image-wrapper";

      const img = document.createElement("img");
      img.src = url;
      img.alt = "Gallery Image";

      const downloadBtn = document.createElement("a");
      downloadBtn.textContent = "Download";
      downloadBtn.className = "download-btn";
      downloadBtn.href = url;
      downloadBtn.download = itemRef.name;

      wrapper.appendChild(img);
      galleryEl.appendChild(wrapper);
    }
  } catch (error) {
    console.error("Error loading images:", error);
    galleryEl.innerHTML =
      "<p>Failed to load your images. Please try again later.</p>";
  }
}

// Auth state listener
onAuthStateChanged(auth, (user) => {
  if (!user) {
    window.location.href = "client-login.html";
    return;
  }

  const email = user.email;
  welcomeMsg.textContent = `Logged in as: ${email}`;
  loadClientGallery(email);
});

// Show logout confirmation modal on logout button click
logoutBtn.addEventListener("click", () => {
  logoutConfirmModal.style.display = "flex";
});

// Confirm logout action
confirmLogoutBtn.addEventListener("click", () => {
  signOut(auth)
    .then(() => {
      logoutConfirmModal.style.display = "none";
      sessionStorage.setItem("logged_out", "true");
      window.location.href = "client-login.html";
    })
    .catch((error) => {
      console.error("Logout error:", error);
      alert("Failed to logout. Please try again.");
      logoutConfirmModal.style.display = "none";
    });
});

// Cancel logout and hide modal
cancelLogoutBtn.addEventListener("click", () => {
  logoutConfirmModal.style.display = "none";
});

// Optional: Close modal if clicked outside modal content
logoutConfirmModal.addEventListener("click", (e) => {
  if (e.target === logoutConfirmModal) {
    logoutConfirmModal.style.display = "none";
  }
});

// Optional: Close modal on Escape key press
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && logoutConfirmModal.style.display === "flex") {
    logoutConfirmModal.style.display = "none";
  }
});

// Download all images as ZIP (requires JSZip to be included in your HTML)
downloadAllBtn.addEventListener("click", async () => {
  downloadAllBtn.disabled = true;
  downloadAllBtn.textContent = "Preparing download...";

  try {
    const zip = new JSZip();

    const email = auth.currentUser.email;
    const sanitizedEmail = sanitizeEmail(email);
    const folderPath = `client-gallery/${sanitizedEmail}/`;
    const folderRef = ref(storage, folderPath);

    const res = await listAll(folderRef);

    if (res.items.length === 0) {
      alert("No images to download.");
      downloadAllBtn.disabled = false;
      downloadAllBtn.textContent = "Download All";
      return;
    }

    for (const itemRef of res.items) {
      const url = await getDownloadURL(itemRef);
      const response = await fetch(url);
      const blob = await response.blob();
      zip.file(itemRef.name, blob);
    }

    const content = await zip.generateAsync({ type: "blob" });
    const zipName = `gallery_${sanitizedEmail}.zip`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = zipName;
    document.body.appendChild(link);
    link.click();
    link.remove();
  } catch (error) {
    console.error("Error downloading all images:", error);
    document.getElementById("downloadErrorMsg").textContent =
      "Failed to download images. Please try again later.";
    downloadErrorModal.style.display = "flex";
    downloadErrorModal.setAttribute("aria-hidden", "false");
  }

  downloadAllBtn.disabled = false;
  downloadAllBtn.textContent = "Download All";
});

// Image preview modal
const previewModal = document.getElementById("imagePreviewModal");
const previewImage = document.getElementById("previewImage");

// Open modal when any image is clicked
galleryEl.addEventListener("click", (e) => {
  if (e.target.tagName === "IMG") {
    previewImage.src = e.target.src;
    previewModal.style.display = "flex";
  }
});

// Close modal on click outside or Escape
previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal || e.target === previewImage) {
    previewModal.style.display = "none";
    previewImage.src = "";
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape") {
    previewModal.style.display = "none";
    previewImage.src = "";
  }
});

closeDownloadErrorBtn.addEventListener("click", () => {
  downloadErrorModal.style.display = "none";
  downloadErrorModal.setAttribute("aria-hidden", "true");
});

downloadErrorModal.addEventListener("click", (e) => {
  if (e.target === downloadErrorModal) {
    downloadErrorModal.style.display = "none";
    downloadErrorModal.setAttribute("aria-hidden", "true");
  }
});

window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && downloadErrorModal.style.display === "flex") {
    downloadErrorModal.style.display = "none";
    downloadErrorModal.setAttribute("aria-hidden", "true");
  }
});
