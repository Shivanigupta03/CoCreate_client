// src/pages/AuthPage.js
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { auth } from "../firebase";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  signOut,
} from "firebase/auth";

function AuthPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const navigate = useNavigate();

  // ✅ Handle Login
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      return toast.error("Both fields are required");
    }

    try {
      setBusy(true);

      const { user } = await signInWithEmailAndPassword(auth, email, password);

      // Refresh user to check verification status
      await user.reload();

      if (!user.emailVerified) {
        toast.error("Please verify your email before logging in.");
        try {
          await sendEmailVerification(user);
          toast.success("Verification email resent. Check your inbox!");
        } catch (err) {
          console.error("Error sending verification email:", err);
        }
        await signOut(auth); // logout if not verified
        return;
      }

      toast.success("Login successful!");
      navigate("/"); // ✅ redirect to home page immediately

    } catch (err) {
      console.error("Login failed:", err);
      if (err.code === "auth/user-not-found") {
        toast.error("No account found. Please sign up first.");
      } else if (err.code === "auth/wrong-password") {
        toast.error("Incorrect password.");
      } else {
        toast.error(err.message);
      }
    } finally {
      setBusy(false);
    }
  };

  // ✅ Handle Forgot Password
  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Enter your email to reset password");
      return;
    }

    try {
      setResetBusy(true);
      await sendPasswordResetEmail(auth, email);

      toast.success("If this email is registered, a reset link has been sent.");
      setEmail(""); // clear input
    } catch (err) {
      console.error("Password reset error:", err);
      if (err.code === "auth/too-many-requests") {
        toast.error("Too many attempts. Please wait and try again later.");
      } else if (err.code === "auth/user-not-found") {
        toast.error("No account found. Please sign up first.");
      } else {
        toast.error(err.message);
      }
    } finally {
      setResetBusy(false);
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
            <h1 className="card-title text-light mb-4">CoCreate</h1>

            {/* Login Form */}
            <form onSubmit={handleLogin}>
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

              <button
                type="submit"
                disabled={busy}
                className="btn btn-success w-100 py-2 fw-bold"
              >
                {busy ? "Signing in..." : "Login"}
              </button>
            </form>

            {/* Forgot Password */}
            <button
              type="button"
              disabled={resetBusy}
              onClick={handleForgotPassword}
              className="btn btn-link text-warning mt-2"
            >
              {resetBusy ? "Sending..." : "Forgot Password?"}
            </button>

            <p className="mt-3 text-light">
              Don’t have an account?{" "}
              <span
                className="text-success fw-bold"
                style={{ cursor: "pointer" }}
                onClick={() => navigate("/signup")}
              >
                Sign Up
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AuthPage;
