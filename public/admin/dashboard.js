const logoutBtn = document.getElementById("logoutBtn");
const clientNameInput = document.getElementById("clientName");
const createGalleryBtn = document.getElementById("createGalleryBtn");
const createStatus = document.getElementById("createStatus");

const gallerySelect = document.getElementById("gallerySelect");
const imageInput = document.getElementById("imageInput");
const uploadBtn = document.getElementById("uploadBtn");
const uploadStatus = document.getElementById("uploadStatus");

const uploadProgressBox = document.getElementById("uploadProgressBox");
const uploadProgressText = document.getElementById("uploadProgressText");
const uploadProgressFill = document.getElementById("uploadProgressFill");

const galleryList = document.getElementById("galleryList");

const UPLOAD_BATCH_SIZE = 1;

logoutBtn.addEventListener("click", async () => {
  try {
    const response = await fetch("/admin/logout", {
      method: "POST",
      credentials: "include",
    });

    const result = await readJsonResponse(response);

    if (result.success) {
      window.location.href = "/index.html";
    } else {
      alert(result.message || "Logout failed.");
    }
  } catch (error) {
    console.error("Logout error:", error);
    alert("Something went wrong during logout.");
  }
});

async function readJsonResponse(response) {
  const text = await response.text();
  console.log("Raw response:", text);

  let result;
  try {
    result = JSON.parse(text);
  } catch (error) {
    throw new Error(
      `Server returned non-JSON response (${response.status}): ${text.slice(0, 300)}`,
    );
  }

  if (!response.ok) {
    throw new Error(
      result.message || `Request failed with status ${response.status}`,
    );
  }

  return result;
}

function showUploadProgress() {
  uploadProgressBox.style.display = "block";
}

function hideUploadProgress() {
  uploadProgressBox.style.display = "none";
  uploadProgressText.textContent = "Preparing upload...";
  uploadProgressFill.style.width = "0%";
}

function setUploadProgress(current, total, batchNumber, totalBatches) {
  const percent = total > 0 ? Math.round((current / total) * 100) : 0;
  uploadProgressText.textContent =
    `Uploading image ${current} of ${total} ` +
    `(batch ${batchNumber} of ${totalBatches})`;
  uploadProgressFill.style.width = `${percent}%`;
}

async function loadGalleries() {
  galleryList.innerHTML = "<p>Loading galleries...</p>";
  gallerySelect.innerHTML = '<option value="">Choose a gallery</option>';

  try {
    const response = await fetch("/api/admin/galleries", {
      credentials: "include",
    });

    const result = await readJsonResponse(response);

    if (!result.success) {
      galleryList.innerHTML = "<p>Failed to load galleries.</p>";
      return;
    }

    if (result.galleries.length === 0) {
      galleryList.innerHTML = "<p>No galleries yet.</p>";
      return;
    }

    galleryList.innerHTML = "";

    result.galleries.forEach((gallery) => {
      const option = document.createElement("option");
      option.value = gallery.name;
      option.textContent = `${gallery.name} (${gallery.imageCount})`;
      gallerySelect.appendChild(option);

      const card = document.createElement("div");
      card.className = "gallery-card";

      const folderId = `folder-${gallery.name}`;

      card.innerHTML = `
    <div class="gallery-head">
      <div>
        <strong>📁 ${escapeHtml(gallery.name)}</strong>
        <p style="margin: 0.35rem 0 0 0; color: #666;">
          ${gallery.imageCount} image(s)
        </p>
      </div>

<div class="gallery-actions">
  <button
    class="primary-btn toggle-btn"
    onclick="toggleFolder('${escapeJsString(folderId)}')"
  >
    Open
  </button>

  <button
    class="primary-btn"
    onclick="shareGallery('${escapeJsString(gallery.name)}')"
  >
    Share
  </button>

  <button
    class="secondary-btn"
    onclick="regenerateShareLink('${escapeJsString(gallery.name)}')"
  >
    Regenerate Link
  </button>

  <button
    class="danger-btn"
    onclick="deleteGallery('${escapeJsString(gallery.name)}')"
  >
    Delete
  </button>
</div>

    </div>

    <div id="${folderId}" class="gallery-images" style="display:none;"></div>
  `;

      galleryList.appendChild(card);
    });
  } catch (error) {
    console.error("Load galleries error:", error);
    galleryList.innerHTML = "<p>Something went wrong loading galleries.</p>";
  }
}

createGalleryBtn.addEventListener("click", async () => {
  const clientName = clientNameInput.value.trim();

  if (!clientName) {
    createStatus.textContent = "Please enter a client name.";
    return;
  }

  createGalleryBtn.disabled = true;
  createStatus.textContent = "Creating gallery...";

  try {
    const response = await fetch("/api/admin/galleries", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clientName }),
    });

    const result = await readJsonResponse(response);
    createStatus.textContent = result.message;

    if (result.success) {
      clientNameInput.value = "";
      await loadGalleries();
    }
  } catch (error) {
    console.error("Create gallery error:", error);
    createStatus.textContent =
      error.message || "Something went wrong creating the gallery.";
  } finally {
    createGalleryBtn.disabled = false;
  }
});

uploadBtn.addEventListener("click", async () => {
  const clientName = gallerySelect.value;
  const files = Array.from(imageInput.files);

  if (!clientName) {
    uploadStatus.textContent = "Please select a gallery.";
    return;
  }

  if (!files.length) {
    uploadStatus.textContent = "Please choose at least one image.";
    return;
  }

  uploadBtn.disabled = true;
  uploadStatus.textContent = `Preparing ${files.length} image(s) for upload...`;
  showUploadProgress();

  try {
    const totalBatches = Math.ceil(files.length / UPLOAD_BATCH_SIZE);

    for (let i = 0; i < files.length; i += UPLOAD_BATCH_SIZE) {
      const batchNumber = Math.floor(i / UPLOAD_BATCH_SIZE) + 1;
      const batchFiles = files.slice(i, i + UPLOAD_BATCH_SIZE);

      const formData = new FormData();
      formData.append("clientName", clientName);

      for (const file of batchFiles) {
        formData.append("images", file);
      }

      setUploadProgress(
        Math.min(i + batchFiles.length, files.length),
        files.length,
        batchNumber,
        totalBatches,
      );

      const response = await fetch("/api/admin/upload", {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      const result = await readJsonResponse(response);

      if (!result.success) {
        throw new Error(result.message || `Batch ${batchNumber} failed.`);
      }
    }

    uploadProgressFill.style.width = "100%";
    uploadProgressText.textContent = `Upload finished. ${files.length} of ${files.length} image(s) uploaded.`;
    uploadStatus.textContent = `Upload complete. ${files.length} image(s) uploaded successfully.`;

    imageInput.value = "";
    await loadGalleries();

    setTimeout(() => {
      hideUploadProgress();
    }, 900);
  } catch (error) {
    console.error("Upload error:", error);
    uploadStatus.textContent =
      error.message || "Something went wrong during upload.";
    hideUploadProgress();
  } finally {
    uploadBtn.disabled = false;
  }
});

async function deleteImage(clientName, filename) {
  const confirmed = confirm(`Delete image "${filename}" from "${clientName}"?`);
  if (!confirmed) return;

  try {
    const response = await fetch("/api/admin/images", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clientName, filename }),
    });

    const result = await readJsonResponse(response);

    if (result.success) {
      await loadGalleries();
    } else {
      alert(result.message || "Delete failed");
    }
  } catch (error) {
    console.error("Delete image error:", error);
    alert(error.message || "Something went wrong deleting the image.");
  }
}

async function deleteGallery(clientName) {
  const confirmed = confirm(
    `Delete the whole gallery "${clientName}"?\n\nThis will remove all images in that folder.`,
  );
  if (!confirmed) return;

  try {
    const response = await fetch("/api/admin/galleries", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clientName }),
    });

    const result = await readJsonResponse(response);

    if (result.success) {
      uploadStatus.textContent = "";
      createStatus.textContent = result.message || "Gallery deleted.";
      await loadGalleries();
    } else {
      alert(result.message || "Failed to delete gallery.");
    }
  } catch (error) {
    console.error("Delete gallery error:", error);
    alert(error.message || "Something went wrong deleting the gallery.");
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function escapeJsString(value) {
  return String(value)
    .replaceAll("\\", "\\\\")
    .replaceAll("'", "\\'")
    .replaceAll('"', '\\"');
}

async function toggleFolder(folderId) {
  const container = document.getElementById(folderId);
  if (!container) return;

  const button = container
    .closest(".gallery-card")
    .querySelector(".toggle-btn");

  const isOpen = window.getComputedStyle(container).display !== "none";

  if (isOpen) {
    container.style.display = "none";
    button.textContent = "Open";
    return;
  }

  button.textContent = "Close";

  if (container.dataset.loaded === "true") {
    container.style.display = "grid";
    return;
  }

  container.innerHTML = "<p>Loading images...</p>";
  container.style.display = "block";

  try {
    const response = await fetch("/api/admin/galleries", {
      credentials: "include",
    });

    const result = await readJsonResponse(response);

    const galleryName = folderId.replace("folder-", "");
    const gallery = result.galleries.find((g) => g.name === galleryName);

    if (!gallery) {
      container.innerHTML = "<p>Gallery not found.</p>";
      return;
    }

    if (gallery.images.length === 0) {
      container.innerHTML = "<p>No images found.</p>";
      container.dataset.loaded = "true";
      return;
    }

    container.innerHTML = gallery.images
      .map(
        (image) => `
          <div class="image-card">
            <img src="${image.url}" alt="${escapeHtml(image.filename)}">
            <div class="image-card-footer">
              <button
                class="delete-btn"
                onclick="deleteImage('${escapeJsString(gallery.name)}', '${escapeJsString(image.filename)}')"
              >
                Delete Image
              </button>
            </div>
          </div>
        `,
      )
      .join("");

    container.dataset.loaded = "true";
    container.style.display = "grid";
  } catch (error) {
    console.error("Load folder error:", error);
    container.innerHTML = "<p>Failed to load images.</p>";
  }
}

async function shareGallery(clientName) {
  try {
    const response = await fetch("/api/admin/share-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clientName }),
    });

    const result = await readJsonResponse(response);

    if (!result.success || !result.shareUrl) {
      throw new Error(result.message || "Failed to create share link.");
    }

    await navigator.clipboard.writeText(result.shareUrl);
    alert(`Share link copied:\n\n${result.shareUrl}`);
  } catch (error) {
    console.error("Share gallery error:", error);

    if (error.message) {
      alert(error.message);
      return;
    }

    alert("Something went wrong creating the share link.");
  }
}

async function regenerateShareLink(clientName) {
  const confirmed = confirm(
    `Regenerate the share link for "${clientName}"?\n\nThe old link will stop working.`,
  );

  if (!confirmed) return;

  try {
    const response = await fetch("/api/admin/regenerate-share-link", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      credentials: "include",
      body: JSON.stringify({ clientName }),
    });

    const result = await readJsonResponse(response);

    if (!result.success || !result.shareUrl) {
      throw new Error(result.message || "Failed to regenerate share link.");
    }

    await navigator.clipboard.writeText(result.shareUrl);
    alert(`New share link copied:\n\n${result.shareUrl}`);
  } catch (error) {
    console.error("Regenerate share link error:", error);
    alert(error.message || "Something went wrong regenerating the share link.");
  }
}

loadGalleries();
window.deleteImage = deleteImage;
window.deleteGallery = deleteGallery;
window.toggleFolder = toggleFolder;
window.shareGallery = shareGallery;
window.regenerateShareLink = regenerateShareLink;
