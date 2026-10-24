import { useState } from "react";
import LandMap from "./components/LandMap";
import LandRequestForm from "./components/LandRequestForm";
import MyRequests from "./components/MyRequests";

import "./App.css";

function App() {
  const [showRegister, setShowRegister] = useState(false);
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [showMyRequests, setShowMyRequests] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [publicMenuOpen, setPublicMenuOpen] = useState(false);

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


  if (!loggedInUser && !showRegister && !showLogin) {
    return (
      <div className="public-page">
        <header className="public-header">
          <a href="/" className="public-brand">
            <img
              src="/download.svg"
              alt="LandCraft"
              className="public-logo-image"
            />
            <span>
              <strong>LandCraft</strong>
              <small>Land Verification & Survey Platform</small>
            </span>
          </a>


          <button
            type="button"
            className="public-menu-toggle"
            aria-label={publicMenuOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={publicMenuOpen}
            onClick={() => setPublicMenuOpen(!publicMenuOpen)}
          >
            {publicMenuOpen ? "✕" : "☰"}
          </button>

          <nav className={`public-nav ${publicMenuOpen ? "public-nav-open" : ""}`}>
            <a href="#features" onClick={() => setPublicMenuOpen(false)}>
              Features
            </a>
            <a href="#how-it-works" onClick={() => setPublicMenuOpen(false)}>
              How It Works
            </a>
            <a href="#public-map" onClick={() => setPublicMenuOpen(false)}>
              Explore Map
            </a>
            <button
              className="public-login-btn"
              onClick={() => {
                setPublicMenuOpen(false);
                setShowLogin(true);
              }}
            >
              Login
            </button>
          </nav>

        </header>

        <main>
          <section className="public-hero">
            <div className="public-hero-content">
              <span className="public-kicker">
                DIGITAL LAND VERIFICATION
              </span>

              <h1>
                Know Your Land.
                <br />
                <span>Understand Your Boundaries.</span>
              </h1>

              <p>
                Explore parcel maps, submit land verification
                requests, and understand boundary differences
                through GPS-based survey information.
              </p>

              <div className="public-hero-actions">
                <a href="#public-map" className="public-primary-btn">
                  Explore Parcel Map
                </a>

              </div>
            </div>

            <div className="public-hero-card">
              <div className="public-map-icon">⌖</div>
              <h3>Land information, connected.</h3>
              <p>
                Recorded parcel information, reference
                boundaries, GPS survey points, and verification
                requests in one platform.
              </p>
              <div className="public-feature-line">
                <span className="public-dot blue-dot" />
                Reference boundary
              </div>
              <div className="public-feature-line">
                <span className="public-dot green-dot" />
                GPS survey boundary
              </div>
              <div className="public-feature-line">
                <span className="public-dot red-dot" />
                Potential overlap area
              </div>
            </div>
          </section>

          <section className="public-section" id="features">
            <div className="public-section-heading">
              <span className="public-kicker">PLATFORM FEATURES</span>
              <h2>Everything starts with better land information.</h2>
              <p>
                Explore the tools LandCraft brings together
                for land mapping and survey workflows.
              </p>
            </div>

            <div className="public-feature-grid">
              <article className="public-feature-card">
                <span>⌖</span>
                <h3>Parcel Mapping</h3>
                <p>
                  Explore available parcel information
                  through an interactive map.
                </p>
              </article>

              <article className="public-feature-card">
                <span>⌁</span>
                <h3>GPS-Based Surveys</h3>
                <p>
                  Collect survey boundary points and
                  view their coordinates.
                </p>
              </article>

              <article className="public-feature-card">
                <span>◇</span>
                <h3>Boundary Comparison</h3>
                <p>
                  Compare reference and surveyed boundaries
                  to investigate possible differences.
                </p>
              </article>

              <article className="public-feature-card">
                <span>▤</span>
                <h3>Verification Requests</h3>
                <p>
                  Submit a land issue or verification
                  request through your account.
                </p>
              </article>
            </div>
          </section>

          <section className="public-section public-process" id="how-it-works">
            <div className="public-section-heading">
              <span className="public-kicker">HOW IT WORKS</span>
              <h2>A simple path from mapping to review.</h2>
            </div>

            <div className="public-steps">
              <article>
                <span>01</span>
                <h3>Explore</h3>
                <p>Review the parcel information available on the map.</p>
              </article>

              <article>
                <span>02</span>
                <h3>Submit a Request</h3>
                <p>Create an account to submit and track a request.</p>
              </article>

              <article>
                <span>03</span>
                <h3>Survey</h3>
                <p>Collect reference and GPS survey boundary points.</p>
              </article>

              <article>
                <span>04</span>
                <h3>Review Results</h3>
                <p>Review available comparison results and reports.</p>
              </article>
            </div>
          </section>

          <section className="public-section public-map-section" id="public-map">
            <div className="public-section-heading">
              <span className="public-kicker">EXPLORE THE MAP</span>
              <h2>See the land map in action.</h2>
              <p>
                Explore the parcel map below. Account access
                is required for personal requests and dashboard features.
              </p>
            </div>

            <div className="public-map-container">
              <LandMap />
            </div>
          </section>

          <section className="public-cta">
            <h2>Ready to get started?</h2>
            <p>
              Create an account to submit verification requests
              and access your personal dashboard.
            </p>

            <button
              onClick={() => setShowRegister(true)}
            >
              Create Your Account
            </button>

            <button
              className="public-cta-login"
              onClick={() => setShowLogin(true)}
            >
              Already registered? Login
            </button>
          </section>
        </main>

        <footer className="public-footer">
          <div>
            <strong>LANDCRAFT</strong>
            <p>Land Verification & Survey Platform</p>
          </div>
          <span>Prototype • V1.0</span>
        </footer>
      </div>
    );
  }


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
            type="button"
            className="dashboard-menu-toggle"
            aria-label={mobileNavOpen ? "Close navigation" : "Open navigation"}
            aria-expanded={mobileNavOpen}
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
          >
            {mobileNavOpen ? "✕" : "☰"}
          </button>

          <nav
            className={`user-dashboard-nav ${mobileNavOpen ? "mobile-nav-open" : ""}`}
            aria-label="Dashboard navigation"
          >
            <a href="#dashboard-overview" onClick={() => setMobileNavOpen(false)}>Overview</a>
            <a href="#dashboard-features" onClick={() => setMobileNavOpen(false)}>Features</a>
            <a href="#dashboard-how-it-works" onClick={() => setMobileNavOpen(false)}>How It Works</a>
            <a href="#land-map" onClick={() => setMobileNavOpen(false)}>Explore Map</a>
            <button
              type="button"
              onClick={() => {
                setShowRequestForm(false);
                setShowMyRequests(true);
                document.querySelector(".dashboard-content")
                  ?.scrollIntoView({ behavior: "smooth" });
                setMobileNavOpen(false);
              }}
            >
              My Requests
            </button>
            <a href="#dashboard-help" onClick={() => setMobileNavOpen(false)}>Help</a>

            <button
              className="logout-btn style-logout"

              onClick={() => {
                localStorage.removeItem("landcraftToken");
                localStorage.removeItem("landcraftUser");

                setLoggedInUser(null);
                setShowLogin(false);
                setShowRegister(false);
                setShowRequestForm(false);
                setShowMyRequests(false);
                setMobileNavOpen(false);

                window.history.replaceState(null, "", "/");
              }}

            >
              Logout
            </button>

          </nav>

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

              <div className="dashboard-hero-actions">
                <a href="#land-map" className="dashboard-map-link">
                  View Parcel Map
                </a>

                <button
                  type="button"
                  className="dashboard-request-link request-btn"
                  onClick={() => {
                    setShowMyRequests(false);
                    setShowRequestForm(true);
                  }}
                >
                  Report Land Issue / Request Verification
                </button>

                <button
                  type="button"
                  className="dashboard-request-link"
                  onClick={() => {
                    setShowRequestForm(false);
                    setShowMyRequests((current) => !current);
                  }}
                >
                  {showMyRequests ? "Back to Dashboard" : "My Requests"}
                </button>
              </div>

            </div>

            <div className="dashboard-system-status">
              <span />
              System Ready
            </div>
          </section>

          {showRequestForm && (
            <LandRequestForm
              onClose={() => setShowRequestForm(false)}
            />
          )}

          {showMyRequests && <MyRequests />}

          {/* Four summary blocks */}
          <section className="dashboard-overview" id="dashboard-overview">

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


          {/* Features section */}
          <section className="public-section" id="dashboard-features">
            <div className="public-section-heading">
              <span className="public-kicker">PLATFORM FEATURES</span>
              <h2>Everything starts with better land information.</h2>
              <p>
                Explore the tools LandCraft brings together for land mapping
                and survey workflows.
              </p>
            </div>

            <div className="public-feature-grid">
              <article className="public-feature-card">
                <span>⌖</span>
                <h3>Parcel Mapping</h3>
                <p>Explore available parcel information through an interactive map.</p>
              </article>

              <article className="public-feature-card">
                <span>⌁</span>
                <h3>GPS-Based Surveys</h3>
                <p>Collect survey boundary points and view their coordinates.</p>
              </article>

              <article className="public-feature-card">
                <span>◇</span>
                <h3>Boundary Comparison</h3>
                <p>Compare reference and surveyed boundaries to investigate possible differences.</p>
              </article>

              <article className="public-feature-card">
                <span>▤</span>
                <h3>Verification Requests</h3>
                <p>Submit a land issue or verification request through your account.</p>
              </article>
            </div>
          </section>

          {/* How It Works section */}
          <section className="public-section public-process" id="dashboard-how-it-works">
            <div className="public-section-heading">
              <span className="public-kicker">HOW IT WORKS</span>
              <h2>A simple path from mapping to review.</h2>
            </div>

            <div className="public-steps">
              <article>
                <span>01</span>
                <h3>Explore</h3>
                <p>Review the parcel information available on the map.</p>
              </article>

              <article>
                <span>02</span>
                <h3>Submit a Request</h3>
                <p>Create and track a land verification request through your account.</p>
              </article>

              <article>
                <span>03</span>
                <h3>Survey</h3>
                <p>Collect reference and GPS survey boundary points.</p>
              </article>

              <article>
                <span>04</span>
                <h3>Review Results</h3>
                <p>Review available comparison results and reports.</p>
              </article>
            </div>
          </section>

          <section className="dashboard-help" id="dashboard-help">
            <span className="dashboard-kicker">NEED HELP?</span>
            <h3>How can LandCraft help you?</h3>
            <p>
              Explore parcel information, submit a land verification request,
              and track its status from My Requests.
            </p>
            <button
              type="button"
              onClick={() => {
                setShowMyRequests(false);
                setShowRequestForm(true);
                document.querySelector(".dashboard-content")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Submit a Verification Request
            </button>
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
              onClick={() => {
                setShowRegister(false);
                setShowLogin(true);
              }}
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