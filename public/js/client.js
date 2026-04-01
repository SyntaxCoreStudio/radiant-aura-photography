const galleryTitle = document.getElementById("galleryTitle");
const statusMessage = document.getElementById("statusMessage");
const clientGalleryGrid = document.getElementById("clientGalleryGrid");

const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

async function readJsonResponse(response) {
  const text = await response.text();

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

function getTokenFromUrl() {
  const params = new URLSearchParams(window.location.search);
  return params.get("token") || "";
}

function openLightbox(imageUrl, imageName) {
  lightboxImage.src = imageUrl;
  lightboxImage.alt = imageName || "Preview image";
  lightbox.classList.remove("hidden");
}

function closeLightbox() {
  lightbox.classList.add("hidden");
  lightboxImage.src = "";
}

lightboxClose.addEventListener("click", closeLightbox);

lightbox.addEventListener("click", (event) => {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeLightbox();
  }
});

async function loadClientGallery() {
  const token = getTokenFromUrl();

  if (!token) {
    galleryTitle.textContent = "No gallery selected";
    statusMessage.textContent = "This link is missing a share token.";
    clientGalleryGrid.innerHTML = "";
    return;
  }

  galleryTitle.textContent = "Client Gallery";
  statusMessage.textContent = "Loading images...";

  try {
    const response = await fetch(
      `/api/client/gallery?token=${encodeURIComponent(token)}`,
    );

    const result = await readJsonResponse(response);

    if (!result.success) {
      statusMessage.textContent = result.message || "Failed to load gallery.";
      clientGalleryGrid.innerHTML = "";
      return;
    }

    galleryTitle.textContent = result.gallery || "Client Gallery";

    if (!result.images || result.images.length === 0) {
      statusMessage.textContent = "No images found in this gallery yet.";
      clientGalleryGrid.innerHTML = "";
      return;
    }

    statusMessage.textContent = `${result.images.length} image(s) found`;

    clientGalleryGrid.innerHTML = result.images
      .map((image) => {
        const imageName = escapeHtml(image.filename);
        const downloadUrl = `/api/client/download?token=${encodeURIComponent(token)}&filename=${encodeURIComponent(image.filename)}`;

        return `
      <article class="client-image-card" data-url="${image.url}" data-name="${imageName}">
        <img src="${image.url}" alt="${imageName}" loading="lazy" />
        <div class="client-image-info">
          <p class="client-image-name">${imageName}</p>
          <a
            class="download-btn"
            href="${downloadUrl}"
          >
            Download
          </a>
        </div>
      </article>
    `;
      })
      .join("");

    const cards = clientGalleryGrid.querySelectorAll(".client-image-card");

    cards.forEach((card) => {
      card.addEventListener("click", (event) => {
        if (event.target.closest(".download-btn")) {
          return;
        }

        const imageUrl = card.dataset.url;
        const imageName = card.dataset.name;
        openLightbox(imageUrl, imageName);
      });
    });
  } catch (error) {
    console.error("Client gallery load error:", error);
    statusMessage.textContent =
      error.message || "Something went wrong loading the gallery.";
    clientGalleryGrid.innerHTML = "";
  }
}

loadClientGallery();
