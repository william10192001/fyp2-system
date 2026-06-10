import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useNavigate
} from "react-router-dom";

import Login from "./components/Login";
import Register from "./components/Register";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import CandidateDashboard from "./components/CandidateDashboard";
import EmployerDashboard from "./components/EmployerDashboard";

function App() {

  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user"))
  );

  // LOGIN
  const login = async (email, password) => {
    try {
      const res = await fetch(
        "https://fyp2-backend-gihc.onrender.com/login",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password })
        }
      );
      const data = await res.json();
      if (data.token) {
        localStorage.setItem("user", JSON.stringify(data.user));
        setUser(data.user);
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.log(err);
      alert("Login failed ❌");
    }
  };

  // REGISTER ← 新增
  const register = async ({ email, password, role }, navigate) => {
    try {
      const res = await fetch(
        "https://fyp2-backend-gihc.onrender.com/register",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, role })
        }
      );
      const data = await res.json();
      if (res.ok) {
        alert("Registered ✅ Please login.");
        navigate("/");
      } else {
        alert(data.msg);
      }
    } catch (err) {
      alert("Register failed ❌");
    }
  };

  // LOGOUT
  const logout = () => {
    localStorage.removeItem("user");
    setUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>

        {/* LOGIN */}
        <Route
          path="/"
          element={
            user ? (
              user.role === "employer"
                ? <Navigate to="/employer" />
                : <Navigate to="/candidate" />
            ) : (
              <Login onLogin={login} />
            )
          }
        />

        {/* REGISTER ← 修复：传入 onRegister 和 goLogin */}
        <Route
          path="/register"
          element={
            <RegisterWrapper onRegister={register} />
          }
        />

        {/* FORGOT */}
        <Route path="/forgot" element={<ForgotPassword />} />

        {/* RESET */}
        <Route path="/reset/:token" element={<ResetPassword />} />

        {/* EMPLOYER */}
        <Route
          path="/employer"
          element={
            user?.role === "employer"
              ? <EmployerDashboard user={user} logout={logout} />
              : <Navigate to="/" />
          }
        />

        {/* CANDIDATE */}
        <Route
          path="/candidate"
          element={
            user?.role === "candidate"
              ? <CandidateDashboard user={user} logout={logout} />
              : <Navigate to="/" />
          }
        />

      </Routes>
    </BrowserRouter>
  );
}

// Wrapper 让 Register 拿到 navigate
function RegisterWrapper({ onRegister }) {
  const navigate = useNavigate();
  return (
    <Register
      onRegister={(form) => onRegister(form, navigate)}
      goLogin={() => navigate("/")}
    />
  );
}

export default App;