
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const MY_REGISTRATIONS_URL =
  "http://127.0.0.1:8000/events/my-registrations/";

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
    <div>
      <h1>My Registrations</h1>

      <button onClick={() => navigate("/events")}>
        Back to Events
      </button>

      {loading && <p>Loading your registrations...</p>}

      {error && <p>{error}</p>}

      {!loading && !error && registrations.length === 0 && (
        <p>You haven't registered for any events yet.</p>
      )}

      
{registrations.map((registration) => (
  <div key={registration.id}>
    <h2>{registration.event_title}</h2>
    <p>Date: {registration.event_date}</p>
    <p>Venue: {registration.event_venue}</p>
    <p>Registered at: {registration.registered_at}</p>
    <hr />
  </div>
))}

    </div>
  );
}

export default MyRegistrations;
