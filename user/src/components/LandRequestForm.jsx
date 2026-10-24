import { useState } from "react";
import "./LandRequestForm.css";

const createEmptyParty = () => ({
  name: "",
  mobile: "",
  claimDescription: "",
});

const initialForm = () => ({
  requestType: "Boundary Dispute",
  plotId: "",
  location: "",
  description: "",
  parties: [createEmptyParty()],
});

function LandRequestForm({ onClose }) {
  const [formData, setFormData] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [submittedRequest, setSubmittedRequest] = useState(null);

  const updateField = (event) => {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const updateParty = (index, field, value) => {
    setFormData((current) => ({
      ...current,
      parties: current.parties.map((party, partyIndex) =>
        partyIndex === index
          ? { ...party, [field]: value }
          : party
      ),
    }));
  };

  const addParty = () => {
    setFormData((current) => ({
      ...current,
      parties: [...current.parties, createEmptyParty()],
    }));
  };

  const removeParty = (index) => {
    setFormData((current) => ({
      ...current,
      parties: current.parties.filter(
        (_, partyIndex) => partyIndex !== index
      ),
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const token = localStorage.getItem("landcraftToken");

    if (!token) {
      setError("Your session is missing. Please log in again.");
      return;
    }

    const payload = {
      requestType: formData.requestType,
      plotId: formData.plotId.trim(),
      location: formData.location.trim(),
      description: formData.description.trim(),
      parties: formData.parties.map((party) => ({
        name: party.name.trim(),
        mobile: party.mobile.trim(),
        claimDescription: party.claimDescription.trim(),
      })),
    };

    setSubmitting(true);

    try {
      const response = await fetch(
        "http://localhost:5000/api/requests",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message || "Unable to submit your request."
        );
      }

      setSubmittedRequest(data.request);
      setFormData(initialForm());
    } catch (error) {
      setError(error.message || "Unable to connect to the server.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRequest) {
    return (
      <section className="land-request-section">
        <div className="land-request-success">
          <div className="request-success-icon">✓</div>

          <h2>Request Submitted Successfully</h2>

          <p>Your land issue has been recorded for Admin review.</p>

          <div className="request-success-details">
            <span>Request ID</span>
            <strong>{submittedRequest.requestId}</strong>

            <span>Request Type</span>
            <strong>{submittedRequest.requestType}</strong>

            <span>Status</span>
            <strong>{submittedRequest.status}</strong>
          </div>

          <p className="request-demo-note">
            The Admin team can review this request and schedule
            a field survey if required.
          </p>

          <button
            type="button"
            className="request-submit-btn"
            onClick={onClose}
          >
            Back to Dashboard
          </button>
        </div>
      </section>
    );
  }

  return (
    <section className="land-request-section">
      <div className="land-request-heading">
        <div>
          <span className="dashboard-kicker">LAND ISSUE</span>
          <h2>Report Land Issue / Request Verification</h2>
          <p>
            Provide the parcel details and information about
            everyone involved in the reported issue.
          </p>
        </div>

        <button
          type="button"
          className="request-close-btn"
          onClick={onClose}
        >
          Close
        </button>
      </div>

      <form className="land-request-form" onSubmit={handleSubmit}>
        <div className="request-form-grid">
          <div className="request-field">
            <label htmlFor="requestType">Request Type *</label>

            <select
              id="requestType"
              name="requestType"
              value={formData.requestType}
              onChange={updateField}
              required
            >
              <option value="Boundary Dispute">Boundary Dispute</option>
              <option value="Land Verification">Land Verification</option>
              <option value="Boundary Mismatch">Boundary Mismatch</option>
              <option value="Encroachment Report">Encroachment Report</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div className="request-field">
            <label htmlFor="plotId">Plot / Parcel ID</label>

            <input
              id="plotId"
              name="plotId"
              value={formData.plotId}
              onChange={updateField}
              placeholder="e.g. LC-001"
            />
          </div>
        </div>

        <div className="request-field">
          <label htmlFor="requestLocation">Land Location *</label>

          <input
            id="requestLocation"
            name="location"
            value={formData.location}
            onChange={updateField}
            placeholder="Village, block, district, state"
            required
          />
        </div>

        <div className="request-field">
          <label htmlFor="requestDescription">Describe the Issue *</label>

          <textarea
            id="requestDescription"
            name="description"
            value={formData.description}
            onChange={updateField}
            placeholder="Explain the land issue or reason for verification..."
            rows={4}
            required
          />
        </div>

        <div className="request-parties-heading">
          <div>
            <h3>Parties Involved</h3>
            <p>
              Add each person or party involved. You can add more
              than two parties.
            </p>
          </div>

          <button
            type="button"
            className="request-add-party-btn"
            onClick={addParty}
          >
            + Add Party
          </button>
        </div>

        {formData.parties.map((party, index) => (
          <div className="request-party-card" key={index}>
            <div className="request-party-title">
              <h4>Party {index + 1}</h4>

              {formData.parties.length > 1 && (
                <button
                  type="button"
                  className="request-remove-party-btn"
                  onClick={() => removeParty(index)}
                >
                  Remove
                </button>
              )}
            </div>

            <div className="request-form-grid">
              <div className="request-field">
                <label htmlFor={`party-name-${index}`}>
                  Party Name *
                </label>

                <input
                  id={`party-name-${index}`}
                  value={party.name}
                  onChange={(event) =>
                    updateParty(index, "name", event.target.value)
                  }
                  placeholder="Enter party name"
                  required
                />
              </div>

              <div className="request-field">
                <label htmlFor={`party-mobile-${index}`}>
                  Mobile Number
                </label>

                <input
                  id={`party-mobile-${index}`}
                  type="tel"
                  value={party.mobile}
                  onChange={(event) =>
                    updateParty(index, "mobile", event.target.value)
                  }
                  placeholder="Enter mobile number"
                />
              </div>
            </div>

            <div className="request-field">
              <label htmlFor={`party-claim-${index}`}>
                Party's Claim / Description
              </label>

              <textarea
                id={`party-claim-${index}`}
                value={party.claimDescription}
                onChange={(event) =>
                  updateParty(
                    index,
                    "claimDescription",
                    event.target.value
                  )
                }
                placeholder="Describe this party's claim, if known"
                rows={2}
              />
            </div>
          </div>
        ))}

        {error && (
          <p className="request-error" role="alert">
            {error}
          </p>
        )}

        <div className="request-form-actions">
          <button
            type="button"
            className="request-cancel-btn"
            onClick={onClose}
          >
            Cancel
          </button>

          <button
            type="submit"
            className="request-submit-btn"
            disabled={submitting}
          >
            {submitting ? "Submitting..." : "Submit Request"}
          </button>
        </div>
      </form>
    </section>
  );
}

export default LandRequestForm;