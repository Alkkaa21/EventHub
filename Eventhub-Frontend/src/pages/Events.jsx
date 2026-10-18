import { useEffect, useState } from "react";

const EVENTS_URL = "http://127.0.0.1:8000/events/";

function Events() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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

  if (loading) return <p>Loading events...</p>;
  if (error) return <p>{error}</p>;

  return (
    <div>
      <h1>Events</h1>

      {events.length === 0 && <p>No events yet.</p>}

      {events.map((event) => (
        <div key={event.id}>
          <h2>{event.title}</h2>
          <p>{event.description}</p>
          <p>{event.date} at {event.time}</p>
          <p>Venue: {event.venue}</p>
          <p>Capacity: {event.capacity}</p>
          <p>Price: {event.price}</p>
        </div>
      ))}
    </div>
  );
}

export default Events;