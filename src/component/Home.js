import React, { useState, useEffect } from "react";
import { v4 as uuid } from "uuid";
import toast from "react-hot-toast";
import { useNavigate, Navigate } from "react-router-dom";
import { auth, db } from "../firebase";
import { doc, setDoc, updateDoc } from "firebase/firestore";

function Home() {
  const [roomId, setRoomId] = useState("");
  const [username, setUsername] = useState("");

  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setAuthChecked(true); 
    });
    return () => unsubscribe();
  }, []);

  const generateRoomId = (e) => {
    e.preventDefault();
    const Id = uuid();
    setRoomId(Id);
    toast.success("Room ID generated");
  };

  const joinRoom = async () => {
    if (!roomId || !username) {
      toast.error("Both fields are required");
      return;
    }

    try {
      if (user) {
        await setDoc(
          doc(db, "sessions", user.uid),
          {
            username,
            roomId,
            active: true,
            joinedAt: new Date(),
          },
          { merge: true }
        );
      } else {
        toast.error("Please login again to join a room.");
        return;
      }

      toast.success("Joined Room Successfully");
      navigate(`/editor/${roomId}`, { state: { username } });
    } catch (error) {
      console.error("Error joining room:", error);
      toast.error("Error joining room");
    }
  };

  const handleInputEnter = (e) => {
    if (e.code === "Enter") joinRoom();
  };

  useEffect(() => {
    const handleBeforeUnload = async () => {
      if (user) {
        try {
          await updateDoc(doc(db, "sessions", user.uid), {
            active: false,
            leftAt: new Date(),
          });
        } catch (err) {
          console.error("Error marking inactive:", err);
        }
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [user]);

  if (!authChecked) return <div>Loading...</div>;

  if (!user || !user.emailVerified) return <Navigate to="/auth" replace />;

  return (
    <div
      className="d-flex justify-content-center align-items-center min-vh-100"
      style={{ background: "linear-gradient(135deg, #2e026d, #151c96, #0077ff)" }}
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

            <input
              type="text"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
              className="form-control mb-3"
              placeholder="ROOM ID"
              onKeyUp={handleInputEnter}
            />

            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="form-control mb-3"
              placeholder="USERNAME"
              onKeyUp={handleInputEnter}
            />

            <button
              onClick={joinRoom}
              className="btn btn-success w-100 py-2 fw-bold"
            >
              JOIN
            </button>

            <p className="mt-3 text-light">
              Don’t have a room ID?{" "}
              <span
                onClick={generateRoomId}
                className="text-success fw-bold"
                style={{ cursor: "pointer" }}
              >
                Create New Room
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;