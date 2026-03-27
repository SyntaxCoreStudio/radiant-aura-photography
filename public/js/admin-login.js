const adminLoginForm = document.getElementById("adminLoginForm");
const loginStatus = document.getElementById("loginStatus");

if (adminLoginForm) {
  adminLoginForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    loginStatus.textContent = "Logging in...";

    const formData = new FormData(adminLoginForm);
    const data = Object.fromEntries(formData.entries());

    try {
      const response = await fetch("/admin/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        window.location.href = "/admin/dashboard";
      } else {
        loginStatus.textContent = result.message;
      }
    } catch (error) {
      console.error("Login error:", error);
      loginStatus.textContent = "Login failed. Please try again.";
    }
  });
}
