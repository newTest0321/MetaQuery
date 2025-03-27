import Cookies from "js-cookie";  // Ensure you have installed: npm install js-cookie

export function isAuthenticated() {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      return token ? true : false;
    }
    return false;
  }
  

export function loginUser(userData) {
  const { token } = userData;

  if (token) {
    Cookies.set("token", token, { expires: 7, path: "/", secure: true, sameSite: "Lax" });
    localStorage.setItem("token", token);
    return true;
  }
  return false;
}

export function logoutUser() {
  Cookies.remove("token");
  localStorage.removeItem("token");
}
