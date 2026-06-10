import { API_BASE } from "./helpers/config.js";

const setMessage = (message, type = "error") => {
  const el = document.getElementById("reset-password-message");
  if (!el) return;
  el.textContent = message;
  el.dataset.type = type;
};

const getTokenFromUrl = () => {
  return new URLSearchParams(globalThis.location.search).get("token");
};

const initResetPasswordPage = () => {
  const form = document.getElementById("reset-password-form");
  if (!form) return;
  if (form.dataset.listenerAttached) return;
  form.dataset.listenerAttached = "true";

  const token = getTokenFromUrl();

  if (!token) {
    setMessage("Invalid or missing reset link. Please request a new one.");
    form.querySelector('button[type="submit"]').disabled = true;
    return;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const password = document.getElementById("new-password").value;
    const confirm = document.getElementById("confirm-password").value;

    if (!password || !confirm) {
      setMessage("Please fill in both fields");
      return;
    }

    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    if (password !== confirm) {
      setMessage("Passwords do not match");
      return;
    }

    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = "Resetting...";
    setMessage("");

    try {
      const response = await fetch(`${API_BASE}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setMessage(data.message || "Something went wrong");
        return;
      }

      setMessage(
        "Password reset successfully! Redirecting to login...",
        "success",
      );
      globalThis.setTimeout(() => {
        globalThis.location.href = "./login.html";
      }, 2000);
    } catch {
      setMessage("Unable to reach the server");
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Reset Password";
    }
  });
};

document.addEventListener("DOMContentLoaded", initResetPasswordPage);
document.addEventListener("router:contentLoaded", initResetPasswordPage);
