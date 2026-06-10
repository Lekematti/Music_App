const isTokenExpired = (token) => {
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
const token = localStorage.getItem("token");
const hasToken = token !== null;
const currentPath = globalThis.location.pathname;

const isPublicPage =
  currentPath.endsWith("login.html") ||
  currentPath.endsWith("register.html") ||
  currentPath.endsWith("forgot-password.html") ||
  currentPath.endsWith("reset-password.html");
const isRootIndex =
  currentPath.endsWith("/index.html") ||
  currentPath === "/" ||
  currentPath === "";
const loginPath = isRootIndex ? "./pages/login.html" : "login.html";

// Redirect if token is expired
if (!isPublicPage && hasToken && isTokenExpired(token)) {
  localStorage.removeItem("token");
  localStorage.removeItem("isLoggedIn");
  globalThis.location.href = loginPath;
}

// Redirect if not logged in
if (!isPublicPage && (!isLoggedIn || !hasToken)) {
  globalThis.location.href = loginPath;
}
