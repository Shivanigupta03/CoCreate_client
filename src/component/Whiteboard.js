import React, { useRef, useEffect, useState } from "react";
import io from "socket.io-client";
import ACTIONS from "../Actions";

const socket = io("http://localhost:8080");
const roomId = "my-room";

function Whiteboard() {
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);
  const isDrawingRef = useRef(false);
  const lastPosRef = useRef({ x: 0, y: 0 });

  const [tool, setTool] = useState("pen");
  const [penColor, setPenColor] = useState("#ffffff");
  const [penSize, setPenSize] = useState(4);

  const strokesRef = useRef([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    ctx.lineCap = "round";
    ctx.strokeStyle = penColor;
    ctx.lineWidth = penSize;
    ctxRef.current = ctx;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth * 0.9;
      canvas.height = window.innerHeight * 0.7;
      ctx.lineCap = "round";
      ctx.strokeStyle = tool === "eraser" ? "#1e1e1e" : penColor;
      ctx.lineWidth = penSize;
      redrawStrokes();
    };

    const redrawStrokes = () => {
      clearCanvas();
      strokesRef.current.forEach((stroke) => {
        stroke.points.forEach((p, idx) => drawPoint(p, idx === 0));
        ctx.closePath();
      });
    };

    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);

    // Join room and request initial sync
    socket.emit(ACTIONS.JOIN, { roomId, username: "Anonymous" });
    socket.emit(ACTIONS.WHITEBOARD_REQUEST_SYNC, { roomId });

    // --- SOCKET LISTENERS ---
    socket.on(ACTIONS.WHITEBOARD_BEGIN, ({ point }) => {
      drawPoint(point, true);
      addPointToStrokes(point, true);
    });

    socket.on(ACTIONS.WHITEBOARD_DRAW, ({ point }) => {
      drawPoint(point, false);
      addPointToStrokes(point, false);
    });

    socket.on(ACTIONS.WHITEBOARD_END, () => {
      ctx.closePath();
    });

    socket.on(ACTIONS.WHITEBOARD_CLEAR, () => {
      clearCanvas();
      strokesRef.current = [];
    });

    socket.on(ACTIONS.WHITEBOARD_SYNC, ({ whiteboardData }) => {
      strokesRef.current = whiteboardData;
      redrawStrokes();
    });

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      socket.off(ACTIONS.WHITEBOARD_BEGIN);
      socket.off(ACTIONS.WHITEBOARD_DRAW);
      socket.off(ACTIONS.WHITEBOARD_END);
      socket.off(ACTIONS.WHITEBOARD_CLEAR);
      socket.off(ACTIONS.WHITEBOARD_SYNC);
    };
  }, [penColor, penSize, tool]);

  const addPointToStrokes = (point, begin) => {
    if (begin) {
      strokesRef.current.push({ points: [point] });
    } else {
      strokesRef.current[strokesRef.current.length - 1].points.push(point);
    }
  };

  const drawPoint = (point, begin = false) => {
    if (!ctxRef.current) return;
    const ctx = ctxRef.current;
    ctx.strokeStyle = point.tool === "eraser" ? "#1e1e1e" : point.color;
    ctx.lineWidth = point.size;

    if (begin) {
      ctx.beginPath();
      ctx.moveTo(point.x, point.y);
    } else {
      ctx.lineTo(point.x, point.y);
      ctx.stroke();
    }
  };

  const startDrawing = (e) => {
    const { offsetX, offsetY } = e.nativeEvent;
    lastPosRef.current = { x: offsetX, y: offsetY };
    isDrawingRef.current = true;

    const point = { x: offsetX, y: offsetY, color: penColor, size: penSize, tool };
    drawPoint(point, true);
    addPointToStrokes(point, true);

    socket.emit(ACTIONS.WHITEBOARD_BEGIN, { roomId, point });
  };

  const draw = (e) => {
    if (!isDrawingRef.current) return;
    const { offsetX, offsetY } = e.nativeEvent;
    const point = { x: offsetX, y: offsetY, color: penColor, size: penSize, tool };
    drawPoint(point, false);
    addPointToStrokes(point, false);

    socket.emit(ACTIONS.WHITEBOARD_DRAW, { roomId, point });
  };

  const stopDrawing = () => {
    if (!isDrawingRef.current) return;
    isDrawingRef.current = false;
    ctxRef.current.closePath();
    socket.emit(ACTIONS.WHITEBOARD_END, { roomId });
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    ctxRef.current.clearRect(0, 0, canvas.width, canvas.height);
  };

  return (
    <div style={{ background: "#121212", padding: "12px", borderRadius: "12px" }}>
      <h2 style={{ color: "white" }}>Whiteboard</h2>

      {/* Toolbar */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
        <button onClick={() => setTool("pen")}
          style={{ background: tool === "pen" ? "#22c55e" : "#333", color: "white", padding: "6px 12px", borderRadius: "8px" }}>
          Pen
        </button>
        <button onClick={() => setTool("eraser")}
          style={{ background: tool === "eraser" ? "#ef4444" : "#333", color: "white", padding: "6px 12px", borderRadius: "8px" }}>
          Eraser
        </button>

        {/* Colors */}
        <div style={{ display: "flex", gap: "6px" }}>
          {["#ffffff", "#22c55e", "#3b82f6", "#facc15", "#ef4444"].map((c) => (
            <button key={c} onClick={() => setPenColor(c)}
              style={{ width: "24px", height: "24px", borderRadius: "50%", background: c, border: penColor === c ? "2px solid #fff" : "2px solid #333" }} />
          ))}
        </div>

        {/* Size */}
        <input type="range" min="2" max="20" value={penSize}
          onChange={(e) => setPenSize(Number(e.target.value))} />

        <button onClick={() => {
          clearCanvas();
          strokesRef.current = [];
          socket.emit(ACTIONS.WHITEBOARD_CLEAR, { roomId });
        }}
          style={{ background: "#444", color: "white", padding: "6px 12px", borderRadius: "8px" }}>
          Clear
        </button>
      </div>

      {/* Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={startDrawing}
        onMouseUp={stopDrawing}
        onMouseMove={draw}
        onMouseLeave={stopDrawing}
        style={{
          background: "#1e1e1e",
          border: "2px solid #333",
          borderRadius: "12px",
          cursor: tool === "eraser" ? "crosshair" : "pointer",
          width: "100%",
          height: "70vh",
        }}
      />
    </div>
  );
}

export default Whiteboard;
