import React, { useState, useEffect } from "react";
import Login from "./components/Login";
import Register from "./components/Register";
import Layout from "./components/Layout";
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";

function AppWrapper() {
  return (
    <BrowserRouter>
      <App />
    </BrowserRouter>
  );
}

function App() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [candidates, setCandidates] = useState([]);

  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  useEffect(() => {
    fetch("https://fyp2-backend-gihc.onrender.com/candidates")
      .then(res => res.json())
      .then(data => setCandidates(data))
      .catch(() => setCandidates([]));
  }, []);

  const register = async (data) => {
    const res = await fetch("https://fyp2-backend-gihc.onrender.com/register", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify(data)
    });

    const result = await res.json();
    if (!res.ok) return alert(result.msg);

    alert("Register success ✅");
    navigate("/login");
  };

  const login = async (email, password) => {
    const res = await fetch("https://fyp2-backend-gihc.onrender.com/login", {
      method: "POST",
      headers: {"Content-Type": "application/json"},
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();
    if (!res.ok) return alert(data.msg);

    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));

    setUser(data.user);
    navigate("/app");
  };

  const logout = () => {
    localStorage.clear();
    setUser(null);
    navigate("/login");
  };

  return (
    <Routes>

      <Route path="/" element={<Navigate to="/login" />} />

      <Route path="/login" element={
        <Login onLogin={login} goRegister={() => navigate("/register")} />
      } />

      <Route path="/register" element={
        <Register onRegister={register} goLogin={() => navigate("/login")} />
      } />

      <Route path="/forgot" element={<ForgotPassword />} />
      <Route path="/reset/:token" element={<ResetPassword />} />

      <Route path="/app" element={
        user ? (
          <Layout user={user} logout={logout} candidates={candidates} />
        ) : (
          <Navigate to="/login" />
        )
      } />

    </Routes>
  );
}

export default AppWrapper;