export const authFetch = async (url, options = {}) => {
  let departmentInfo = {};

  try {
    departmentInfo = JSON.parse(localStorage.getItem("department")) || {};
  } catch {
    departmentInfo = {};
  }
  const token = departmentInfo?.access_token;

  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  return response;
};