import { useEffect, useRef, useState } from "react";
import "./App.css";

function App() {
  const [page, setPage] = useState("home");
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState([]);

  // =====================================================
  // SAFETY ANALYTICS DATA
  // =====================================================

  // These are temporary sample values.
  // Later we will connect them to MongoDB and real SOS history.
  const [analyticsData, setAnalyticsData] = useState({
  totalSOS: 0,
  gestureAlerts: 0,
  manualAlerts: 0,
  locations: 0,
  weeklySOS: [0, 0, 0, 0, 0, 0, 0],
});

const [analyticsLoading, setAnalyticsLoading] = useState(false);
useEffect(() => {
  if (page !== "analytics" || !userId) return;

  const loadAnalytics = async () => {
    try {
      setAnalyticsLoading(true);

      const response = await fetch(
        `http://localhost:5000/api/analytics/${userId}`
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Failed to load analytics."
        );
      }

      setAnalyticsData(data);
    } catch (error) {
      console.error("Analytics error:", error);
      alert("❌ Could not load Safety Analytics.");
    } finally {
      setAnalyticsLoading(false);
    }
  };

  loadAnalytics();
}, [page, userId]);

  // =====================================================
  // LOGIN PAGE
  // =====================================================

  if (page === "login") {
    return (
      <div className="login-page">
        <div className="login-box">

          <button
            className="back-btn"
            onClick={() =>
              setPage("home")
            }
          >
            ← Back
          </button>

          <div className="login-logo">
            G
          </div>

          <h1>
            Welcome Back
          </h1>

          <p>
            Login to your GARV safety account
          </p>

          <form
            onSubmit={async (e) => {
              e.preventDefault();

              const formData =
                new FormData(
                  e.currentTarget
                );

              const email =
                formData.get("email");

              const password =
                formData.get("password");

              try {
                const response =
                  await fetch(
                    "http://localhost:5000/api/login",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body: JSON.stringify({
                        email,
                        password,
                      }),
                    }
                  );

                const data =
                  await response.json();

                if (response.ok) {
                  setUserName(
                    data.user.name
                  );

                  setUserId(
                    data.user.id
                  );

                  try {
                    const contactsResponse =
                      await fetch(
                        `http://localhost:5000/api/contacts/${data.user.id}`
                      );

                    const contactsData =
                      await contactsResponse.json();

                    if (
                      contactsResponse.ok
                    ) {
                      setContacts(
                        contactsData.contacts ||
                          []
                      );
                    } else {
                      setContacts([]);
                    }
                  } catch (error) {
                    console.error(
                      "Failed to load trusted contacts:",
                      error
                    );

                    setContacts([]);
                  }

                  alert(
                    `Welcome back, ${data.user.name}!`
                  );

                  setPage("dashboard");
                } else {
                  alert(
                    data.message ||
                      "Login failed."
                  );
                }
              } catch (error) {
                console.error(
                  "Login error:",
                  error
                );

                alert(
                  "Cannot connect to GARV server."
                );
              }
            }}
          >
            <label>
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              required
            />

            <button
              type="submit"
              className="login-submit"
            >
              Login
            </button>
          </form>

          <p className="login-register">
            Don't have an account?

            <button
              onClick={() =>
                setPage("register")
              }
            >
              Register
            </button>
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // SAFETY ANALYTICS PAGE
  // =====================================================

  if (page === "analytics") {
    const maxSOS = Math.max(
      ...analyticsData.weeklySOS,
      1
    );

    const days = [
      "Mon",
      "Tue",
      "Wed",
      "Thu",
      "Fri",
      "Sat",
      "Sun",
    ];

    return (
      <div className="dashboard-page">

        <h1>
          📊 Safety Analytics
        </h1>

        <p>
          Monitor your safety activity and emergency alerts.
        </p>

        {/* ANALYTICS SUMMARY CARDS */}

        <div className="dashboard-cards">

          <div className="dashboard-card">

            <h2>
              🚨 Total SOS
            </h2>

            <strong
              style={{
                fontSize: "42px",
                display: "block",
                marginTop: "15px",
              }}
            >
              {analyticsData.totalSOS}
            </strong>

            <p>
              Total emergency alerts
            </p>

          </div>

          <div className="dashboard-card">

            <h2>
              ✊ Gesture Alerts
            </h2>

            <strong
              style={{
                fontSize: "42px",
                display: "block",
                marginTop: "15px",
              }}
            >
              {analyticsData.gestureAlerts}
            </strong>

            <p>
              SOS alerts triggered by fist gesture
            </p>

          </div>

          <div className="dashboard-card">

            <h2>
              🖱️ Manual Alerts
            </h2>

            <strong
              style={{
                fontSize: "42px",
                display: "block",
                marginTop: "15px",
              }}
            >
              {analyticsData.manualAlerts}
            </strong>

            <p>
              SOS alerts activated manually
            </p>

          </div>

          <div className="dashboard-card">

            <h2>
              📍 Locations
            </h2>

            <strong
              style={{
                fontSize: "42px",
                display: "block",
                marginTop: "15px",
              }}
            >
              {analyticsData.locations}
            </strong>

            <p>
              Emergency locations recorded
            </p>

          </div>

        </div>

        {/* WEEKLY SOS CHART */}

        <div
          className="dashboard-card"
          style={{
            marginTop: "25px",
          }}
        >

          <h2>
            📈 SOS Alerts — Last 7 Days
          </h2>

          <p>
            Emergency activity throughout the week.
          </p>

          <div
            style={{
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "space-around",
              height: "260px",
              marginTop: "30px",
              padding: "20px",
              gap: "15px",
            }}
          >

            {analyticsData.weeklySOS.map(
              (value, index) => {

                const height =
                  (value / maxSOS) * 180;

                return (
                  <div
                    key={days[index]}
                    style={{
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      justifyContent: "flex-end",
                      height: "100%",
                      flex: 1,
                    }}
                  >

                    <strong
                      style={{
                        marginBottom: "8px",
                      }}
                    >
                      {value}
                    </strong>

                    <div
                      style={{
                        width: "100%",
                        maxWidth: "55px",
                        height: `${height}px`,
                        minHeight: "8px",
                        borderRadius:
                          "10px 10px 0 0",
                        background:
                          "linear-gradient(180deg, #ef4444, #7f1d1d)",
                        transition:
                          "height 0.3s ease",
                      }}
                    />

                    <span
                      style={{
                        marginTop: "10px",
                      }}
                    >
                      {days[index]}
                    </span>

                  </div>
                );
              }
            )}

          </div>

        </div>

        {/* SAFETY SUMMARY */}

        <div
          className="dashboard-card"
          style={{
            marginTop: "25px",
          }}
        >

          <h2>
            🛡️ Safety Summary
          </h2>

          <div
            style={{
              marginTop: "20px",
              lineHeight: "1.8",
            }}
          >

            <p>
              🚨{" "}
              <strong>
                {analyticsData.totalSOS}
              </strong>{" "}
              total emergency alerts recorded.
            </p>

            <p>
              ✊{" "}
              <strong>
                {analyticsData.gestureAlerts}
              </strong>{" "}
              alerts were triggered using the
              emergency fist gesture.
            </p>

            <p>
              🖱️{" "}
              <strong>
                {analyticsData.manualAlerts}
              </strong>{" "}
              alerts were activated manually.
            </p>

            <p>
              📍{" "}
              <strong>
                {analyticsData.locations}
              </strong>{" "}
              emergency locations were recorded.
            </p>

          </div>

        </div>

        {/* ANALYTICS NOTE */}

        <div
          className="dashboard-card"
          style={{
            marginTop: "25px",
            border:
              "1px solid rgba(255,255,255,0.15)",
          }}
        >

          <h2>
            ℹ️ Analytics Status
          </h2>

          <p>
            The current dashboard is using
            demonstration data.
          </p>

          <p>
            In the next stage, GARV will connect
            these analytics to your MongoDB SOS
            history so that the statistics update
            automatically.
          </p>

        </div>

        <button
          onClick={() =>
            setPage("dashboard")
          }
          className="back-home-button"
          style={{
            marginTop: "25px",
          }}
        >
          ← Back to Dashboard
        </button>

      </div>
    );
  }

  // =====================================================
  // DASHBOARD PAGE
  // =====================================================

  if (page === "dashboard") {
    return (
      <div className="dashboard-page">

        <h1>
          Welcome to GARV, {userName}! 🛡️
        </h1>

        <p>
          Your personal safety dashboard
        </p>

        <div className="dashboard-cards">

          {/* SOS */}

          <div className="dashboard-card">

            <h2>
              🆘 Emergency SOS
            </h2>

            <p>
              Quickly send an emergency alert.
            </p>

            <button
              onClick={() => {

                const confirmSOS =
                  window.confirm(
                    "🚨 Are you sure you want to activate Emergency SOS?"
                  );

                if (!confirmSOS) {
                  return;
                }

                if (
                  contacts.length === 0
                ) {
                  alert(
                    "⚠️ No trusted contacts have been added yet.\n\n" +
                      "Please add at least one trusted contact before activating SOS."
                  );

                  return;
                }

                if (
                  !navigator.geolocation
                ) {
                  alert(
                    "🚨 Emergency SOS activated!\n\n" +
                      "⚠️ Location is not supported by this browser."
                  );

                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  async (position) => {

                    const latitude =
                      position.coords.latitude;

                    const longitude =
                      position.coords.longitude;

                    const mapsLink =
                      `https://www.google.com/maps?q=${latitude},${longitude}`;

                    try {

                      const response =
                        await fetch(
                          "http://localhost:5000/api/sos",
                          {
                            method: "POST",

                            headers: {
                              "Content-Type":
                                "application/json",
                            },

                            body: JSON.stringify({
                              latitude,
                              longitude,
                              contacts,
                              userName,
                              userId,
                              type: "manual",
                            }),
                          }
                        );

                      const data =
                        await response.json();

                      if (
                        !response.ok
                      ) {
                        alert(
                          data.message ||
                            "Failed to send emergency SOS."
                        );

                        return;
                      }

                      let contactList =
                        "";

                      contacts.forEach(
                        (contact) => {
                          contactList +=
                            `👤 ${contact.name}\n` +
                            `📞 ${contact.phone}\n\n`;
                        }
                      );

                      alert(
                        `🚨 Emergency SOS activated successfully!\n\n` +
                          `👤 User:\n` +
                          `${userName}\n\n` +
                          `📍 Your Location:\n` +
                          `Latitude: ${latitude}\n` +
                          `Longitude: ${longitude}\n\n` +
                          `🗺️ Google Maps:\n` +
                          `${mapsLink}\n\n` +
                          `👥 Trusted Contacts:\n\n` +
                          `${contactList}` +
                          `✅ SOS information successfully sent to GARV backend.`
                      );

                      window.open(
                        mapsLink,
                        "_blank"
                      );

                    } catch (error) {

                      console.error(
                        "SOS error:",
                        error
                      );

                      alert(
                        "🚨 Emergency SOS could not be sent.\n\n" +
                          "Cannot connect to GARV backend."
                      );
                    }
                  },

                  () => {

                    alert(
                      "🚨 Emergency SOS activated!\n\n" +
                        "⚠️ Unable to get your location.\n\n" +
                        "Please make sure location permission is enabled."
                    );
                  }
                );
              }}
            >
              Activate SOS
            </button>
          </div>

          {/* LIVE LOCATION */}

          <div className="dashboard-card">

            <h2>
              📍 Live Location
            </h2>

            <p>
              Share and monitor your current location.
            </p>

            <button
              onClick={() => {

                if (
                  !navigator.geolocation
                ) {
                  alert(
                    "Location is not supported by your browser."
                  );

                  return;
                }

                navigator.geolocation.getCurrentPosition(
                  (position) => {

                    const latitude =
                      position.coords.latitude;

                    const longitude =
                      position.coords.longitude;

                    const mapsUrl =
                      `https://www.google.com/maps?q=${latitude},${longitude}`;

                    window.open(
                      mapsUrl,
                      "_blank"
                    );
                  },

                  () => {

                    alert(
                      "Unable to get your location. Please allow location access in your browser."
                    );
                  }
                );
              }}
            >
              View My Location
            </button>
          </div>

          {/* ANALYTICS */}

          <div className="dashboard-card">

            <h2>
              📊 Safety Analytics
            </h2>

            <p>
              View your safety activity and alerts.
            </p>

            <button
              onClick={() =>
                setPage("analytics")
              }
            >
              View Analytics
            </button>

          </div>

          {/* TRUSTED CONTACTS */}

          <div className="dashboard-card">

            <h2>
              👥 Trusted Contacts
            </h2>

            <p>
              Add people who should receive
              your emergency alerts.
            </p>

            <button
              onClick={async () => {

                if (!userId) {
                  alert(
                    "⚠️ User information not found. Please login again."
                  );

                  return;
                }

                const name =
                  prompt(
                    "Enter trusted contact name:"
                  );

                if (!name) {
                  return;
                }

                const phone =
                  prompt(
                    "Enter trusted contact phone number:"
                  );

                if (!phone) {
                  return;
                }

                try {

                  const response =
                    await fetch(
                      "http://localhost:5000/api/contacts",
                      {
                        method: "POST",

                        headers: {
                          "Content-Type":
                            "application/json",
                        },

                        body: JSON.stringify({
                          userId,
                          name,
                          phone,
                        }),
                      }
                    );

                  const data =
                    await response.json();

                  if (!response.ok) {

                    alert(
                      data.message ||
                        "Failed to save trusted contact."
                    );

                    return;
                  }

                  setContacts(
                    data.contacts || [
                      ...contacts,
                      {
                        name,
                        phone,
                      },
                    ]
                  );

                  alert(
                    `✅ ${name} added as a trusted contact!\n\n` +
                      `The contact has been saved to your GARV account.`
                  );

                } catch (error) {

                  console.error(
                    "Add contact error:",
                    error
                  );

                  alert(
                    "❌ Could not save trusted contact.\n\n" +
                      "Cannot connect to GARV backend."
                  );
                }
              }}
            >
              Manage Contacts
            </button>

            {contacts.length > 0 && (
              <div
                style={{
                  marginTop: "20px",
                }}
              >

                <h3>
                  Saved Contacts
                </h3>

                {contacts.map(
                  (contact, index) => (
                    <div
                      key={
                        contact._id ||
                        index
                      }
                      style={{
                        marginTop: "10px",
                        padding: "12px",
                        borderRadius: "10px",
                        background:
                          "rgba(255, 255, 255, 0.08)",
                      }}
                    >

                      <strong>
                        👤 {contact.name}
                      </strong>

                      <p
                        style={{
                          margin:
                            "5px 0 0",
                        }}
                      >
                        📞 {contact.phone}
                      </p>

                      <button
                        onClick={async () => {

                          const confirmDelete =
                            window.confirm(
                              `Are you sure you want to delete ${contact.name} from your trusted contacts?`
                            );

                          if (
                            !confirmDelete
                          ) {
                            return;
                          }

                          try {

                            const response =
                              await fetch(
                                `http://localhost:5000/api/contacts/${userId}/${contact._id}`,
                                {
                                  method:
                                    "DELETE",
                                }
                              );

                            const data =
                              await response.json();

                            if (
                              !response.ok
                            ) {

                              alert(
                                data.message ||
                                  "Failed to delete contact."
                              );

                              return;
                            }

                            setContacts(
                              data.contacts ||
                                []
                            );

                            alert(
                              `✅ ${contact.name} has been deleted.`
                            );

                          } catch (error) {

                            console.error(
                              "Delete contact error:",
                              error
                            );

                            alert(
                              "❌ Could not delete contact.\n\n" +
                                "Cannot connect to GARV backend."
                            );
                          }
                        }}
                        style={{
                          marginTop:
                            "10px",
                          padding:
                            "8px 14px",
                          border: "none",
                          borderRadius:
                            "8px",
                          cursor:
                            "pointer",
                          background:
                            "#dc2626",
                          color:
                            "white",
                        }}
                      >
                        🗑️ Delete
                      </button>

                    </div>
                  )
                )}

              </div>
            )}

          </div>

        </div>

        <button
          onClick={() =>
            setPage("home")
          }
          className="back-home-button"
        >
          ← Back to Home
        </button>

      </div>
    );
  }

  // =====================================================
  // REGISTER PAGE
  // =====================================================

  if (page === "register") {
    return (
      <div className="login-page">

        <div className="login-box">

          <button
            className="back-btn"
            onClick={() =>
              setPage("home")
            }
          >
            ← Back
          </button>

          <div className="login-logo">
            G
          </div>

          <h1>
            Create Account
          </h1>

          <p>
            Create your GARV safety account
          </p>

          <form
            onSubmit={async (e) => {

              e.preventDefault();

              const formData =
                new FormData(
                  e.currentTarget
                );

              const name =
                formData.get("name");

              const email =
                formData.get("email");

              const password =
                formData.get("password");

              try {

                const response =
                  await fetch(
                    "http://localhost:5000/api/register",
                    {
                      method: "POST",

                      headers: {
                        "Content-Type":
                          "application/json",
                      },

                      body: JSON.stringify({
                        name,
                        email,
                        password,
                      }),
                    }
                  );

                const data =
                  await response.json();

                if (response.ok) {

                  alert(
                    "Account created successfully!"
                  );

                  setPage("login");

                } else {

                  alert(
                    data.message ||
                      "Registration failed."
                  );
                }

              } catch (error) {

                console.error(
                  "Registration error:",
                  error
                );

                alert(
                  "Cannot connect to GARV server."
                );
              }
            }}
          >

            <label>
              Full Name
            </label>

            <input
              type="text"
              name="name"
              placeholder="Enter your name"
              required
            />

            <label>
              Email Address
            </label>

            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              required
            />

            <label>
              Password
            </label>

            <input
              type="password"
              name="password"
              placeholder="Create a password"
              required
            />

            <button
              type="submit"
              className="login-submit"
            >
              Create Account
            </button>

          </form>

          <p className="login-register">

            Already have an account?

            <button
              onClick={() =>
                setPage("login")
              }
            >
              Login
            </button>

          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // HOME PAGE
  // =====================================================

  return (
    <div className="app">

      {/* NAVIGATION */}

      <nav className="navbar">

        <div className="logo">

          <div className="logo-icon">
            G
          </div>

          <div>

            <h2>
              GARV
            </h2>

            <span>
              Women Safety & Analytics
            </span>

          </div>

        </div>

        <div className="nav-links">

          <a href="#home">
            Home
          </a>

          <a href="#features">
            Features
          </a>

          <a href="#about">
            About
          </a>

          <button
            className="login-btn"
            onClick={() =>
              setPage("login")
            }
          >
            Login
          </button>

          <button
            className="register-btn"
            onClick={() =>
              setPage("dashboard")
            }
          >
            Dashboard
          </button>

          <button
            className="register-btn"
            onClick={() =>
              setPage("register")
            }
          >
            Register
          </button>

        </div>

      </nav>

      {/* HERO */}

      <main
        id="home"
        className="hero"
      >

        <div className="hero-content">

          <div className="badge">
            🛡️ Smart Women Safety Platform
          </div>

          <h1>

            Your Safety.
            <br />

            <span>
              Our Priority.
            </span>

          </h1>

          <p>

            GARV is a women safety platform combining
            emergency response, real-time location
            tracking, trusted contacts and safety analytics.

          </p>

          <div className="hero-buttons">

            <button
              className="sos-btn"
              onClick={() =>
                setPage("login")
              }
            >
              🚨 Emergency SOS
            </button>

            <button
              className="explore-btn"
              onClick={() => {

                document
                  .getElementById(
                    "features"
                  )
                  .scrollIntoView();

              }}
            >
              Explore Features →
            </button>

          </div>

          <div className="stats">

            <div>

              <strong>
                24/7
              </strong>

              <span>
                Safety Support
              </span>

            </div>

            <div>

              <strong>
                SOS
              </strong>

              <span>
                Emergency Response
              </span>

            </div>

            <div>

              <strong>
                GPS
              </strong>

              <span>
                Live Location
              </span>

            </div>

          </div>

        </div>

        {/* SAFETY CARD */}

        <div className="safety-card">

          <div className="card-top">

            <span>
              <i></i>
              Safety Status
            </span>

            <b>
              SAFE
            </b>

          </div>

          <div className="shield">
            🛡️
          </div>

          <h2>
            You are protected
          </h2>

          <p>
            Your safety monitoring system is active.
          </p>

          <button
            className="big-sos"
            onClick={() =>
              setPage("login")
            }
          >
            SOS
          </button>

          <small>
            Press in an emergency to alert your contacts
          </small>

        </div>

      </main>

      {/* FEATURES */}

      <section
        id="features"
        className="features"
      >

        <div className="section-title">

          <span>
            POWERFUL FEATURES
          </span>

          <h2>
            Safety technology built for you
          </h2>

          <p>
            One platform connecting emergency
            response, artificial intelligence and
            analytics.
          </p>

        </div>

        <div className="feature-grid">

          <div className="feature-card">

            <div className="feature-icon">
              🚨
            </div>

            <h3>
              Emergency SOS
            </h3>

            <p>
              Quickly send an emergency alert
              to your trusted contacts.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              📍
            </div>

            <h3>
              Live Location
            </h3>

            <p>
              Share your real-time location
              during an emergency.
            </p>

          </div>

          <div className="feature-card">

            <div className="feature-icon">
              📊
            </div>

            <h3>
              Safety Analytics
            </h3>

            <p>
              Analyze safety trends and identify
              high-risk locations.
            </p>

          </div>

        </div>

      </section>

      {/* ABOUT */}

      <section
        id="about"
        className="about"
      >

        <div>

          <span>
            ABOUT GARV
          </span>

          <h2>
            Technology that stands with you.
          </h2>

        </div>

        <p>

          GARV brings together modern web technology,
          artificial intelligence, location services
          and data analytics to create a smarter women
          safety ecosystem.

        </p>

      </section>

      {/* FOOTER */}

      <footer>

        <strong>
          GARV
        </strong>

        <span>
          Women Safety & Analytics
        </span>

        <p>
          Built for a safer tomorrow.
        </p>

      </footer>

    </div>
  );
}

export default App;