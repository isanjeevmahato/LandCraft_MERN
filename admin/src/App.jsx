import "./App.css";
import { useEffect, useState } from "react";
import "leaflet/dist/leaflet.css";
import SurveyMap from "./SurveyMap";

const API = import.meta.env.VITE_API_URL || "";

function App() {
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [adminToken, setAdminToken] = useState("");
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);
  const [gpsPaused, setGpsPaused] = useState(false);
  const [surveyPoints, setSurveyPoints] = useState([]);
  const [surveyParties, setSurveyParties] = useState([
    {
      id: 1,
      name: "Party 1",
      color: "#2563eb",
      points: [],
      completed: false,
    },
  ]);
  const [activePartyId, setActivePartyId] = useState(1);
  const activeParty =
    surveyParties.find((party) => party.id === activePartyId) ||
    surveyParties[0];
  const [activePage, setActivePage] = useState("requests");
  const [error, setError] = useState("");
  const [showSetupForm, setShowSetupForm] = useState(false);
  const [setupEmail, setSetupEmail] = useState("");
  const [setupKey, setSetupKey] = useState("");
  const [setupLoading, setSetupLoading] = useState(false);
  const [setupError, setSetupError] = useState("");
  const [setupMessage, setSetupMessage] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState({});
  const [updatingRequestId, setUpdatingRequestId] = useState("");
  const [viewingRequest, setViewingRequest] = useState(null);
  const [surveyDate, setSurveyDate] = useState("");
  const [assignedFieldTeam, setAssignedFieldTeam] = useState("");
  const [assignedRover, setAssignedRover] = useState("");
  const [schedulingRequestId, setSchedulingRequestId] = useState("");
  const [scheduleError, setScheduleError] = useState("");
  const [scheduleMessage, setScheduleMessage] = useState("");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewStatus, setReviewStatus] = useState("Submitted");
  const [reviewSaving, setReviewSaving] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewMessage, setReviewMessage] = useState("");
  const [referenceFile, setReferenceFile] = useState(null);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  async function verifyAdmin(token) {
    const response = await fetch(`${API}/api/admin/requests`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await response.json();

    if (response.status === 403) {
      throw new Error("This account is not authorized for Admin access.");
    }

    if (response.status === 401) {
      throw new Error("Your session has expired. Please log in again.");
    }

    if (!response.ok || !data.success) {
      throw new Error(data.message || "Unable to load Admin requests.");
    }

    setAdminToken(token);
    setRequests(data.requests || []);
    setError("");
  }


  async function fetchLatestGPS() {
    setGpsLoading(true);
    setGpsError("");

    try {
      const token = adminToken ||
        localStorage.getItem("landcraftAdminToken");

      if (!token) {
        throw new Error("Please log in as Admin.");
      }

      const response = await fetch(`${API}/api/gps/latest`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        cache: "no-store",
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to retrieve GPS location."
        );
      }

      setGpsLocation(data.location);
    } catch (err) {
      setGpsError(err.message || "Unable to connect to GPS service.");
    } finally {
      setGpsLoading(false);
    }
  }


  const startPhoneGPS = () => {
    if (!navigator.geolocation) {
      setGpsError("GPS is not supported by this browser.");
      return;
    }

    setGpsPaused(false);
    setGpsLoading(true);
    setGpsError("");

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          satellites: "Phone GPS",
        });

        setGpsLoading(false);
      },
      (error) => {
        setGpsError(
          error.message || "Unable to access phone GPS."
        );
        setGpsLoading(false);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 20000,
      }
    );
  };


  function saveSurveyPoint() {
    if (!gpsLocation) {
      setGpsError("No GPS coordinates available. Refresh GPS first.");
      return;
    }

    const newPoint = {
      id: 1,
      latitude: Number(gpsLocation.latitude),
      longitude: Number(gpsLocation.longitude),
      satellites: gpsLocation.satellites ?? null,
      savedAt: new Date().toISOString(),
    };

    setSurveyParties((previousParties) =>
      previousParties.map((party) => {
        if (party.id !== activePartyId) return party;

        return {
          ...party,
          points: [
            ...party.points,
            {
              ...newPoint,
              id: party.points.length + 1,
            },
          ],
        };
      })
    );

    setGpsPaused(true);
    setGpsError("");
  }



  function clearSurveyPoints() {
    if (!activeParty || activeParty.points.length === 0) {
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete all saved points for ${activeParty.name}? This cannot be undone.`
    );

    if (!confirmed) return;

    setSurveyParties((previousParties) =>
      previousParties.map((party) =>
        party.id === activePartyId
          ? { ...party, points: [], completed: false }
          : party
      )
    );

    setGpsPaused(false);
    setGpsError("");
  }


  useEffect(() => {
    if (activePage !== "survey" || gpsPaused) {
      return;
    }

    // Fetch coordinates immediately when Field Survey opens.
    fetchLatestGPS();

    // Refresh coordinates every 2 seconds.
    const gpsInterval = setInterval(() => {
      fetchLatestGPS();
    }, 2000);

    // Stop refreshing when leaving the page or pausing GPS.
    return () => {
      clearInterval(gpsInterval);
    };
  }, [activePage, gpsPaused]);


  useEffect(() => {
    let active = true;

    async function restoreSession() {
      const savedToken = localStorage.getItem("landcraftAdminToken");

      if (savedToken) {
        try {
          const response = await fetch(`${API}/api/admin/requests`, {
            headers: {
              Authorization: `Bearer ${savedToken}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.success && active) {
            setAdminToken(savedToken);
            setRequests(data.requests || []);
          } else {
            localStorage.removeItem("landcraftAdminToken");
          }
        } catch {
          if (active) {
            setError("Cannot connect to the server. Check that it is running.");
          }
        }
      }

      if (active) {
        setCheckingSession(false);
      }
    }

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch(`${API}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.token) {
        throw new Error(data.message || "Invalid login credentials.");
      }

      // Verify Admin permissions before saving the Admin session.
      await verifyAdmin(data.token);

      localStorage.setItem("landcraftAdminToken", data.token);
      setPassword("");
    } catch (err) {
      setError(err.message || "Admin login failed.");
    } finally {
      setLoading(false);
    }
  }

  async function handleInitialSetup(event) {
    event.preventDefault();

    setSetupLoading(true);
    setSetupError("");
    setSetupMessage("");

    try {
      const response = await fetch(`${API}/api/admin/setup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: setupEmail.trim(),
          setupKey,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Admin setup failed.");
      }

      setSetupMessage(
        "Admin account created successfully. You can now log in."
      );

      setIdentifier(setupEmail.trim());
      setPassword("");
      setSetupEmail("");
      setSetupKey("");
      setShowSetupForm(false);
    } catch (err) {
      setSetupError(err.message || "Unable to complete Admin setup.");
    } finally {
      setSetupLoading(false);
    }
  }


  async function handleStatusUpdate(requestId) {
    const status = selectedStatuses[requestId];

    if (!status) return;

    setUpdatingRequestId(requestId);
    setError("");

    try {
      const response = await fetch(
        `${API}/api/admin/requests/${encodeURIComponent(requestId)}/status`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({ status }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to update request status.");
      }

      setRequests((current) =>
        current.map((request) =>
          request.requestId === requestId
            ? {
              ...request,
              status: data.request.status,
              updatedAt: data.request.updatedAt,
            }
            : request
        )
      );

      setSelectedStatuses((current) => ({
        ...current,
        [requestId]: data.request.status,
      }));
    } catch (err) {
      setError(err.message || "Unable to update request status.");
    } finally {
      setUpdatingRequestId("");
    }
  }


  async function handleScheduleSurvey(event) {
    event.preventDefault();

    if (!viewingRequest) return;

    if (!surveyDate || !assignedFieldTeam.trim()) {
      setScheduleError("Survey date and field team are required.");
      return;
    }

    const selectedDate = new Date(surveyDate);

    if (
      Number.isNaN(selectedDate.getTime()) ||
      selectedDate <= new Date()
    ) {
      setScheduleError("Choose a valid future survey date and time.");
      return;
    }

    setSchedulingRequestId(viewingRequest.requestId);
    setScheduleError("");
    setScheduleMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/requests/${encodeURIComponent(
          viewingRequest.requestId
        )}/schedule`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            surveyDate: selectedDate.toISOString(),
            assignedFieldTeam: assignedFieldTeam.trim(),
            assignedRover: assignedRover.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to schedule the survey."
        );
      }

      const updatedRequest = data.request;

      setRequests((current) =>
        current.map((request) =>
          request.requestId === updatedRequest.requestId
            ? { ...request, ...updatedRequest }
            : request
        )
      );

      setViewingRequest((current) =>
        current?.requestId === updatedRequest.requestId
          ? { ...current, ...updatedRequest }
          : current
      );

      setSelectedStatuses((current) => ({
        ...current,
        [updatedRequest.requestId]: updatedRequest.status,
      }));

      setScheduleMessage("Survey scheduled successfully.");
    } catch (err) {
      setScheduleError(
        err.message || "Unable to connect to the server."
      );
    } finally {
      setSchedulingRequestId("");
    }
  }


  async function handleSaveReview(event) {
    event.preventDefault();

    if (!viewingRequest) return;

    if (reviewNotes.length > 2000) {
      setReviewError("Review notes cannot exceed 2000 characters.");
      return;
    }

    setReviewSaving(true);
    setReviewError("");
    setReviewMessage("");

    try {
      const response = await fetch(
        `${API}/api/admin/requests/${encodeURIComponent(
          viewingRequest.requestId
        )}/review`,
        {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${adminToken}`,
          },
          body: JSON.stringify({
            adminNotes: reviewNotes,
            status: reviewStatus,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to save the review.");
      }

      const updatedRequest = data.request;

      setRequests((current) =>
        current.map((request) =>
          request.requestId === updatedRequest.requestId
            ? { ...request, ...updatedRequest }
            : request
        )
      );

      setViewingRequest((current) =>
        current?.requestId === updatedRequest.requestId
          ? { ...current, ...updatedRequest }
          : current
      );

      setSelectedStatuses((current) => ({
        ...current,
        [updatedRequest.requestId]: updatedRequest.status,
      }));

      setReviewStatus(updatedRequest.status);
      setReviewNotes(updatedRequest.adminNotes || "");
      setReviewMessage("Review saved successfully.");
    } catch (err) {
      setReviewError(err.message || "Unable to save the review.");
    } finally {
      setReviewSaving(false);
    }
  }


  function handleLogout() {
    localStorage.removeItem("landcraftAdminToken");
    setAdminToken("");
    setRequests([]);
    setIdentifier("");
    setPassword("");
    setError("");
  }

  const submittedCount = requests.filter(
    (request) => request.status === "Submitted"
  ).length;

  const activeCount = requests.filter(
    (request) =>
      !["Submitted", "Rejected", "Report Ready"].includes(request.status)
  ).length;

  if (checkingSession) {
    return (
      <main className="admin-page">
        <p>Verifying Admin session...</p>
      </main>
    );
  }

  return (
    <main className="admin-page">

      {!adminToken ? (
        <section className="login-card">
          <div className="brand">LandCraft</div>
          <p className="subtitle">ADMINISTRATION PORTAL</p>


          <h1>Admin Login</h1>

          <p className="muted">
            Sign in with your authorized LandCraft administrator account.
          </p>

          <form onSubmit={handleLogin}>
            <label className="field-label" htmlFor="identifier">
              Email or Mobile Number
            </label>

            <input
              id="identifier"
              className="field-input"
              value={identifier}
              onChange={(event) => setIdentifier(event.target.value)}
              autoComplete="username"
              required
            />

            <label className="field-label" htmlFor="password">
              Password
            </label>

            <input
              id="password"
              className="field-input"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              required
            />

            {error && <div className="error-message">{error}</div>}

            <button
              type="submit"
              className="primary-button login-button"
              disabled={loading}
            >
              {loading ? "Verifying access..." : "Sign In to Admin"}
            </button>
          </form>

          {setupMessage && (
            <div
              style={{
                marginTop: "16px",
                padding: "12px",
                borderRadius: "8px",
                background: "#e4f6ea",
                color: "#168348",
                fontSize: "13px",
              }}
            >
              {setupMessage}
            </div>
          )}

        </section>
      ) : (
        <>

          <header className="admin-header">

            <div className="brand-container">
              <img
                src="/download.svg"
                alt="LandCraft"
                className="admin-logo-image"
              />

              <div className="brand-text">
                <div className="brand">LandCraft</div>
                <div className="subtitle">ADMINISTRATION PORTAL</div>
              </div>
            </div>


            <button
              type="button"
              className="admin-menu-toggle"
              aria-label={adminMenuOpen ? "Close navigation" : "Open navigation"}
              aria-expanded={adminMenuOpen}
              onClick={() => setAdminMenuOpen(!adminMenuOpen)}
            >
              {adminMenuOpen ? "✕" : "☰"}
            </button>

            <nav
              className={`admin-navigation ${adminMenuOpen ? "admin-navigation-open" : ""}`}
            >
              <button
                type="button"
                className={activePage === "requests" ? "active" : ""}
                onClick={() => {
                  setActivePage("requests");
                  setAdminMenuOpen(false);
                }}
              >
                Request Inbox
              </button>

              <button
                type="button"
                className={activePage === "survey" ? "active" : ""}
                onClick={() => {
                  setActivePage("survey");
                  fetchLatestGPS();
                  setAdminMenuOpen(false);
                }}
              >
                Field Survey
              </button>

              <button
                type="button"
                className={activePage === "references" ? "active" : ""}
                onClick={() => {
                  setActivePage("references");
                  setAdminMenuOpen(false);
                }}
              >
                Reference Maps
              </button>

              <button
                type="button"
                className="secondary-button"
                onClick={handleLogout}
              >
                Log Out
              </button>
            </nav>
          </header>


          {activePage === "requests" && (
            <section className="inbox">
              <div className="inbox-heading">
                <div>
                  <h1>Admin Request Inbox</h1>
                  <p className="muted">
                    Review land requests submitted by registered users.
                  </p>
                </div>
                <button
                  className="secondary-button"
                  onClick={async () => {
                    try {
                      setError("");
                      await verifyAdmin(adminToken);
                    } catch (err) {
                      setError(err.message);
                      if (err.message.includes("not authorized") ||
                        err.message.includes("session has expired")) {
                        handleLogout();
                      }
                    }
                  }}
                >
                  Refresh Requests
                </button>
              </div>

              <div className="stats">
                <div className="stat-card">
                  <div className="stat-value">{requests.length}</div>
                  <div className="stat-label">Total Requests</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{submittedCount}</div>
                  <div className="stat-label">Awaiting Initial Review</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{activeCount}</div>
                  <div className="stat-label">In Progress</div>
                </div>
              </div>

              {error && <div className="error-message">{error}</div>}

              <section className="request-panel">
                <div className="panel-heading">
                  <h2>Submitted Land Requests</h2>
                  <p className="muted">
                    The newest submissions appear first.
                  </p>
                </div>

                {requests.length === 0 ? (
                  <div className="empty-state">
                    <h3>No requests found</h3>
                    <p className="muted">
                      User submissions will appear here when available.
                    </p>
                  </div>
                ) : (
                  <div className="table-scroll">
                    <table>
                      <thead>
                        <tr>
                          <th>Request ID</th>
                          <th>Request Type</th>
                          <th>Plot ID</th>
                          <th>Location</th>
                          <th>Claimants</th>
                          <th>Status</th>
                          <th>Update Status</th>
                          <th>Submitted</th>
                          <th>Details</th>
                        </tr>
                      </thead>
                      <tbody>
                        {requests.map((request) => (
                          <tr key={request._id || request.requestId}>
                            <td className="request-id">{request.requestId}</td>
                            <td>{request.requestType}</td>
                            <td>{request.plotId || "—"}</td>
                            <td>{request.location}</td>
                            <td>{request.parties?.length || 0}</td>
                            <td>
                              <span
                                className={`status status-${request.status
                                  .toLowerCase()
                                  .replace(/\s+/g, "-")}`}
                              >
                                {request.status}
                              </span>
                            </td>

                            <td>
                              <div className="status-actions">
                                <select
                                  className="status-select"
                                  value={selectedStatuses[request.requestId] ?? request.status}
                                  onChange={(event) =>
                                    setSelectedStatuses((current) => ({
                                      ...current,
                                      [request.requestId]: event.target.value,
                                    }))
                                  }
                                  aria-label={`Update status for ${request.requestId}`}
                                >
                                  {[
                                    "Submitted",
                                    "Under Review",
                                    "More Information Required",
                                    "Rejected",
                                    "Survey Scheduled",
                                    "Field Survey",
                                    "Verification",
                                    "Report Ready",
                                  ].map((status) => (
                                    <option key={status} value={status}>
                                      {status}
                                    </option>
                                  ))}
                                </select>

                                <button
                                  type="button"
                                  className="status-save-button"
                                  disabled={
                                    updatingRequestId === request.requestId ||
                                    (selectedStatuses[request.requestId] ?? request.status) ===
                                    request.status
                                  }
                                  onClick={() => handleStatusUpdate(request.requestId)}
                                >
                                  {updatingRequestId === request.requestId ? "Saving..." : "Save"}
                                </button>
                              </div>
                            </td>

                            <td>
                              {new Date(request.createdAt).toLocaleDateString(
                                "en-IN"
                              )}
                            </td>

                            <td>
                              <button
                                type="button"
                                className="view-details-button"
                                onClick={() => {
                                  setViewingRequest(request);
                                  setReviewNotes(request.adminNotes || "");
                                  setReviewStatus(request.status);
                                  setReviewError("");
                                  setReviewMessage("");

                                  const date = request.surveyDate
                                    ? new Date(request.surveyDate)
                                    : null;

                                  if (date && !Number.isNaN(date.getTime())) {
                                    const localDate = new Date(
                                      date.getTime() - date.getTimezoneOffset() * 60000
                                    );

                                    setSurveyDate(localDate.toISOString().slice(0, 16));
                                  } else {
                                    setSurveyDate("");
                                  }

                                  setAssignedFieldTeam(request.assignedFieldTeam || "");
                                  setAssignedRover(request.assignedRover || "");
                                  setScheduleError("");
                                  setScheduleMessage("");
                                }}
                              >
                                View Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
              {viewingRequest && (
                <div className="details-overlay">
                  <section className="details-modal">
                    <div className="details-modal-header">
                      <div>
                        <span className="details-kicker">REQUEST REVIEW</span>
                        <h2>Request Details</h2>
                        <p>{viewingRequest.requestId}</p>
                      </div>

                      <button
                        type="button"
                        className="details-close-button"
                        onClick={() => setViewingRequest(null)}
                        aria-label="Close request details"
                      >
                        &times;
                      </button>
                    </div>

                    <div className="details-grid">
                      <div>
                        <span>Request Type</span>
                        <strong>{viewingRequest.requestType}</strong>
                      </div>

                      <div>
                        <span>Plot ID</span>
                        <strong>{viewingRequest.plotId || "Not provided"}</strong>
                      </div>

                      <div>
                        <span>Location</span>
                        <strong>{viewingRequest.location}</strong>
                      </div>

                      <div>
                        <span>Current Status</span>
                        <strong>{viewingRequest.status}</strong>
                      </div>
                    </div>

                    <div className="details-description">
                      <h3>Issue Description</h3>
                      <p>
                        {viewingRequest.description || "No description provided."}
                      </p>
                    </div>

                    <div className="details-parties">
                      <h3>Claimants ({viewingRequest.parties?.length || 0})</h3>

                      {viewingRequest.parties?.length ? (
                        viewingRequest.parties.map((party, index) => (
                          <article className="details-party-card" key={party._id || index}>
                            <h4>{party.name || `Claimant ${index + 1}`}</h4>

                            <p>
                              <strong>Mobile:</strong>{" "}
                              {party.mobile || "Not provided"}
                            </p>

                            <p>
                              <strong>Claim Details:</strong>{" "}
                              {party.claimDescription || "Not provided"}
                            </p>
                          </article>
                        ))
                      ) : (
                        <p>No claimant details available.</p>
                      )}
                    </div>


                    <section className="admin-review-section">
                      <div className="admin-review-heading">
                        <h3>Admin Review</h3>
                        <p>
                          Record your observations and update the request status.
                        </p>
                      </div>

                      <form className="admin-review-form" onSubmit={handleSaveReview}>
                        <div className="review-form-field">
                          <label htmlFor="reviewStatus">Review Status</label>

                          <select
                            id="reviewStatus"
                            className="review-status-select"
                            value={reviewStatus}
                            onChange={(event) => setReviewStatus(event.target.value)}
                          >
                            {[
                              "Submitted",
                              "Under Review",
                              "More Information Required",
                              "Rejected",
                              "Survey Scheduled",
                              "Field Survey",
                              "Verification",
                              "Report Ready",
                            ].map((status) => (
                              <option key={status} value={status}>
                                {status}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="review-form-field">
                          <label htmlFor="reviewNotes">Review Notes</label>

                          <textarea
                            id="reviewNotes"
                            className="review-notes-input"
                            value={reviewNotes}
                            onChange={(event) => setReviewNotes(event.target.value)}
                            placeholder="Enter your review notes or information requested from the applicant..."
                            rows={4}
                            maxLength={2000}
                          />

                          <span className="review-character-count">
                            {reviewNotes.length}/2000 characters
                          </span>
                        </div>

                        {reviewError && (
                          <p className="review-feedback review-feedback-error" role="alert">
                            {reviewError}
                          </p>
                        )}

                        {reviewMessage && (
                          <p className="review-feedback review-feedback-success" role="status">
                            {reviewMessage}
                          </p>
                        )}

                        <button
                          type="submit"
                          className="primary-button review-save-button"
                          disabled={reviewSaving}
                        >
                          {reviewSaving ? "Saving Review..." : "Save Review"}
                        </button>
                      </form>
                    </section>

                    <section className="survey-schedule-section">
                      <div className="survey-schedule-heading">
                        <h3>Schedule Field Survey</h3>
                        <p>
                          Assign a date, field team, and optional rover for this request.
                        </p>
                      </div>

                      <form
                        className="survey-schedule-form"
                        onSubmit={handleScheduleSurvey}
                      >
                        <div className="survey-form-field">
                          <label htmlFor="surveyDate">
                            Survey Date and Time *
                          </label>

                          <input
                            id="surveyDate"
                            type="datetime-local"
                            className="field-input"
                            value={surveyDate}
                            onChange={(event) => setSurveyDate(event.target.value)}
                            min={new Date(
                              Date.now() - new Date().getTimezoneOffset() * 60000
                            ).toISOString().slice(0, 16)}
                            required
                          />
                        </div>

                        <div className="survey-form-field">
                          <label htmlFor="assignedFieldTeam">
                            Assigned Field Team *
                          </label>

                          <input
                            id="assignedFieldTeam"
                            type="text"
                            className="field-input"
                            placeholder="e.g. Field Team Alpha"
                            value={assignedFieldTeam}
                            onChange={(event) =>
                              setAssignedFieldTeam(event.target.value)
                            }
                            maxLength={100}
                            required
                          />
                        </div>

                        <div className="survey-form-field">
                          <label htmlFor="assignedRover">
                            Assigned Rover (Optional)
                          </label>

                          <input
                            id="assignedRover"
                            type="text"
                            className="field-input"
                            placeholder="e.g. Rover-01"
                            value={assignedRover}
                            onChange={(event) =>
                              setAssignedRover(event.target.value)
                            }
                            maxLength={100}
                          />
                        </div>

                        {scheduleError && (
                          <p className="schedule-message schedule-error" role="alert">
                            {scheduleError}
                          </p>
                        )}

                        {scheduleMessage && (
                          <p className="schedule-message schedule-success" role="status">
                            {scheduleMessage}
                          </p>
                        )}

                        <button
                          type="submit"
                          className="primary-button schedule-submit-button"
                          disabled={
                            schedulingRequestId === viewingRequest.requestId
                          }
                        >
                          {schedulingRequestId === viewingRequest.requestId
                            ? "Scheduling..."
                            : "Schedule Survey"}
                        </button>
                      </form>
                    </section>

                    <button
                      type="button"
                      className="primary-button details-done-button"
                      onClick={() => setViewingRequest(null)}
                    >
                      Close Details
                    </button>
                  </section>
                </div>
              )}
            </section>
          )}


          {activePage === "survey" && (
            <section className="inbox">
              <div className="inbox-heading">
                <div>
                  <h1>Field Survey</h1>
                  <p className="muted">
                    Live GPS data received from the LandCraft rover.
                  </p>
                </div>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={fetchLatestGPS}
                  disabled={gpsLoading}
                >
                  {gpsLoading ? "Fetching..." : "Refresh GPS"}
                </button>

                <button
                  type="button"
                  className="secondary-button"
                  onClick={startPhoneGPS}
                  disabled={gpsLoading}
                >
                  Use Phone GPS
                </button>

              </div>

              {gpsError && (
                <div className="error-message">{gpsError}</div>
              )}

              {gpsLocation ? (
                <div className="stats">
                  <div className="stat-card">
                    <div className="stat-value">
                      {gpsLocation.latitude}
                    </div>
                    <div className="stat-label">Latitude</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-value">
                      {gpsLocation.longitude}
                    </div>
                    <div className="stat-label">Longitude</div>
                  </div>

                  <div className="stat-card">
                    <div className="stat-value">
                      {gpsLocation.satellites ?? "—"}
                    </div>
                    <div className="stat-label">Satellites</div>
                  </div>
                </div>
              ) : (
                <div className="empty-state">
                  {gpsLoading
                    ? "Fetching GPS coordinates..."
                    : "Click Refresh GPS to load the latest coordinates."}
                </div>
              )}


              <div className="survey-parties-panel">
                <div className="inbox-heading">
                  <div>
                    <h2>Survey Parties</h2>
                    <p className="muted">
                      Select a party before saving rover GPS points.
                    </p>
                  </div>

                  <button
                    type="button"
                    className="primary-button"
                    onClick={() => {
                      const nextId =
                        Math.max(0, ...surveyParties.map((party) => party.id)) + 1;

                      const colors = [
                        "#2563eb",
                        "#eab308",
                        "#16a34a",
                        "#9333ea",
                        "#ea580c",
                        "#0891b2",
                      ];

                      setSurveyParties((previous) => [
                        ...previous,
                        {
                          id: nextId,
                          name: `Party ${nextId}`,
                          color: colors[(nextId - 1) % colors.length],
                          points: [],
                          completed: false,
                        },
                      ]);

                      setActivePartyId(nextId);
                      setGpsPaused(false);
                      setGpsError("");
                      fetchLatestGPS();
                    }}
                  >
                    + Add Party
                  </button>
                </div>

                <div className="survey-party-list">
                  {surveyParties.map((party) => (

                    <button
                      type="button"
                      key={party.id}
                      className={
                        activePartyId === party.id
                          ? "survey-party-button active"
                          : "survey-party-button"
                      }
                      onClick={() => {
                        setActivePartyId(party.id);
                        setGpsPaused(false);
                        setGpsError("");
                        fetchLatestGPS();
                      }}
                    >
                      <span
                        className="survey-party-color"
                        style={{ backgroundColor: party.color }}
                      />

                      <span className="survey-party-details">
                        <strong>{party.name}</strong>
                        <small>
                          {party.points.length} saved point
                          {party.points.length === 1 ? "" : "s"}
                        </small>
                      </span>

                      <span className="survey-party-next">
                        Next: P{party.points.length + 1}
                      </span>
                    </button>

                  ))}
                </div>
              </div>


              <div className="survey-point-actions">
                <button
                  type="button"
                  onClick={saveSurveyPoint}
                  disabled={!gpsLocation || gpsPaused}
                >
                  Save {activeParty.name} P{activeParty.points.length + 1}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setGpsPaused(false);
                    fetchLatestGPS();
                  }}
                  disabled={!gpsPaused}
                >
                  Resume GPS
                </button>

                <button
                  type="button"
                  onClick={clearSurveyPoints}
                  disabled={activeParty.points.length === 0}
                >
                  Clear Points
                </button>

              </div>

              {activeParty.points.length > 0 && (
                <div className="saved-points">
                  <h2>Saved Survey Points — {activeParty.name}</h2>

                  {activeParty.points.map((point) => (
                    <div className="saved-point" key={point.id}>
                      <strong>P{point.id}</strong>
                      <span>Latitude: {point.latitude}</span>
                      <span>Longitude: {point.longitude}</span>
                    </div>
                  ))}
                </div>
              )}

              <SurveyMap
                points={activeParty.points}
                parties={surveyParties}
              />

            </section>
          )}


          {activePage === "references" && (
            <section className="inbox">
              <div className="inbox-heading">
                <div>
                  <h1>Reference Maps</h1>
                  <p className="muted">
                    Store and manage reference maps from Jharkhand Bhu Naksha.
                  </p>
                </div>
              </div>

              <div className="saved-points">
                <h2>Upload Reference Map</h2>
                <p className="muted">
                  Add the official map details and select a PDF or image.
                </p>

                <form
                  onSubmit={async (event) => {
                    event.preventDefault();

                    const form = event.currentTarget;
                    const formData = new FormData(form);

                    if (!referenceFile) {
                      alert("Please select a reference PDF or image.");
                      return;
                    }

                    formData.set("referenceFile", referenceFile);

                    try {
                      const response = await fetch(
                        `${API}/api/reference-maps`,
                        {
                          method: "POST",
                          headers: {
                            Authorization: `Bearer ${adminToken}`,
                          },
                          body: formData,
                        }
                      );

                      const result = await response.json();

                      if (!response.ok) {
                        throw new Error(
                          result.message || "Failed to upload reference map."
                        );
                      }

                      alert("Reference map uploaded successfully!");

                      form.reset();
                      setReferenceFile(null);
                    } catch (error) {
                      console.error("Reference map upload error:", error);
                      alert(error.message || "Unable to upload reference map.");
                    }
                  }}
                >
                  <div className="reference-form-grid">
                    <label>
                      District
                      <input name="district" defaultValue="Palamu" required />
                    </label>

                    <label>
                      Anchal
                      <input name="anchal" defaultValue="Lesliganj" required />
                    </label>

                    <label>
                      Halka
                      <input name="halka" defaultValue="05" required />
                    </label>

                    <label>
                      Mauza
                      <input name="mauza" defaultValue="Basaura" required />
                    </label>

                    <label>
                      Cadastral Plot / Khasra Number
                      <input name="khasraNumber" defaultValue="694" required />
                    </label>

                    <label>
                      LandCraft Plot ID (optional)
                      <input
                        name="plotId"
                        placeholder="e.g. LC-004"
                      />
                    </label>

                    <label className="reference-file-field">
                      Reference PDF or Image
                      <input
                        type="file"
                        name="referenceFile"
                        accept=".pdf,.png,.jpg,.jpeg,.webp"
                        required
                        onChange={(event) => {
                          const file = event.target.files?.[0] || null;
                          setReferenceFile(file);
                        }}
                      />
                    </label>

                    {referenceFile && (
                      <div className="reference-preview">
                        <h3>Reference Map Preview</h3>

                        <p>
                          <strong>File:</strong> {referenceFile.name}
                        </p>

                        <p>
                          <strong>Size:</strong>{" "}
                          {(referenceFile.size / 1024).toFixed(1)} KB
                        </p>

                        {referenceFile.type === "application/pdf" ? (
                          <iframe
                            title="Reference map PDF preview"
                            src={URL.createObjectURL(referenceFile)}
                            className="reference-pdf-preview"
                          />
                        ) : referenceFile.type.startsWith("image/") ? (
                          <img
                            src={URL.createObjectURL(referenceFile)}
                            alt="Uploaded reference map"
                            className="reference-image-preview"
                          />
                        ) : (
                          <p>Preview is not available for this file type.</p>
                        )}
                      </div>
                    )}
                  </div>

                  <p className="muted">
                    Upload a reference PDF or image. Files are stored in Cloudinary,
                    and plot details are saved in MongoDB.
                  </p>

                  <button type="submit" className="primary-button">
                    Upload Reference Map
                  </button>
                </form>
              </div>
            </section>
          )}
        </>
      )}
    </main>
  );
}

export default App;
