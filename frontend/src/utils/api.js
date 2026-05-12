export const authFetch = async (url, options = {}) => {
  let departmentInfo = {};
  try {
    departmentInfo = JSON.parse(localStorage.getItem("department")) || {};
  } catch (e) {
    departmentInfo = {};
  }
  const token = departmentInfo?.access_token || fallbackToken;

  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  
  const response = await fetch(url, {
    ...options,
    headers
  });
  
  if (response.status === 401) {
    localStorage.removeItem("department");
    window.location.href = "/login";
  }
  
  return response;
};