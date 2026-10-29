
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MY_REGISTRATIONS_URL =
  "http://127.0.0.1:8000/events/my-registrations/";

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

function MyRegistrations() {
  const navigate = useNavigate();

  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchRegistrations() {
      try {
        const response = await fetch(MY_REGISTRATIONS_URL, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access")}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(
            data.detail || "Could not load your registrations."
          );
        }

        setRegistrations(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchRegistrations();
  }, []);

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
        {registrations.map((registration) => (
          <article className="registration-card" key={registration.id}>
            <div className="card-top">
              <div>
                <p className="eyebrow">YOUR EVENT</p>
                <h2>{registration.event_title}</h2>
              </div>

              <span className="status-label">Registered</span>
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

            <div className="registration-footer">
              Registered on {formatDateTime(registration.registered_at)}
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

export default MyRegistrations;
