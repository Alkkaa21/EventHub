import { useEffect } from "react";

function Events() {

  useEffect(() => {
    console.log("Events page loaded");
  }, []);

  return (
    <div>
      <h1>Events</h1>
      <p>Welcome to EventHub!</p>
    </div>
  );
}

export default Events;