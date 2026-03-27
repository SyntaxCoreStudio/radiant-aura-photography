// load-family-gallery.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getStorage,
  ref,
  listAll,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

// 🔧 Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBYIyN8Wnao-QcoiQ898rJQfnZX-c4Q97Y",
  authDomain: "radiant-aura-photography.firebaseapp.com",
  projectId: "radiant-aura-photography",
  storageBucket: "radiant-aura-photography.firebasestorage.app",
  messagingSenderId: "84953777428",
  appId: "1:84953777428:web:6b216b4664b9175c292e01",
};

// 🚀 Init Firebase
const app = initializeApp(firebaseConfig);
const storage = getStorage(app);

// 📂 Load from the correct folder
const folderRef = ref(storage, "Gallery/highlights/maternity"); // Match this to the page

const galleryDiv = document.getElementById("gallery");

listAll(folderRef)
  .then((res) => {
    res.items.forEach((itemRef) => {
      getDownloadURL(itemRef).then((url) => {
        const img = document.createElement("img");
        img.src = url;
        galleryDiv.appendChild(img);
      });
    });
  })
  .catch((error) => {
    console.error("Error loading images:", error);
  });
