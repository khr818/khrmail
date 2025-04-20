import React, { useState, useEffect } from "react";
import axios from "axios";
import { io } from "socket.io-client";

const socket = io(process.env.REACT_APP_API_URL);

function App() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [user, setUser] = useState(null);
  const [receiver, setReceiver] = useState("");
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const handleAuth = async () => {
    try {
      const res = await axios.post(`${process.env.REACT_APP_API_URL}/api/auth/${isSignup ? "register" : "login"}`, {
        email, password, username
      });
      setUser(res.data.user);
      localStorage.setItem("token", res.data.token);
    } catch (err) {
      alert("Auth Failed");
    }
  };

  const fetchMessages = async () => {
    const token = localStorage.getItem("token");
    const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/messages/${user.email}/${receiver}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    setMessages(res.data);
  };

  const sendMessage = async () => {
    const token = localStorage.getItem("token");
    const msg = {
      sender: user.email,
      receiver,
      content: message
    };
    await axios.post(`${process.env.REACT_APP_API_URL}/api/messages`, msg, {
      headers: { Authorization: `Bearer ${token}` }
    });
    socket.emit("sendMessage", msg);
    setMessages((prev) => [...prev, msg]);
    setMessage("");
  };

  useEffect(() => {
    socket.on("receiveMessage", (msg) => {
      if (
        msg.sender === receiver && msg.receiver === user.email
      ) {
        setMessages((prev) => [...prev, msg]);
      }
    });
    return () => socket.off("receiveMessage");
  }, [receiver, user]);

  if (!user) {
    return (
      <div>
        <h2>{isSignup ? "Sign Up" : "Login"}</h2>
        {isSignup && <input placeholder="Username" onChange={e => setUsername(e.target.value)} />}
        <input placeholder="Email" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" onChange={e => setPassword(e.target.value)} />
        <button onClick={handleAuth}>{isSignup ? "Register" : "Login"}</button>
        <p onClick={() => setIsSignup(!isSignup)} style={{ cursor: "pointer" }}>
          {isSignup ? "Already have an account?" : "Don't have an account?"}
        </p>
      </div>
    );
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Welcome {user.username}</h2>
      <input placeholder="Chat with email" onChange={e => setReceiver(e.target.value)} />
      <button onClick={fetchMessages}>Load Messages</button>
      <div style={{ height: 300, overflowY: "scroll", marginTop: 10, border: "1px solid #ccc", padding: 10 }}>
        {messages.map((m, i) => (
          <div key={i}><b>{m.sender}:</b> {m.content}</div>
        ))}
      </div>
      <input value={message} onChange={e => setMessage(e.target.value)} placeholder="Type message" />
      <button onClick={sendMessage}>Send</button>
    </div>
  );
}

export default App;
