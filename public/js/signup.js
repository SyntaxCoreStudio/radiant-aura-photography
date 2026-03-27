import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYIyN8Wnao-QcoiQ898rJQfnZX-c4Q97Y",
  authDomain: "radiant-aura-photography.firebaseapp.com",
  projectId: "radiant-aura-photography",
  storageBucket: "radiant-aura-photography.firebasestorage.app",
  messagingSenderId: "84953777428",
  appId: "1:84953777428:web:6b216b4664b9175c292e01",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

const signupForm = document.getElementById("signup-form");
const signupSuccessModal = document.getElementById("signupSuccessModal");
const closeSignupSuccessBtn = document.getElementById("closeSignupSuccessBtn");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("signup-email").value;
  const password = document.getElementById("signup-password").value;

  try {
    await createUserWithEmailAndPassword(auth, email, password);

    // Show success modal
    signupSuccessModal.style.display = "flex";
    signupSuccessModal.setAttribute("aria-hidden", "false");
  } catch (error) {
    alert("Error: " + error.message);
  }
});

// Close modal and redirect to login page
closeSignupSuccessBtn.addEventListener("click", () => {
  signupSuccessModal.style.display = "none";
  signupSuccessModal.setAttribute("aria-hidden", "true");
  window.location.href = "client-login.html"; // Redirect after closing modal
});

// Close modal if clicked outside modal content
signupSuccessModal.addEventListener("click", (e) => {
  if (e.target === signupSuccessModal) {
    signupSuccessModal.style.display = "none";
    signupSuccessModal.setAttribute("aria-hidden", "true");
    window.location.href = "client-login.html";
  }
});

// Close modal on Escape key press
window.addEventListener("keydown", (e) => {
  if (e.key === "Escape" && signupSuccessModal.style.display === "flex") {
    signupSuccessModal.style.display = "none";
    signupSuccessModal.setAttribute("aria-hidden", "true");
    window.location.href = "client-login.html";
  }
});

// Hamburger menu toggle (if you need it)
const hamburger = document.getElementById("hamburger");
const navMenu = document.getElementById("navMenu");
if (hamburger && navMenu) {
  hamburger.addEventListener("click", () => {
    navMenu.classList.toggle("show");
    const icon = hamburger.querySelector("i");
    icon.classList.toggle("fa-bars");
    icon.classList.toggle("fa-times");
  });
}
