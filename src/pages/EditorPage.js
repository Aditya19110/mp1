import React, { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import ACTIONS from "../Actions";
import Client from "../components/Client";
import Editor from "../components/Editor";
import { initSocket } from "../socket";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io('http://localhost:5002');

const EditorPage = () => {
  const socketRef = useRef(null);
  const codeRef = useRef(null);
  const location = useLocation();
  const { roomId } = useParams();
  const reactNavigator = useNavigate();
  const [clients, setClients] = useState([]);
  const [output, setOutput] = useState("");
  const [username, setUsername] = useState(location.state?.username || '');
  const [code, setCode] = useState("");

  useEffect(() => {
    if (!username) {
      toast.error("Username is required to join the room");
      reactNavigator("/");
      return;
    }

    const init = async () => {
      try {
        socketRef.current = await initSocket();
        socketRef.current.on("connect_error", (err) => handleErrors(err));
        socketRef.current.on("connect_failed", (err) => handleErrors(err));

        function handleErrors(e) {
          console.log("Socket error:", e);
          toast.error("Socket connection failed, try again later");
          reactNavigator("/");
        }

        socketRef.current.emit(ACTIONS.JOIN, {
          roomId,
          username,
        });

        socketRef.current.on(ACTIONS.JOINED, ({ clients, username, socketId }) => {
          if (username !== location.state?.username) {
            toast.success(`${username} joined the Room`);
            console.log(`${username} Joined`);
          }
          setClients(clients);
          socketRef.current.emit(ACTIONS.SYNC_CODE, {
            code: codeRef.current,
            socketId,
          });
        });

        socketRef.current.on(ACTIONS.DISCONNECTED, ({ socketId, username }) => {
          toast.success(`${username} left the room`);
          setClients((prev) =>
            prev.filter((client) => client.socketId !== socketId)
          );
        });
      } catch (error) {
        console.error("Socket initialization failed:", error);
        toast.error("Socket connection failed, try again later");
        reactNavigator("/");
      }
    };

    init();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current.off(ACTIONS.JOINED);
        socketRef.current.off(ACTIONS.DISCONNECTED);
        socketRef.current.off("connect_error");
        socketRef.current.off("connect_failed");
      }
    };
  }, [location]);

  const copyRoomId = async () => {
    try {
      await navigator.clipboard.writeText(roomId);
      toast.success("Room ID copied to clipboard");
    } catch (err) {
      console.error("Failed to copy Room ID:", err);
      toast.error("Failed to copy Room ID");
    }
  };

  const leaveRoom = () => {
    reactNavigator("/");
    toast.success("Left the room");
  };

  const runCode = async () => {
    if (!codeRef.current) {
      toast.error("No code to execute");
      return;
    }

    try {
      const { data } = await axios.post("http://localhost:5002/execute", {
        code: codeRef.current,
      });

      setOutput(data.output);
      toast.success("Code executed successfully");
    } catch (err) {
      console.error("Code execution failed:", err);
      const errorMessage = err?.response?.data?.error || "Code execution failed";
      setOutput(errorMessage);
      toast.error(errorMessage);
    }
  };

  const uploadCode = (event) => {
    const file = event.target.files[0];
    if (!file) {
      toast.error("No file selected");
      return;
    }

    const reader = new FileReader();

    reader.onload = function (e) {
      const code = e.target.result;
      setCode(code);
      codeRef.current = code;
      toast.success("File loaded successfully");
    };

    reader.onerror = function (e) {
      toast.error("Error reading the file");
    };

    reader.readAsText(file);
  };

  // Save code as .py file
  const saveCode = () => {
    const blob = new Blob([code], { type: 'text/python' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'code.py';
    link.click();
    toast.success("Code saved successfully as code.py");
  };

  return (
    <div className="mainWrap">
      <div className="aside">
        <div className="asideInner">
          <div className="logo">
            <img className="logoImg" src="/code-together.png" alt="Logo" />
          </div>
          <h3>Connected</h3>
          <div className="clientsList">
            {clients.map((client) => (
              <Client key={client.socketId} username={client.username} />
            ))}
          </div>
        </div>
        <button className="btn copyBtn" onClick={copyRoomId}>
          Copy Room Id
        </button>
        <button className="btn leaveBtn" onClick={leaveRoom}>
          Leave
        </button>
        <button className="btn runBtn" onClick={runCode}>
          Run Code
        </button>
        <input
          type="file"
          onChange={uploadCode}
          style={{ marginTop: "10px", cursor: "pointer", backgroundColor: "#2d2d2d", color: "white", padding: "10px", borderRadius: "5px", border: "none" }}
          className="file-input"
        />
        <button className="btn saveBtn" onClick={saveCode} style={{ marginTop: "10px" }}>
          Save Code
        </button>
      </div>
      <div className="editorWrap">
        <Editor
          socketRef={socketRef}
          roomId={roomId}
          code={code}
          onCodeChange={(newCode) => {
            setCode(newCode);
            codeRef.current = newCode;
          }}
        />
      </div>
      <div className="outputWrap">
        <h3>Output:</h3>
        <pre className="output">{output || "No output yet"}</pre>
      </div>
    </div>
  );
};

export default EditorPage;