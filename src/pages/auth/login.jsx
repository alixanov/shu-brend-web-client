import React, { memo, useState } from "react";
import "./login.css";
import { json, useNavigate } from "react-router-dom";
import axios from "axios";
import bg from "../../assets/bglogin.jpg"

export const Login = memo(() => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    const value = Object.fromEntries(new FormData(e.target));
    try {
      const res = await axios.post(
        "https://shu-brend-web-server.vercel.app/api/login",
        // "http://localhost:8080/api/login",
        value
      );
      // cfsdcscs
      const token = res.data.token;
      const acsess = res.data.success;
      const role = res.data.role;
      localStorage.setItem("access_token", token);
      localStorage.setItem("acsess", JSON.stringify(acsess));
      localStorage.setItem("role", role);
      window.location.reload();
      navigate("/");
      if (role === "admin") {
        navigate("/admin");
      }
    } catch (error) {
      console.error("API xatosi:", error.response?.data || error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login-container">
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-header">
            <h2>Hush kelibsiz</h2>
            <p>Hisobingizga kiring</p>
          </div>

          <label>
            <input
              type="text"
              placeholder="Login"
              autoComplete="off"
              name="login"
              disabled={isLoading}
            />
          </label>

          <label>
            <input
              type="password"
              placeholder="Password"
              name="password"
              disabled={isLoading}
            />
          </label>

          <label>
            <input
              type="submit"
              value={isLoading ? "Yuklanmoqda..." : "Kirish"}
              disabled={isLoading}
            />
            {isLoading && (
              <div className="loading-spinner">
                <div className="spinner"></div>
              </div>
            )}
          </label>
        </form>
      </div>
    </div>
  );
});