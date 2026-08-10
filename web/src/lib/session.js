// Tiny module-level session store so api.js can attach the right auth header
// without importing React state. Kept in sync by the AuthProvider.
let token = null;
let demoRole = localStorage.getItem('wellspire.role') || 'admin';

export const setToken = (t) => { token = t || null; };
export const getToken = () => token;
export const setDemoRole = (r) => { demoRole = r; localStorage.setItem('wellspire.role', r); };
export const getDemoRole = () => demoRole;
