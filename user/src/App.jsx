import { useEffect, useState } from "react";
import "./App.css";

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [serverStatus, setServerStatus] = useState("Checking server...");

  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("landcraftUser")) || null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    fetch("http://localhost:5000/")
      .then((response) => response.json())
      .then((data) => {
        setServerStatus(data.message);
      })
      .catch(() => {
        setServerStatus("Backend connection failed");
      });
  }, []);

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

        <header className="dashboard-header">
          <h1>LandCraft</h1>

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

          <div className="dashboard-welcome">
            <h2>Welcome, {loggedInUser.name} 👋</h2>
            <p>
              Manage your land requests and verification status
              from your dashboard.
            </p>
          </div>

          <div className="dashboard-cards">

            <div className="dashboard-card">
              <h3>My Land</h3>
              <p>View your registered land parcels.</p>
            </div>

            <div className="dashboard-card">
              <h3>My Requests</h3>
              <p>Track your submitted land requests.</p>
            </div>

            <div className="dashboard-card">
              <h3>Notifications</h3>
              <p>View updates from LandCraft.</p>
            </div>

            <div className="dashboard-card">
              <h3>Reports</h3>
              <p>View your verification reports.</p>
            </div>

          </div>

        </main>

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
            <p className="server-status">
              {serverStatus}
            </p>
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
          <p className="server-status">
            {serverStatus}
          </p>
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