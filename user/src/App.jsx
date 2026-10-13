import { useState } from "react";
import LandMap from "./components/LandMap";

import "./App.css";

function App() {
  const [showRegister, setShowRegister] = useState(false);

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("landcraftUser")) || null;
    } catch {
      return null;
    }
  });
  

  const handleRegister = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const name = formData.get("name").trim();
    const mobile = formData.get("mobile").trim();
    const email = formData.get("email").trim();
    const password = formData.get("registerPassword");
    const confirmPassword = formData.get("confirmPassword");

    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/register",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            mobile,
            email,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        alert("Account created successfully!");
        event.target.reset();
        setShowRegister(false);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("Unable to connect to the server.");
    }
  };

  const handleLogin = async (event) => {
    event.preventDefault();

    const formData = new FormData(event.target);

    const identifier = formData.get("identifier").trim();
    const password = formData.get("password");

    try {
      const response = await fetch(
        "http://localhost:5000/api/auth/login",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            identifier,
            password,
          }),
        }
      );

      const data = await response.json();

      if (data.success) {
        // Save login token for the current session
        localStorage.setItem("landcraftToken", data.token);

        // Save basic user information
        localStorage.setItem(
          "landcraftUser",
          JSON.stringify(data.user)
        );

        // Tell React that the user is now logged in
        setLoggedInUser(data.user);

        alert("Login successful!");

        console.log("Logged in user:", data.user);
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login error:", error);
      alert("Unable to connect to the server.");
    }
  };

  if (loggedInUser) {
    return (
      <div className="dashboard-page">

        {/* Header */}
        <header className="dashboard-header">
          <div className="dashboard-brand">
            <div className="brand-logo">LC</div>
            <div>
              <h1>LandCraft</h1>
              <span>Land Verification & Survey Platform</span>
            </div>
          </div>

          <button
            className="logout-btn"
            onClick={() => {
              localStorage.removeItem("landcraftToken");
              localStorage.removeItem("landcraftUser");
              setLoggedInUser(null);
            }}
          >
            Logout
          </button>
        </header>

        <main className="dashboard-content">

          {/* Welcome section */}
          <section className="dashboard-hero">
            <div>
              <span className="dashboard-kicker">
                LANDCRAFT DASHBOARD
              </span>

              <h2>
                Digital Land Verification
                <br />
                <span>& Survey Management</span>
              </h2>

              <p>
                Connect recorded land information with mapped
                boundaries and land verification requests.
              </p>

              <a href="#land-map" className="dashboard-map-link">
                View Parcel Map
              </a>
            </div>

            <div className="dashboard-system-status">
              <span />
              System Ready
            </div>
          </section>

          {/* Four summary blocks */}
          <section className="dashboard-overview">

            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">
                  OVERVIEW
                </span>
                <h3>Land Survey Summary</h3>
              </div>

              <span className="demo-badge">Demo Data</span>
            </div>

            <div className="dashboard-stat-grid">

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon parcels-icon">
                  ⬡
                </div>
                <div>
                  <span>Total Parcels</span>
                  <strong>12</strong>
                </div>
              </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon completed-icon">
                  ⚑
                </div>
                <div>
                  <span>Surveys Completed</span>
                  <strong>7</strong>
                </div>
              </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon pending-icon">
                  ⚑
                </div>
                <div>
                  <span>Pending Surveys</span>
                  <strong>5</strong>
                </div>
              </div>

              <div className="dashboard-stat-card">
                <div className="dashboard-stat-icon discrepancy-icon">
                  !
                </div>
                <div>
                  <span>Discrepancies</span>
                  <strong>2</strong>
                </div>
              </div>

            </div>
          </section>

          {/* Interactive map */}
          <section className="dashboard-map-section" id="land-map">

            <div className="dashboard-section-heading">
              <div>
                <span className="dashboard-kicker">
                  PARCEL MAP
                </span>
                <h3>Interactive Land Map</h3>
              </div>
            </div>

            <LandMap />

          </section>

        </main>

        {/* Footer */}
        <footer className="dashboard-footer">
          <div>
            <strong>LANDCRAFT</strong>
            <span>Digital Land Verification Platform</span>
          </div>

          <span>Prototype • V1.0</span>
        </footer>

      </div>
    );
  }

  if (showRegister) {
    return (
      <div className="login-page">
        <div className="login-card">

          <div className="logo">
            <h1>LandCraft</h1>
            <p>Land Verification & Dispute Support</p>
          </div>

          <h2>Create Account</h2>

          <form onSubmit={handleRegister}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                placeholder="Enter your full name"
              />
            </div>

            <div className="form-group">
              <label htmlFor="mobile">Mobile Number</label>
              <input
                type="tel"
                id="mobile"
                name="mobile"
                placeholder="Enter your mobile number"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
              />
            </div>

            <div className="form-group">
              <label htmlFor="registerPassword">Password</label>
              <input
                type="password"
                id="registerPassword"
                name="registerPassword"
                placeholder="Create a password"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">
                Confirm Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                placeholder="Confirm your password"
              />
            </div>

            <button type="submit" className="login-btn">
              Create Account
            </button>
          </form>

          <div className="register-text">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => setShowRegister(false)}
            >
              Login
            </button>
          </div>

        </div>
      </div>
    );
  }

  return (
    <div className="login-page">
      <div className="login-card">

        <div className="logo">
          <h1>LandCraft</h1>
          <p>Land Verification & Dispute Support</p>
        </div>

        <h2>Login</h2>

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="email">Email or Mobile</label>
            <input
              type="text"
              id="email"
              name="identifier"
              placeholder="Enter email or mobile number"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" className="login-btn">
            Login
          </button>
        </form>

        <div className="register-text">
          Don't have an account?{" "}
          <button
            type="button"
            onClick={() => setShowRegister(true)}
          >
            Create Account
          </button>
        </div>

      </div>
    </div>
  );
}

export default App;