//carousel and hamburger menu
document.addEventListener("DOMContentLoaded", () => {
  // Carousel images
  const images = [
    "Gallery/highlights/maternity/Image8.jpeg",
    "Gallery/highlights/formal/Image28.jpeg",
    "Gallery/highlights/family/Image18.jpg",
    "Gallery/highlights/family/Image13.jpg",
    "Gallery/highlights/maternity/Image21.jpg",
    "Gallery/highlights/formal/Image26.jpeg",
    "Gallery/highlights/maternity/Image2.jpeg",
  ];

  let index = 0;
  const imageElement = document.getElementById("carousel-image");
  if (imageElement) {
    imageElement.src = images[0];
    setInterval(() => {
      index = (index + 1) % images.length;
      imageElement.src = images[index];
    }, 3000);
  }

  // Hamburger menu toggle
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

  // Static image slideshow rotators
  const rotators = [
    {
      selector: ".maternity-image",
      images: [
        "Gallery/highlights/maternity/Image2.jpeg",
        "Gallery/highlights/maternity/Image3.jpeg",
        "Gallery/highlights/maternity/Image4.jpeg",
        "Gallery/highlights/maternity/Image5.jpeg",
        "Gallery/highlights/maternity/Image8.jpeg",
        "Gallery/highlights/maternity/Image10.jpg",
        "Gallery/highlights/maternity/Image1.jpeg",
        "Gallery/highlights/maternity/Image11.jpg",
        "Gallery/highlights/maternity/Image14.jpg",
        "Gallery/highlights/maternity/Image15.jpg",
        "Gallery/highlights/maternity/Image16.jpg",
        "Gallery/highlights/maternity/Image17.jpg",
        "Gallery/highlights/maternity/Image21.jpg",
        "Gallery/highlights/maternity/Image27.jpeg",
      ],
    },
    {
      selector: ".family-image",
      images: [
        "Gallery/highlights/family/Image7.jpg",
        "Gallery/highlights/family/Image9.jpeg",
        "Gallery/highlights/family/Image13.jpg",
        "Gallery/highlights/family/Image18.jpg",
        "Gallery/highlights/family/Image19.jpg",
        "Gallery/highlights/family/Image20.jpg",
        "Gallery/highlights/family/Image22.jpg",
        "Gallery/highlights/family/Image6.jpg",
        "Gallery/highlights/family/Image23.jpg",
        "Gallery/highlights/family/Image24.jpg",
        "Gallery/highlights/family/Image25.jpg",
        "Gallery/highlights/family/Image12.jpg",
      ],
    },
    {
      selector: ".formal-image",
      images: [
        "Gallery/highlights/formal/Image28.jpeg",
        "Gallery/highlights/formal/Image29.jpeg",
        "Gallery/highlights/formal/Image30.jpeg",
        "Gallery/highlights/formal/Image26.jpeg",
        "Gallery/highlights/formal/alice-image1.jpg",
      ],
    },
  ];

  rotators.forEach(({ selector, images }) => {
    const el = document.querySelector(selector);
    if (el) {
      let i = 0;
      setInterval(() => {
        i = (i + 1) % images.length;
        el.src = images[i];
      }, 3000);
    }
  });
});

const form = document.getElementById("contactForm");
const submitBtn = document.getElementById("submitBtn");
const btnText = submitBtn.querySelector(".btn-text");
const btnLoader = submitBtn.querySelector(".btn-loader");

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  // Show loader, disable button
  btnText.style.display = "none";
  btnLoader.style.display = "inline-block";
  submitBtn.disabled = true;

  const formData = new FormData(form);

  try {
    const response = await fetch("https://formsubmit.co/el/bizara", {
      method: "POST",
      body: formData,
    });

    if (response.ok) {
      // Redirect to thank you page
      window.location.href = "https://radiantauraphotography.com/thankyou.html";
    } else {
      alert("Oops, something went wrong. Please try again.");
      // Reset button state
      btnText.style.display = "inline";
      btnLoader.style.display = "none";
      submitBtn.disabled = false;
    }
  } catch (error) {
    alert("Network error. Please check your connection and try again.");
    // Reset button state
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
    submitBtn.disabled = false;
    console.error(error);
  }
});
