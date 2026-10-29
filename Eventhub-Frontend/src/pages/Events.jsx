
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EVENTS_URL = "http://127.0.0.1:8000/events/";
const REGISTER_URL = "http://127.0.0.1:8000/events/register/";

// Format the event date, for example: 30 July 2026
function formatDate(dateString) {
  if (!dateString) return "Date unavailable";

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    "en-IN",
    {
      day: "numeric",
      month: "long",
      year: "numeric",
    }
  );
}

// Format the event time, for example: 10:00 AM
function formatTime(timeString) {
  if (!timeString) return "Time unavailable";

  const [hours, minutes] = timeString.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes), 0, 0);

  return date.toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

// Check whether the event date and time have passed.
function hasEventPassed(event) {
  if (!event.date || !event.time) return false;

  const eventDateTime = new Date(`${event.date}T${event.time}`);
  return eventDateTime.getTime() < Date.now();
}

// Format price in Indian rupees.
function formatPrice(price) {
  const amount = Number(price);

  if (amount === 0) return "Free";

  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  }).format(amount);
}

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");
  const [registrationMessageType, setRegistrationMessageType] =
    useState("");
  const [registeringEventId, setRegisteringEventId] = useState(null);

  function handleLogout() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    navigate("/");
  }

  useEffect(() => {
    async function fetchEvents() {
      try {
        const response = await fetch(EVENTS_URL);

        if (!response.ok) {
          throw new Error("Could not load events. Please try again.");
        }

        const data = await response.json();
        setEvents(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchEvents();
  }, []);

  async function handleRegister(event) {
    setRegistrationMessage("");
    setRegistrationMessageType("");
    setRegisteringEventId(event.id);

    try {
      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          event: event.id,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          data.non_field_errors?.[0] ||
          data.event?.[0] ||
          data.detail ||
          "Registration failed. Please try again.";

        throw new Error(message);
      }

      setRegistrationMessage(
        `You're registered for ${event.title}!`
      );
      setRegistrationMessageType("success");
    } catch (err) {
      setRegistrationMessage(err.message);
      setRegistrationMessageType("error");
    } finally {
      setRegisteringEventId(null);
    }
  }

  return (
    <main className="events-page">
      <header className="events-header">
        <div>
          <p className="eyebrow">EVENTHUB</p>
          <h1>Discover Events</h1>
          <p className="events-subtitle">
            Find your next experience.
          </p>
        </div>

        <div className="events-actions">
          <button
            className="secondary-button"
            onClick={() => navigate("/my-registrations")}
          >
            My Registrations
          </button>

          <button className="secondary-button" onClick={handleLogout}>
            Logout
          </button>
          <button
  className="register-button"
  onClick={() => navigate("/create-event")}
>
  + Create Event
</button>
        </div>
      </header>

      {registrationMessage && (
        <p
          className={`registration-notice ${registrationMessageType}`}
          role="status"
        >
          {registrationMessage}
        </p>
      )}

      {loading && <p>Loading events...</p>}

      {error && <p className="events-error">{error}</p>}

      {!loading && !error && events.length === 0 && (
        <section className="events-empty">
          <h2>No events available yet</h2>
          <p>Please check back later for new events.</p>
        </section>
      )}

      {!loading && !error && events.length > 0 && (
        <section className="events-grid">
          {events.map((event) => {
            const past = hasEventPassed(event);
            const isRegistering = registeringEventId === event.id;

            return (
              <article className="event-card" key={event.id}>
                <div className="event-card-header">
                  <span
                    className={`event-status ${
                      past ? "past" : "upcoming"
                    }`}
                  >
                    {past ? "Past event" : "Upcoming"}
                  </span>

                  <span className="event-price">
                    {formatPrice(event.price)}
                  </span>
                </div>

                <h2>{event.title}</h2>

                <p className="event-description">
                  {event.description}
                </p>

                <div className="event-details">
                  <p>
                    <span aria-hidden="true">📅</span>
                    <span>
                      {formatDate(event.date)} · {formatTime(event.time)}
                    </span>
                  </p>

                  <p>
                    <span aria-hidden="true">📍</span>
                    <span>{event.venue}</span>
                  </p>

                  <p>
                    <span aria-hidden="true">👥</span>
                    <span>Capacity: {event.capacity}</span>
                  </p>
                </div>

                <button
                  className="register-button"
                  onClick={() => handleRegister(event)}
                  disabled={past || isRegistering}
                >
                  {isRegistering
                    ? "Registering..."
                    : past
                    ? "Event has ended"
                    : "Register"}
                </button>
              </article>
            );
          })}
        </section>
      )}
    </main>
  );
}

export default Events;
