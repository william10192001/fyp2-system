import React, { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
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
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            email,
            password
          })
        }
      );

      const data = await res.json();

      if (data.token) {

        localStorage.setItem(
          "user",
          JSON.stringify(data.user)
        );

        setUser(data.user);

      } else {

        alert(data.msg);
      }

    } catch (err) {

      console.log(err);

      alert("Login failed ❌");
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

        {/* REGISTER */}
        <Route
          path="/register"
          element={<Register />}
        />

        {/* FORGOT */}
        <Route
          path="/forgot"
          element={<ForgotPassword />}
        />

        {/* RESET */}
        <Route
          path="/reset/:token"
          element={<ResetPassword />}
        />

        {/* EMPLOYER */}
        <Route
          path="/employer"
          element={
            user?.role === "employer"
              ? (
                <EmployerDashboard
                  user={user}
                  logout={logout}
                />
              )
              : <Navigate to="/" />
          }
        />

        {/* CANDIDATE */}
        <Route
          path="/candidate"
          element={
            user?.role === "candidate"
              ? (
                <CandidateDashboard
                  user={user}
                  logout={logout}
                />
              )
              : <Navigate to="/" />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;