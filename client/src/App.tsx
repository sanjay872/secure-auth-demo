import { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
} from "firebase/auth";
import { auth } from "./firebase";
import api, { setAccessToken } from "./api/axios";

export default function App() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [toast, setToast] = useState<string | null>(null);

  function showToast(message: string) {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  }

  function resetForm() {
    setEmail("");
    setPassword("");
  }

  async function handleSignUp() {
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      resetForm();
      showToast("Account created successfully 🎉 Please login.");
    } catch (e: any) {
      if (e.code === "auth/email-already-in-use") {
        showToast("User already exists ❌");
      } else if (e.code === "auth/weak-password") {
        showToast("Password should be at least 6 characters ⚠️");
      } else {
        showToast("Signup failed ❌");
      }
    }
  }

  async function handleSignIn() {
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await cred.user.getIdToken();

      const res = await api.post("/auth/exchange", {
        id_token: idToken,
      });

      setAccessToken(res.data.access_token);

      const profileRes = await api.get("/profile");
      setProfile(profileRes.data);

      setIsAuthenticated(true);
      resetForm();
      showToast("Login successful ✅");
    } catch (e: any) {
      if (e.code === "auth/invalid-credential") {
        showToast("Incorrect email or password ❌");
      } else {
        showToast("Login failed ❌");
      }
    }
  }

  async function reloadProfile() {
    try {
      const res = await api.get("/profile");
      setProfile(res.data);
      showToast("Profile reloaded 🔄");
    } catch (err) {
      showToast("Session expired ❌");
    }
  }

  async function handleLogout() {
    try {
      await api.post("/auth/logout");
      setAccessToken(null);
      setIsAuthenticated(false);
      setProfile(null);
      showToast("Logged out successfully 👋");
    } catch {
      showToast("Logout failed ❌");
    }
  }

  // ---------------- PROFILE PAGE ----------------

  if (isAuthenticated && profile) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
        {toast && (
          <div className="absolute top-6 bg-black text-white px-6 py-2 rounded-lg shadow-lg">
            {toast}
          </div>
        )}

        <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md space-y-4">
          <h2 className="text-2xl font-semibold text-center">
            Profile Page 🔐
          </h2>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">User ID</p>
            <p className="font-medium break-all">{profile.user_id}</p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Message</p>
            <p className="font-medium">{profile.message}</p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={reloadProfile}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition"
            >
              Reload Profile
            </button>

            <button
              onClick={handleLogout}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white rounded-lg py-2 transition"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ---------------- LOGIN PAGE ----------------

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center relative">
      {toast && (
        <div className="absolute top-6 bg-black text-white px-6 py-2 rounded-lg shadow-lg">
          {toast}
        </div>
      )}

      <div className="bg-white shadow-xl rounded-xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Secure Auth Demo
        </h2>

        <div className="space-y-4">
          <input
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <input
            className="w-full border rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <div className="flex gap-3">
            <button
              onClick={handleSignUp}
              className="flex-1 bg-gray-200 hover:bg-gray-300 rounded-lg py-2 transition"
            >
              Sign Up
            </button>

            <button
              onClick={handleSignIn}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2 transition"
            >
              Sign In
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}