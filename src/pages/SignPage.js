// src/pages/SignPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "../firebase"; // adjust path if needed
import {
  createUserWithEmailAndPassword,
  updateProfile,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

function SignPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();

    if (!name || !email || !password || !confirmPassword) {
      toast.error("All fields are required");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    try {
      setBusy(true);

      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Set display name
      await updateProfile(user, { displayName: name });

      // Send verification email immediately
      await sendEmailVerification(user);

      toast.success("Account created! Please verify your email before logging in.");

      setTimeout(async () => {
        await signOut(auth);
        navigate("/auth");
      }, 500);

    } catch (err) {
      console.error("Signup error:", err);

      const code = err.code || "";
      if (code.includes("email-already-in-use")) {
        toast.error("Email already in use");
      } else if (code.includes("weak-password")) {
        toast.error("Password is too weak (min 6 chars)");
      } else if (code.includes("invalid-email")) {
        toast.error("Invalid email format");
      } else {
        toast.error(err.message || "Signup failed");
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{ background: "linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)" }}
    >
      <div className="col-11 col-md-6 col-lg-4">
        <div className="card shadow-lg border-0 rounded-3">
          <div className="card-body text-center bg-dark rounded-3">
            <img
              src="/images/team.png"
              alt="Logo"
              className="img-fluid mx-auto d-block mb-3"
              style={{ maxWidth: "50px" }}
            />
            <h1 className="card-title text-light mb-4">Sign Up</h1>

            <form onSubmit={handleSignup}>
              <input
                className="form-control mb-3"
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="form-control mb-3"
                placeholder="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <input
                className="form-control mb-3"
                placeholder="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <input
                className="form-control mb-3"
                placeholder="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />

              <button
                type="submit"
                disabled={busy}
                className="btn btn-success w-100 py-2 fw-bold"
              >
                {busy ? "Creating..." : "Sign Up"}
              </button>
            </form>

            <p className="mt-3 text-light">
              Already have an account?{" "}
              <span
                className="text-success fw-bold"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/auth")}
              >
                Login
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SignPage;
