export function getUserId(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("userId");
}
export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("token");
}
export function setSession(token: string, userId: string) {
  localStorage.setItem("token", token);
  localStorage.setItem("userId", userId);
}
export function clearSession() {
  localStorage.removeItem("token");
  localStorage.removeItem("userId");
}
