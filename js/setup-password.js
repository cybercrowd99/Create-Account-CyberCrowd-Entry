/* =========================================================
   CYBERCROWD — ACCOUNT PASSWORD SETUP SUBMISSION
   PURPOSE:
   Receives the Create Account password form submission,
   validates the setup token and password pair,
   sends the password to the server-owned setup endpoint,
   and advances only after the server confirms success.

   OWNS:
   - Setup form submit event
   - Setup token retrieval from URL
   - Password length validation
   - Password confirmation match
   - POST request to /api/auth/set-password
   - Setup status messages
   - Redirect after confirmed account setup

   DOES NOT OWN:
   - Password hashing
   - Password storage
   - Setup-token validation authority
   - Session creation
   - Account database writes
   - Dashboard authorization
   ========================================================= */

(function () {
  const form = document.querySelector("#setupPasswordForm");
  const passwordInput = document.querySelector("#password");
  const confirmInput = document.querySelector("#confirmPassword");
  const statusEl = document.querySelector("#setupStatus");

  function setStatus(message) {
    if (statusEl) statusEl.textContent = message;
  }

  function getSetupToken() {
    const params = new URLSearchParams(window.location.search);
    return params.get("setup") || params.get("token") || "";
  }

  async function submitPassword(event) {
    event.preventDefault();

    const setupToken = getSetupToken();
    const password = passwordInput ? passwordInput.value.trim() : "";
    const confirmPassword = confirmInput ? confirmInput.value.trim() : "";

    if (!setupToken) {
      setStatus("missing_setup_token");
      return;
    }

    if (!password || password.length < 8) {
      setStatus("password_too_short");
      return;
    }

    if (password !== confirmPassword) {
      setStatus("passwords_do_not_match");
      return;
    }

    setStatus("sealing_account");

    try {
      const response = await fetch("/api/auth/set-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        credentials: "include",
        body: JSON.stringify({
          setupToken,
          password
        })
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok || result.success === false) {
        setStatus(result.error || "setup_failed");
        return;
      }

      setStatus("account_ready");

      window.location.href = result.redirect || "/dashboard-surface.html";
    } catch (error) {
      setStatus("network_failed");
    }
  }

  if (form) {
    form.addEventListener("submit", submitPassword);
  }
})();
