import { apiFetch } from "../api";
import { throwIfNotOk, getErrorMessage } from "../errors";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MY_REGISTRATIONS_URL =
  "http://127.0.0.1:8000/events/my-registrations/";
const CANCEL_REGISTRATION_BASE_URL =
  "http://127.0.0.1:8000/events/registrations/";

function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatDateTime(dateString) {
  if (!dateString) return "Time unavailable";

  return new Date(dateString).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function hasEventStarted(date, time) {
  if (!date) return false;
  const timeString = time || "00:00:00";
  const eventDateTime = new Date(`${date}T${timeString}`);
  return eventDateTime.getTime() <= Date.now();
}

function MyRegistrations() {
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState("");
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const response = await apiFetch(MY_REGISTRATIONS_URL);
        await throwIfNotOk(response);

        const data = await response.json();
        setRegistrations(data);
      } catch (err) {
        setError(getErrorMessage(err));
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, []);

  async function handleCancelRegistration(registration) {
    const confirmed = window.confirm(
      `Are you sure you want to cancel your registration for "${registration.event_title}"?`
    );
    if (!confirmed) return;

    setFeedbackMessage("");
    setFeedbackType("");
    setCancellingId(registration.id);

    try {
      const response = await apiFetch(
        `${CANCEL_REGISTRATION_BASE_URL}${registration.id}/`,
        {
          method: "DELETE",
        }
      );
      await throwIfNotOk(response);

      // Remove the cancelled registration from the displayed state after success
      setRegistrations((prev) => prev.filter((r) => r.id !== registration.id));
      setFeedbackMessage(
        `Your registration for "${registration.event_title}" has been cancelled.`
      );
      setFeedbackType("success");
    } catch (err) {
      setFeedbackMessage(getErrorMessage(err));
      setFeedbackType("error");
    } finally {
      setCancellingId(null);
    }
  }

  return (
    <main className="registrations-page">
      <header className="registrations-header">
        <div>
          <p className="eyebrow">EVENTHUB</p>
          <h1>My Registrations</h1>
          <p className="subtitle">
            Keep track of the events you're attending.
          </p>
        </div>

        <button
          className="back-button"
          onClick={() => navigate("/events")}
        >
          ← Back to Events
        </button>
      </header>

      {feedbackMessage && (
        <div className={`registrations-notice ${feedbackType}`}>
          {feedbackMessage}
        </div>
      )}

      {loading && <p>Loading your registrations...</p>}

      {error && <p className="error-message">{error}</p>}

      {!loading && !error && registrations.length === 0 && (
        <section className="empty-state">
          <h2>No registrations yet</h2>
          <p>Explore events and register for something interesting.</p>
          <button onClick={() => navigate("/events")}>
            Explore Events
          </button>
        </section>
      )}

      <section className="registrations-list">
        {registrations.map((registration) => {
          const isStarted = hasEventStarted(
            registration.event_date,
            registration.event_time
          );

          return (
            <article className="registration-card" key={registration.id}>
              <div className="card-top">
                <div>
                  <p className="eyebrow">YOUR EVENT</p>
                  <h2>{registration.event_title}</h2>
                </div>

                <span className={`status-label ${isStarted ? "past" : ""}`}>
                  {isStarted ? "Completed" : "Registered"}
                </span>
              </div>

              <div className="event-details">
                <p>
                  <span>📅</span>
                  <span>{formatDate(registration.event_date)}</span>
                </p>

                <p>
                  <span>📍</span>
                  <span>{registration.event_venue}</span>
                </p>
              </div>

              <div className="registration-actions">
                <span className="registration-footer-text">
                  Registered on {formatDateTime(registration.registered_at)}
                </span>
                {!isStarted && (
                  <button
                    className="cancel-button"
                    onClick={() => handleCancelRegistration(registration)}
                    disabled={cancellingId === registration.id}
                  >
                    {cancellingId === registration.id
                      ? "Cancelling..."
                      : "Cancel Registration"}
                  </button>
                )}
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

export default MyRegistrations;

