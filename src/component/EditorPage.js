import React, { useEffect, useRef, useState } from "react";
import Client from "./Client";
import Editor from "./Editor";
import Whiteboard from "./Whiteboard";
import { getSocket } from "../Socket";
import ACTIONS from "../Actions";
import { useNavigate, useLocation, Navigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import axios from "axios";

const LANGUAGES = [
  { value: "python3", label: "Python 3" },
  { value: "java", label: "Java" },
  { value: "cpp", label: "C++" },
  { value: "nodejs", label: "Node.js" },
  { value: "c", label: "C" },
  { value: "ruby", label: "Ruby" },
  { value: "go", label: "Go" },
  { value: "scala", label: "Scala" },
  { value: "bash", label: "Bash" },
  { value: "sql", label: "SQL" },
  { value: "pascal", label: "Pascal" },
  { value: "csharp", label: "C#" },
  { value: "php", label: "PHP" },
  { value: "swift", label: "Swift" },
  { value: "rust", label: "Rust" },
  { value: "r", label: "R" },
];

function EditorPage() {
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [isCompileWindowOpen, setIsCompileWindowOpen] = useState(false);
  const [isWhiteboardOpen, setIsWhiteboardOpen] = useState(false);
  const [isCompiling, setIsCompiling] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("python3");

  const codeRef = useRef(null);
  const socketRef = useRef(null);

  const location = useLocation();
  const navigate = useNavigate();
  const { roomId } = useParams();

  useEffect(() => {
    socketRef.current = getSocket();

    const handleErrors = (err) => {
      console.error("Socket error:", err);
      toast.error("Socket connection failed. Try again later.");
      navigate("/");
    };

    const handleJoin = ({ clients, username, socketId }) => {
      if (username !== location.state?.username) {
        toast.success(`${username} joined the room.`);
      }
      setClients(clients);

      socketRef.current?.emit(ACTIONS.SYNC_CODE, {
        code: codeRef.current,
        socketId,
      });
    };

    const handleDisconnect = ({ socketId, username }) => {
      toast.success(`${username} left the room.`);
      setClients((prev) =>
        prev.filter((client) => client.socketId !== socketId)
      );
    };

    socketRef.current.emit(ACTIONS.JOIN, {
      roomId,
      username: location.state?.username,
    });

    socketRef.current.on(ACTIONS.JOINED, handleJoin);
    socketRef.current.on(ACTIONS.DISCONNECTED, handleDisconnect);
    socketRef.current.on("connect_error", handleErrors);
    socketRef.current.on("connect_failed", handleErrors);

    // ✅ cleanup (don’t nullify here)
    return () => {
      if (socketRef.current) {
        socketRef.current.off(ACTIONS.JOINED, handleJoin);
        socketRef.current.off(ACTIONS.DISCONNECTED, handleDisconnect);
        socketRef.current.off("connect_error", handleErrors);
        socketRef.current.off("connect_failed", handleErrors);

        socketRef.current.disconnect(); // properly close socket
      }
    };
  }, [location.state, navigate, roomId]);

  if (!location.state) {
    return <Navigate to="/" />;
  }

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID is copied");
    } catch {
      toast.error("Unable to copy the room ID");
    }
  };

  const leaveRoom = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      // ❌ don’t set socketRef.current = null (caused your error)
    }
    navigate("/");
  };

  const runCode = async () => {
    setIsCompiling(true);
    try {
      const response = await axios.post("http://localhost:8080/compile", {
        code: codeRef.current,
        language: selectedLanguage,
      });
      setOutput(response.data.output || JSON.stringify(response.data));
    } catch (error) {
      setOutput(error.response?.data?.error || "An error occurred");
    } finally {
      setIsCompiling(false);
    }
  };

  const toggleCompileWindow = () =>
    setIsCompileWindowOpen(!isCompileWindowOpen);
  const toggleWhiteboard = () => setIsWhiteboardOpen(!isWhiteboardOpen);

  return (
    <div
      className="vh-100 w-100 d-flex"
      style={{
        background: "linear-gradient(135deg, #2e026d, #151c96, #0077ff)",
        color: "#fff",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Sidebar */}
      <div
        className="d-flex flex-column p-4"
        style={{
          width: "250px",
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
          borderRight: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "1rem 0 0 1rem",
        }}
      >
        <h3 className="fw-bold mb-4 d-flex align-items-center">
          <span
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: "32px",
              height: "32px",
              background: "#4f46e5",
              borderRadius: "8px",
              marginRight: "10px",
              lineHeight: "1",
            }}
          >
            <img src="/images/team.png" alt="Logo" style={{ maxWidth: "20px" }} />
          </span>
          CoCreate
        </h3>

        <h6 className="mb-3">Members</h6>
        <div className="flex-grow-1 overflow-auto mb-4">
          {clients.map((client) => (
            <Client key={client.socketId} username={client.username} />
          ))}
        </div>

        <button
          className="w-100 mb-2"
          onClick={copyRoomId}
          style={{
            background: "#2563eb",
            border: "none",
            padding: "10px",
            borderRadius: "10px",
            color: "#fff",
            fontWeight: "600",
          }}
        >
          Copy Room ID
        </button>
        <button
          className="w-100"
          onClick={leaveRoom}
          style={{
            background: "#dc2626",
            border: "none",
            padding: "10px",
            borderRadius: "10px",
            color: "#fff",
            fontWeight: "600",
          }}
        >
          Leave Room
        </button>
      </div>

      {/* Editor Panel */}
      <div
        className="flex-grow-1 d-flex flex-column p-3"
        style={{
          background: "rgba(0,0,0,0.4)",
          backdropFilter: "blur(8px)",
          borderRadius: "0 1rem 1rem 0",
        }}
      >
        <div className="d-flex justify-content-end mb-2">
          <select
            className="form-select"
            style={{
              width: "160px",
              background: "rgba(255,255,255,0.1)",
              border: "1px solid rgba(255,255,255,0.2)",
              color: "#fff",
              borderRadius: "8px",
            }}
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
          >
            {LANGUAGES.map((lang) => (
              <option key={lang.value} value={lang.value}>
                {lang.label}
              </option>
            ))}
          </select>
        </div>

        <div
          className="flex-grow-1 rounded p-2"
          style={{
            background: "rgba(0,0,0,0.8)",
            borderRadius: "12px",
            overflow: "hidden",
          }}
        >
          <Editor
            socketRef={socketRef}
            roomId={roomId}
            onCodeChange={(code) => (codeRef.current = code)}
          />
        </div>
      </div>

      {/* Compiler Window */}
      <div
        className={`position-fixed bottom-0 start-0 end-0 p-3 ${
          isCompileWindowOpen ? "d-block" : "d-none"
        }`}
        style={{
          background: "rgba(0,0,0,0.85)",
          backdropFilter: "blur(12px)",
          borderTop: "2px solid rgba(255,255,255,0.1)",
          height: isCompileWindowOpen ? "30vh" : "0",
          transition: "height 0.4s ease-in-out",
          overflowY: "auto",
          color: "#fff",
          borderRadius: "20px 20px 0 0",
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2">
          <h5 className="m-0">Compiler Output ({selectedLanguage})</h5>
          <div>
            <button
              className="btn btn-success me-2"
              onClick={runCode}
              disabled={isCompiling}
            >
              {isCompiling ? "Compiling..." : "Run Code"}
            </button>
            <button className="btn btn-secondary" onClick={toggleCompileWindow}>
              Close
            </button>
          </div>
        </div>
        <pre
          style={{
            background: "rgba(255,255,255,0.05)",
            padding: "12px",
            borderRadius: "10px",
            fontFamily: "monospace",
          }}
        >
          {output || "Output will appear here after compilation"}
        </pre>
      </div>

      {/* Whiteboard Window */}
      <div
        className={`position-fixed top-0 start-0 end-0 bottom-0 p-3 ${
          isWhiteboardOpen ? "d-block" : "d-none"
        }`}
        style={{
          background: "rgba(0,0,0,0.95)",
          backdropFilter: "blur(8px)",
          zIndex: 9999,
        }}
      >
        <div className="d-flex justify-content-between align-items-center mb-2 text-white">
          <h5 className="m-0">Collaborative Whiteboard</h5>
          <button className="btn btn-secondary" onClick={toggleWhiteboard}>
            Close
          </button>
        </div>
        <Whiteboard socketRef={socketRef} roomId={roomId} />
      </div>

      {/* Floating Buttons */}
      <div className="position-fixed bottom-0 end-0 m-3 d-flex flex-column align-items-end gap-2">
        <button
          className="btn"
          onClick={toggleCompileWindow}
          style={{
            background: "#4f46e5",
            color: "#fff",
            borderRadius: "12px",
            padding: "10px 20px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {isCompileWindowOpen ? "Close Compiler" : "Open Compiler"}
        </button>
        <button
          className="btn"
          onClick={toggleWhiteboard}
          style={{
            background: "#10b981",
            color: "#fff",
            borderRadius: "12px",
            padding: "10px 20px",
            fontWeight: "600",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
          }}
        >
          {isWhiteboardOpen ? "Close Whiteboard" : "Open Whiteboard"}
        </button>
      </div>
    </div>
  );
}

export default EditorPage;