// admin-dashboard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import {
  getAuth,
  onAuthStateChanged,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js";
import {
  getStorage,
  ref,
  uploadBytesResumable,
  listAll,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/9.23.0/firebase-storage.js";

///////////////////////////////
// YOUR FIREBASE CONFIG HERE //
///////////////////////////////
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
const storage = getStorage(app);

//////////////////////////////
// GLOBAL VARIABLES & SELECTORS
//////////////////////////////
const tabs = {
  uploadTabBtn: "upload-section",
  publicTabBtn: "publicGallerySection",
  clientTabBtn: "clientGallerySection",
};

const uploadTogglePanel = document.querySelector(".upload-toggle");

// Tab buttons
const uploadTabBtn = document.getElementById("uploadTabBtn");
const publicTabBtn = document.getElementById("publicTabBtn");
const clientTabBtn = document.getElementById("clientTabBtn");

// Upload toggles and forms
const mainGalleryBtn = document.getElementById("mainGalleryBtn");
const clientGalleryBtn = document.getElementById("clientGalleryBtn");
const mainUploadForm = document.getElementById("mainUploadForm");
const clientUploadForm = document.getElementById("clientUploadForm");

// Main upload inputs
const gallerySelect = document.getElementById("gallerySelect");
const fileInput = document.getElementById("fileInput");
const previewContainer = document.getElementById("previewContainer");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");
const progressContainer = document.getElementById("progressContainer");
const progressBar = document.getElementById("progressBar");
const cancelUploadBtn = document.getElementById("cancelUploadBtn");

// Client upload inputs
const clientEmailInput = document.getElementById("clientEmail");
const clientFileInput = document.getElementById("clientFileInput");
const clientPreviewContainer = document.getElementById(
  "clientPreviewContainer"
);
const uploadClientBtn = document.getElementById("uploadClientBtn");
const clientUploadStatus = document.getElementById("clientUploadStatus");
const clientProgressContainer = document.getElementById(
  "clientProgressContainer"
);
const clientProgressBar = document.getElementById("clientProgressBar");
const cancelClientUploadBtn = document.getElementById("cancelClientUploadBtn");

const mainUploadCounter = document.getElementById("mainUploadCounter");
const clientUploadCounter = document.getElementById("clientUploadCounter");


// Galleries display containers
const publicGalleryGrid = document.getElementById("publicGalleryGrid");
const clientGalleryGrid = document.getElementById("clientGalleryGrid");

// Logout elements
const logoutBtn = document.getElementById("logoutBtn");
const logoutModal = document.getElementById("logoutModal");
const confirmLogoutBtn = document.getElementById("confirmLogoutBtn");
const cancelLogoutBtn = document.getElementById("cancelLogoutBtn");

// Delete modal elements
const deleteConfirmModal = document.getElementById("deleteConfirmModal");
const confirmDeleteBtn = document.getElementById("confirmDeleteBtn");
const cancelDeleteBtn = document.getElementById("cancelDeleteBtn");

const adminEmail = "radiantauraphotography@gmail.com";

// To keep track of current upload task for cancel
let currentUploadTask = null;
let currentClientUploadTask = null;

// To track image to delete on confirmation
let imageToDeleteRef = null;

// --- Utility: Sanitize email for Storage path ---
function sanitizeEmail(email) {
  return email.replace(/\./g, "_dot_").replace(/@/g, "_at_");
}


//////////////////////
// INITIAL UI SETUP //
//////////////////////
function initUI() {
  // Show Upload tab by default
  showTab("uploadTabBtn");

  // Setup tab button event listeners
  Object.keys(tabs).forEach((btnId) => {
    document.getElementById(btnId).addEventListener("click", () => {
      showTab(btnId);
    });
  });

  // Setup upload toggle buttons
  mainGalleryBtn.addEventListener("click", () => {
    mainGalleryBtn.classList.add("toggle-active");
    clientGalleryBtn.classList.remove("toggle-active");
    mainUploadForm.style.display = "block";
    clientUploadForm.style.display = "none";
  });

  clientGalleryBtn.addEventListener("click", () => {
    clientGalleryBtn.classList.add("toggle-active");
    mainGalleryBtn.classList.remove("toggle-active");
    clientUploadForm.style.display = "block";
    mainUploadForm.style.display = "none";
  });

  // Setup file input previews
  fileInput.addEventListener("change", () => {
    showPreview(fileInput.files, previewContainer);
  });
  clientFileInput.addEventListener("change", () => {
    showPreview(clientFileInput.files, clientPreviewContainer);
  });

  // Setup upload buttons
  uploadBtn.addEventListener("click", handleMainUpload);
  uploadClientBtn.addEventListener("click", handleClientUpload);

  // Setup cancel upload buttons
  cancelUploadBtn.addEventListener("click", cancelCurrentUpload);
  cancelClientUploadBtn.addEventListener("click", cancelCurrentClientUpload);

  // Setup logout buttons & modal
  logoutBtn.addEventListener("click", () => {
    logoutModal.classList.add("show");
  });
  cancelLogoutBtn.addEventListener("click", () => {
    logoutModal.classList.remove("show");
  });
  confirmLogoutBtn.addEventListener("click", () => {
    signOut(auth).then(() => {
      window.location.href = "/admin-login.html"; // Redirect after logout
    });
  });

  // Setup delete modal buttons
  cancelDeleteBtn.addEventListener("click", () => {
    deleteConfirmModal.classList.remove("show");
    imageToDeleteRef = null;
  });
  confirmDeleteBtn.addEventListener("click", () => {
    if (!imageToDeleteRef) return;
    deleteImage(imageToDeleteRef);
  });

  // Load galleries initially if needed

  loadClientGalleries();
}

/////////////////////
// AUTH STATE CHECK //
/////////////////////
onAuthStateChanged(auth, (user) => {
  if (user) {
    if (user.email === adminEmail) {
      console.log("Admin logged in:", user.email);
      initUI(); // your function to start the dashboard
    } else {
      // Show modal instead of alert
      const modal = document.getElementById("accessDeniedModal");
      const okBtn = document.getElementById("accessDeniedOkBtn");

      modal.style.display = "flex";
      okBtn.addEventListener("click", () => {
        modal.style.display = "none";
        signOut(auth).then(() => {
          window.location.href = "/client-login.html";
        });
      });
    }
  } else {
    window.location.href = "/admin-login.html"; // if not logged in at all
  }
});

////////////////////////
// SHOW TAB FUNCTION ///
////////////////////////
function showTab(btnId) {
  // Activate tab button, deactivate others
  Object.entries(tabs).forEach(([id, sectionId]) => {
    const btn = document.getElementById(id);
    const section = document.getElementById(sectionId);
    if (id === btnId) {
      btn.classList.add("active");
      section.classList.remove("hidden");
    } else {
      btn.classList.remove("active");
      section.classList.add("hidden");
    }
  });

  // Show/hide upload toggle panel
  if (btnId === "uploadTabBtn") {
    uploadTogglePanel.style.display = "flex";
  } else {
    uploadTogglePanel.style.display = "none";
  }

  // Load galleries on tab switch
  if (btnId === "publicTabBtn") {
    loadPublicGallery();
  }
  if (btnId === "clientTabBtn") {
    loadClientGalleries();
  }
}

///////////////////////
// SHOW IMAGE PREVIEW //
///////////////////////
function showPreview(files, container) {
  container.innerHTML = "";
  Array.from(files).forEach((file) => {
    const img = document.createElement("img");
    img.src = URL.createObjectURL(file);
    img.style.width = "150px";
    img.style.height = "100px";
    img.style.objectFit = "cover";
    img.style.borderRadius = "10px";
    img.style.marginRight = "10px";
    container.appendChild(img);
  });
}

/////////////////////////
// HANDLE MAIN UPLOAD ///
/////////////////////////
function handleMainUpload() {
  if (fileInput.files.length === 0) {
    alert("Please select at least one file to upload.");
    return;
  }

  const category = gallerySelect.value;
  if (!category) {
    alert("Please select a gallery category.");
    return;
  }

  uploadStatus.textContent = "";
  progressContainer.style.display = "block";
  progressBar.style.width = "0%";
  cancelUploadBtn.style.display = "inline-block";
  mainUploadCounter.textContent = "";
  mainUploadCounter.style.display = "block";



  const files = Array.from(fileInput.files);
uploadFilesToStorage(
  files,
  (file) => `Gallery/highlights/${category}/${file.name}`,
  updateMainUploadProgress,
  onMainUploadComplete,
  onUploadError,
  (task) => (currentUploadTask = task),
  (done, total) => {
    mainUploadCounter.textContent = `Uploaded ${done} of ${total} images`;
  }
);
}


///////////////////////////////
// HANDLE CLIENT UPLOAD ///////
///////////////////////////////
function handleClientUpload() {
  const email = clientEmailInput.value.trim();
  if (!email) {
    alert("Please enter a client email.");
    return;
  }
  if (clientFileInput.files.length === 0) {
    alert("Please select at least one file to upload.");
    return;
  }

    clientUploadStatus.textContent = "";
    clientProgressContainer.style.display = "block";
    clientProgressBar.style.width = "0%";
    cancelClientUploadBtn.style.display = "inline-block";
    clientUploadCounter.textContent = "";
    clientUploadCounter.style.display = "block";


  const sanitizedEmail = sanitizeEmail(email);
  const files = Array.from(clientFileInput.files);

uploadFilesToStorage(
  files,
  (file) => `client-gallery/${sanitizedEmail}/${file.name}`,
  updateClientUploadProgress,
  onClientUploadComplete,
  onUploadError,
  (task) => (currentClientUploadTask = task),
  (done, total) => {
    clientUploadCounter.textContent = `Uploaded ${done} of ${total} images`;
  }
);
}


////////////////////////////
// UPLOAD FILES TO STORAGE //
////////////////////////////
function uploadFilesToStorage(
  files,
  getPathFunc,
  onProgress,
  onComplete,
  onError,
  setUploadTask,
  updateCounter
) {
  let completedCount = 0;
  let errorOccurred = false;

  function uploadSingleFile(file, index) {
    return new Promise((resolve, reject) => {
      const path = getPathFunc(file);
      const storageRef = ref(storage, path);
      const uploadTask = uploadBytesResumable(storageRef, file);

      setUploadTask(uploadTask);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress =
            (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          onProgress(progress);
        },
        (error) => {
          errorOccurred = true;
          onError(error);
          reject(error);
        },
        () => {
          completedCount++;
          updateCounter(completedCount, files.length);
          onProgress((completedCount / files.length) * 100);
          resolve();
        }
      );
    });
  }

  Promise.all(files.map(uploadSingleFile))
    .then(() => {
      onComplete();
      setUploadTask(null);
    })
    .catch((error) => {
      console.error("Upload failed:", error);
      setUploadTask(null);
    });
}


///////////////////////////////
// PROGRESS UPDATES & HANDLERS
///////////////////////////////
function updateMainUploadProgress(progress) {
  progressBar.style.width = progress + "%";
}

function updateClientUploadProgress(progress) {
  clientProgressBar.style.width = progress + "%";
}

function onMainUploadComplete() {
  uploadStatus.textContent = "Upload complete!";
  cancelUploadBtn.style.display = "none";
  progressContainer.style.display = "none";
  progressBar.style.width = "0%";
  previewContainer.innerHTML = "";
  fileInput.value = "";
  mainUploadCounter.textContent = "";
  mainUploadCounter.style.display = "none";
}

function onClientUploadComplete() {
  clientUploadStatus.textContent = "Upload complete!";
  cancelClientUploadBtn.style.display = "none";
  clientProgressContainer.style.display = "none";
  clientProgressBar.style.width = "0%";
  clientPreviewContainer.innerHTML = "";
  clientFileInput.value = "";
  clientEmailInput.value = "";
  clientUploadCounter.textContent = "";
  clientUploadCounter.style.display = "none";
  loadClientGalleries();
}

function onUploadError(error) {
  alert("Upload error: " + error.message);
  uploadStatus.textContent = "Upload failed.";
  clientUploadStatus.textContent = "Upload failed.";
  cancelUploadBtn.style.display = "none";
  cancelClientUploadBtn.style.display = "none";
  progressContainer.style.display = "none";
  clientProgressContainer.style.display = "none";
}

/////////////////////////////
// CANCEL UPLOAD FUNCTIONS //
/////////////////////////////
function cancelCurrentUpload() {
  if (currentUploadTask) {
    currentUploadTask.cancel();
    uploadStatus.textContent = "Upload cancelled.";
    progressBar.style.width = "0%";
    progressContainer.style.display = "none";
    cancelUploadBtn.style.display = "none";
    mainUploadCounter.textContent = "";
    mainUploadCounter.style.display = "none";
  }
}

function cancelCurrentClientUpload() {
  if (currentClientUploadTask) {
    currentClientUploadTask.cancel();
    clientUploadStatus.textContent = "Upload cancelled.";
    clientProgressBar.style.width = "0%";
    clientProgressContainer.style.display = "none";
    cancelClientUploadBtn.style.display = "none";
    clientUploadCounter.textContent = "";
    clientUploadCounter.style.display = "none";
  }
}

//////////////////////
// LOAD PUBLIC GALLERY
//////////////////////

async function loadPublicGallery() {
  const galleryDiv = document.getElementById("publicGalleryGrid");
  galleryDiv.innerHTML = "Loading images...";

  const categories = ["family", "maternity", "formal"];
  const shownUrls = new Set();

  try {
    galleryDiv.innerHTML = "";

    for (const category of categories) {
      const folderRef = ref(storage, `Gallery/highlights/${category}`);
      const res = await listAll(folderRef);

      for (const itemRef of res.items) {
        const url = await getDownloadURL(itemRef);

        if (shownUrls.has(url)) continue;
        shownUrls.add(url);

        const wrapper = document.createElement("div");
        wrapper.classList.add("uploaded-image");

        const img = document.createElement("img");
        img.src = url;
        img.alt = category;

        // Optional: Add a label to show which category it came from
        const label = document.createElement("p");
        label.textContent =
          category.charAt(0).toUpperCase() + category.slice(1);
        label.classList.add("image-label"); // style this in your CSS

        // Optional: Add delete button if admin is logged in
        const user = auth.currentUser;
        if (user?.email === "radiantauraphotography@gmail.com") {
          const deleteBtn = document.createElement("button");
          deleteBtn.textContent = "×";
          deleteBtn.classList.add("delete-btn");
          deleteBtn.dataset.path = itemRef.fullPath;

          deleteBtn.addEventListener("click", () => {
            imageToDeleteRef = itemRef;
            deleteConfirmModal.classList.add("show");
          });
          wrapper.appendChild(deleteBtn);
        }

        wrapper.appendChild(img);
        wrapper.appendChild(label);
        galleryDiv.appendChild(wrapper);
      }
    }

    if (!galleryDiv.hasChildNodes()) {
      galleryDiv.innerHTML = "<p>No images found in any gallery.</p>";
    }
  } catch (error) {
    galleryDiv.innerHTML = "<p>Error loading images.</p>";
    console.error("Error loading public gallery:", error);
  }
}

/////////////////////////
// LOAD CLIENT GALLERIES
/////////////////////////
async function loadClientGalleries() {
  clientGalleryGrid.innerHTML = "Loading client galleries...";

  try {
    // List all top level folders inside client-gallery/
    const clientRootRef = ref(storage, "client-gallery/");
    const res = await listAll(clientRootRef);

    if (res.prefixes.length === 0) {
      clientGalleryGrid.innerHTML = "<p>No client galleries found.</p>";
      return;
    }

    clientGalleryGrid.innerHTML = "";

    for (const clientFolderRef of res.prefixes) {
      // Create folder container
      const folderDiv = document.createElement("div");
      folderDiv.className = "client-folder";

      // Folder toggle button
      const folderBtn = document.createElement("button");
      folderBtn.className = "client-folder-toggle";
      folderBtn.textContent = decodeURIComponent(clientFolderRef.name);
      folderBtn.setAttribute("aria-expanded", "false");

      // Container for images (hidden initially)
      const imagesContainer = document.createElement("div");
      imagesContainer.className = "client-images-container";
      imagesContainer.style.display = "none";

      folderBtn.addEventListener("click", async () => {
        const isExpanded = folderBtn.getAttribute("aria-expanded") === "true";
        if (isExpanded) {
          imagesContainer.style.display = "none";
          folderBtn.setAttribute("aria-expanded", "false");
        } else {
          // Load images for this client folder if empty
          if (imagesContainer.children.length === 0) {
            try {
              const listResult = await listAll(clientFolderRef);
              if (listResult.items.length === 0) {
                imagesContainer.innerHTML = "<p>No images found.</p>";
              } else {
                for (const imageRef of listResult.items) {
                  const url = await getDownloadURL(imageRef);
                  const imgWrapper = createImageWrapper(url, imageRef);
                  imagesContainer.appendChild(imgWrapper);
                }
              }
            } catch (error) {
              imagesContainer.innerHTML = "<p>Failed to load images.</p>";
              console.error("Error loading client images:", error);
            }
          }
          imagesContainer.style.display = "flex";
          folderBtn.setAttribute("aria-expanded", "true");
        }
      });

      folderDiv.appendChild(folderBtn);
      folderDiv.appendChild(imagesContainer);
      clientGalleryGrid.appendChild(folderDiv);
    }
  } catch (error) {
    clientGalleryGrid.innerHTML = "<p>Failed to load client galleries.</p>";
    console.error("Error loading client galleries:", error);
  }
}

////////////////////////
// CREATE IMAGE WRAPPER
////////////////////////
function createImageWrapper(imageURL, storageRefObj) {
  const wrapper = document.createElement("div");
  wrapper.className = "uploaded-image";

  const img = document.createElement("img");
  img.src = imageURL;
  img.alt = "Gallery image";

  // Delete button
  const delBtn = document.createElement("button");
  delBtn.className = "delete-btn";
  delBtn.title = "Delete Image";
  delBtn.innerHTML = "&times;";

  delBtn.addEventListener("click", () => {
    imageToDeleteRef = storageRefObj;
    deleteConfirmModal.classList.add("show");
  });

  wrapper.appendChild(img);
  wrapper.appendChild(delBtn);

  return wrapper;
}

///////////////////////
// DELETE IMAGE LOGIC //
///////////////////////
async function deleteImage(storageRefObj) {
  try {
    await deleteObject(storageRefObj);
    deleteConfirmModal.classList.remove("show");
    imageToDeleteRef = null;

    // Refresh galleries depending on active tab
    if (uploadTabBtn.classList.contains("active")) {
      loadPublicGallery();
      loadClientGalleries();
    } else if (publicTabBtn.classList.contains("active")) {
      loadPublicGallery();
    } else if (clientTabBtn.classList.contains("active")) {
      loadClientGalleries();
    }
  } catch (error) {
    alert("Failed to delete image: " + error.message);
    console.error("Delete failed", error);
  }
}
