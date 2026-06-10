import { API_BASE } from "./helpers/config.js";

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

const setMessage = (message, type = "error") => {
  const el = document.getElementById("forgot-password-message");
  if (!el) return;
  el.textContent = message;
  el.dataset.type = type;
};

const initForgotPasswordPage = () => {
  const form = document.getElementById("forgot-password-form");
  if (!form) return;
  if (form.dataset.listenerAttached) return;
  form.dataset.listenerAttached = "true";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = document.getElementById("email").value.trim().toLowerCase();

    if (!email) {
      setMessage("Please enter your email address");
      return;
    }

    if (!isValidEmail(email)) {
      setMessage("Please enter a valid email address");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Sending...";
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      setMessage(
        "If that email exists, a reset link has been sent. Check your inbox.",
        "success",
      );
      form.reset();
    } catch {
      setMessage("Unable to reach the server");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Reset Link";
    }
  });
};

document.addEventListener("DOMContentLoaded", initForgotPasswordPage);
document.addEventListener("router:contentLoaded", initForgotPasswordPage);
