import { useEffect, useState } from "react";
import "./MyRequests.css";

function MyRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchMyRequests = async () => {
      const token = localStorage.getItem("landcraftToken");

      if (!token) {
        setError("Please log in to view your requests.");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL || ""}/api/requests/my`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json();

        if (!response.ok || !data.success) {
          throw new Error(
            data.message || "Unable to load your requests."
          );
        }

        setRequests(data.requests || []);
      } catch (err) {
        setError(err.message || "Unable to connect to the server.");
      } finally {
        setLoading(false);
      }
    };

    fetchMyRequests();
  }, []);

  if (loading) {
    return (
      <section className="my-requests-section">
        <p>Loading your requests...</p>
      </section>
    );
  }

  if (error) {
    return (
      <section className="my-requests-section">
        <h2>My Requests</h2>
        <p className="my-requests-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="my-requests-section">
      <div className="my-requests-heading">
        <div>
          <span className="dashboard-kicker">YOUR ACTIVITY</span>
          <h2>My Requests</h2>
          <p>Track the progress of your submitted land requests.</p>
        </div>

        <span className="my-requests-count">
          {requests.length} {requests.length === 1 ? "Request" : "Requests"}
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="my-requests-empty">
          <h3>No requests yet</h3>
          <p>
            Your submitted land issues and verification requests
            will appear here.
          </p>
        </div>
      ) : (
        <div className="my-requests-list">
          {requests.map((request) => (
            <article
              className="my-request-card"
              key={request._id || request.requestId}
            >
              <div className="my-request-main">
                <div>
                  <span className="my-request-id">
                    {request.requestId}
                  </span>
                  <h3>{request.requestType}</h3>
                  <p>
                    Plot: {request.plotId || "Not specified"}
                  </p>
                  <p>
                    Location: {request.location}
                  </p>
                </div>

                <span
                  className={`my-request-status status-${request.status
                    .toLowerCase()
                    .replace(/\s+/g, "-")}`}
                >
                  {request.status}
                </span>
              </div>

              <div className="my-request-meta">
                <span>
                  Submitted:{" "}
                  {new Date(request.createdAt).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

export default MyRequests;