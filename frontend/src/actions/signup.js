import axios from "axios";

export async function signup(email, password) {
  try {
    const response = await axios.post("http://127.0.0.1:8000/auth/signup", {
      email,
      password,
    });

    if (response.status === 200) {
      return response.data; // Return user data
    }
  } catch (error) {
    throw new Error(error.response?.data?.detail || "Signup failed");
  }
}
