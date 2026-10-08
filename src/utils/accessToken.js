// Access token sirf memory mein (localStorage mein nahi — XSS se chori na ho).
// Page reload par khali ho jata hai; apiHandle refresh cookie se naya le leta hai.
let accessToken = null;

export const getAccessToken = () => accessToken;

export const setAccessToken = (token) => {
  accessToken = token || null;
};
