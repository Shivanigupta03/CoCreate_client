import React, { useEffect, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { auth } from "./firebase";

import Home from "./component/Home";
import AuthPage from "./pages/AuthPage";
import SignPage from "./pages/SignPage";
import EditorPage from "./component/EditorPage";

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        try {
          await currentUser.reload(); // ✅ always get latest verification status
        } catch (err) {
          console.error("Reload failed:", err);
        }
        setUser(currentUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) return <div>Loading...</div>;

  const isVerified = user?.emailVerified;

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          success: {
            duration: 2500,
            style: {
              background: "#4caf50",
              color: "#fff",
              fontWeight: "600",
              borderRadius: "8px",
              padding: "12px 16px",
            },
          },
          error: {
            style: {
              background: "#f44336",
              color: "#fff",
              fontWeight: "600",
              borderRadius: "8px",
              padding: "12px 16px",
            },
          },
          style: {
            background: "#333",
            color: "#fff",
            fontWeight: "500",
            borderRadius: "8px",
            padding: "12px 16px",
          },
        }}
      />

      <Routes>
        {/* Auth routes (only if NOT verified) */}
        <Route
          path="/auth"
          element={!isVerified ? <AuthPage /> : <Navigate to="/home" replace />}
        />
        <Route
          path="/signup"
          element={!isVerified ? <SignPage /> : <Navigate to="/home" replace />}
        />

        {/* Protected routes (only if verified) */}
        <Route
          path="/home"
          element={isVerified ? <Home /> : <Navigate to="/auth" replace />}
        />
        <Route
          path="/editor/:roomId"
          element={isVerified ? <EditorPage /> : <Navigate to="/auth" replace />}
        />

        {/* Force default page */}
        <Route
          path="/"
          element={
            isVerified ? (
              <Navigate to="/home" replace />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;
