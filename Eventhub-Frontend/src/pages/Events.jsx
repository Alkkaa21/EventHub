import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const EVENTS_URL = "http://127.0.0.1:8000/events/";
const REGISTER_URL = "http://127.0.0.1:8000/events/register/";

function Events() {
  const navigate = useNavigate();

  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [registrationMessage, setRegistrationMessage] = useState("");
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
          throw new Error("Could not load events");
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

  async function handleRegister(eventId) {
    setRegistrationMessage("");
    setRegisteringEventId(eventId);

    try {
      const response = await fetch(REGISTER_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("access")}`,
        },
        body: JSON.stringify({
          event: eventId,
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
        `Successfully registered for event ID ${eventId}!`
      );
    } catch (err) {
      setRegistrationMessage(err.message);
    } finally {
      setRegisteringEventId(null);
    }
  }

  return (
    <div>
      <h1>Events</h1>

      <button onClick={handleLogout}>Logout</button>
      <button onClick={() => navigate("/my-registrations")}>
  My Registrations
</button>

      {registrationMessage && <p>{registrationMessage}</p>}

      {loading && <p>Loading events...</p>}
      {error && <p>{error}</p>}

      {!loading && !error && events.length === 0 && (
        <p>No events yet.</p>
      )}

      {events.map((event) => (
        <div key={event.id}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
          <p>{event.date} at {event.time}</p>
          <p>Venue: {event.venue}</p>
          <p>Capacity: {event.capacity}</p>
          <p>Price: {event.price}</p>

          <button
            onClick={() => handleRegister(event.id)}
            disabled={registeringEventId === event.id}
          >
            {registeringEventId === event.id
              ? "Registering..."
              : "Register"}
          </button>

          <hr />
        </div>
      ))}
    </div>
  );
}


export default Events;