
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const API_URL = "http://127.0.0.1:8000/events/create/";

function CreateEvent() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    time: "",
    venue: "",
    capacity: "",
    price: "0",
  });

  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState("");

  function handleChange(event) {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    const capacity = Number(formData.capacity);
    const price = Number(formData.price);

    if (!Number.isInteger(capacity) || capacity <= 0) {
      setError("Capacity must be a positive whole number.");
      return;
    }

    if (!Number.isFinite(price) || price < 0) {
      setError("Price cannot be negative.");
      return;
    }

    const accessToken = localStorage.getItem("access");

    if (!accessToken) {
      setError("Please log in before creating an event.");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          ...formData,
          capacity,
          price: price.toFixed(2),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        const message =
          typeof data === "object"
            ? Object.entries(data)
                .map(([field, messages]) => {
                  const text = Array.isArray(messages)
                    ? messages.join(" ")
                    : String(messages);
                  return `${field}: ${text}`;
                })
                .join(" ")
            : "Could not create the event.";

        setError(message || "Could not create the event.");
        return;
      }

      setSuccess("Event created successfully!");
      setTimeout(() => navigate("/events"), 1000);
    } catch {
      setError(
        "Cannot connect to the server. Check that Django is running."
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="create-event-page">
      <section className="create-event-card">
        <button
          type="button"
          className="secondary-button"
          onClick={() => navigate("/events")}
        >
          ← Back to events
        </button>

        <h1>Create an event</h1>
        <p className="create-event-subtitle">
          Share an experience with the EventHub community.
        </p>

        <form onSubmit={handleSubmit}>
          <label htmlFor="title">Event title</label>
          <input
            id="title"
            name="title"
            value={formData.title}
            onChange={handleChange}
            maxLength={200}
            required
          />

          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            required
          />

          <div className="create-event-row">
            <div>
              <label htmlFor="date">Date</label>
              <input
                id="date"
                name="date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="time">Time</label>
              <input
                id="time"
                name="time"
                type="time"
                value={formData.time}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <label htmlFor="venue">Venue</label>
          <input
            id="venue"
            name="venue"
            value={formData.venue}
            onChange={handleChange}
            maxLength={255}
            required
          />

          <div className="create-event-row">
            <div>
              <label htmlFor="capacity">Capacity</label>
              <input
                id="capacity"
                name="capacity"
                type="number"
                min="1"
                step="1"
                value={formData.capacity}
                onChange={handleChange}
                required
              />
            </div>

            <div>
              <label htmlFor="price">Ticket price (₹)</label>
              <input
                id="price"
                name="price"
                type="number"
                min="0"
                step="0.01"
                value={formData.price}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {error && (
            <p className="create-event-error" role="alert">
              {error}
            </p>
          )}

          {success && (
            <p className="create-event-success" role="status">
              {success}
            </p>
          )}

          <button
            type="submit"
            className="register-button"
            disabled={isLoading}
          >
            {isLoading ? "Creating event..." : "Create event"}
          </button>
        </form>
      </section>
    </main>
  );
}

export default CreateEvent;
