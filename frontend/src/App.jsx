import { useEffect, useRef, useState } from "react";
import { FilesetResolver, HandLandmarker } from "@mediapipe/tasks-vision";
import "./App.css";

const BACKEND_URL = "https://garv-o782.onrender.com";

function App() {
  const [page, setPage] = useState("home");
  const [userName, setUserName] = useState("User");
  const [userId, setUserId] = useState("");
  const [contacts, setContacts] = useState([]);

  const [analyticsData, setAnalyticsData] = useState({
    totalSOS: 0, gestureAlerts: 0, manualAlerts: 0, locations: 0,
    weeklySOS: [0, 0, 0, 0, 0, 0, 0],
  });
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // AI gesture detection
  const [aiCameraActive, setAiCameraActive] = useState(false);
  const [handDetected, setHandDetected] = useState(false);
  const [fistDetected, setFistDetected] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [sosCountdown, setSosCountdown] = useState(null);
  const videoRef = useRef(null);
  const handLandmarkerRef = useRef(null);
  const cameraStreamRef = useRef(null);
  const animationFrameRef = useRef(null);
  const countdownTimerRef = useRef(null);
  const gestureTriggeredRef = useRef(false);

  const isClosedFist = (landmarks) => {
    if (!landmarks || landmarks.length < 21) return false;
    const fingers = [[8, 6], [12, 10], [16, 14], [20, 18]];
    let closed = 0;
    fingers.forEach(([tip, pip]) => { if (landmarks[tip].y > landmarks[pip].y) closed++; });
    return closed >= 3;
  };

  const cancelFistCountdown = () => {
    if (countdownTimerRef.current) {
      clearInterval(countdownTimerRef.current);
      countdownTimerRef.current = null;
    }
    setSosCountdown(null);
  };

  const stopCamera = () => {
    cancelFistCountdown();
    if (cameraStreamRef.current) {
      cameraStreamRef.current.getTracks().forEach((track) => track.stop());
      cameraStreamRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setAiCameraActive(false);
    setHandDetected(false);
    setFistDetected(false);
  };

  const sendGestureSOS = () => {
    if (gestureTriggeredRef.current) return;
    gestureTriggeredRef.current = true;
    if (!userId) {
      alert("⚠️ User information not found. Please login again.");
      gestureTriggeredRef.current = false;
      return;
    }
    if (contacts.length === 0) {
      alert("⚠️ No trusted contacts have been added yet.\n\nPlease add at least one trusted contact before using AI SOS.");
      gestureTriggeredRef.current = false;
      return;
    }
    if (!navigator.geolocation) {
      alert("⚠️ Location is not supported by this browser.");
      gestureTriggeredRef.current = false;
      return;
    }
    stopCamera();
    navigator.geolocation.getCurrentPosition(async (position) => {
      const latitude = position.coords.latitude;
      const longitude = position.coords.longitude;
      const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
      try {
        const response = await fetch(`${BACKEND_URL}/api/sos`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ latitude, longitude, contacts, userName, userId, type: "gesture" }),
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to send gesture SOS.");
        alert(`🚨 AI SOS ACTIVATED!\n\n✊ Emergency fist gesture detected.\n\n👤 User:\n${userName}\n\n📍 Location:\n${latitude}, ${longitude}\n\n🗺️ Google Maps:\n${mapsLink}\n\n👥 Trusted Contacts: ${contacts.length}\n\n✅ SOS saved successfully.`);
        window.open(mapsLink, "_blank");
      } catch (error) {
        console.error("Gesture SOS error:", error);
        alert("🚨 AI SOS could not be sent.\n\nCannot connect to GARV backend.");
        gestureTriggeredRef.current = false;
      }
    }, () => {
      alert("🚨 AI SOS activated.\n\n⚠️ Unable to get your location.\n\nPlease allow location access.");
      gestureTriggeredRef.current = false;
    });
  };

  const startFistCountdown = () => {
    if (countdownTimerRef.current || gestureTriggeredRef.current) return;
    let count = 3;
    setSosCountdown(count);
    countdownTimerRef.current = setInterval(() => {
      count--;
      if (count > 0) setSosCountdown(count);
      else {
        clearInterval(countdownTimerRef.current);
        countdownTimerRef.current = null;
        setSosCountdown(null);
        sendGestureSOS();
      }
    }, 1000);
  };

  const initializeHandDetection = async () => {
    try {
      setAiLoading(true);
      const vision = await FilesetResolver.forVisionTasks("https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.22/wasm");
      const handLandmarker = await HandLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numHands: 1,
      });
      handLandmarkerRef.current = handLandmarker;
      setAiLoading(false);
      return true;
    } catch (error) {
      console.error("AI initialization error:", error);
      setAiLoading(false);
      alert("❌ Could not initialize AI gesture detection.");
      return false;
    }
  };

  const detectHands = () => {
    const video = videoRef.current;
    const handLandmarker = handLandmarkerRef.current;
    if (!video || !handLandmarker || video.readyState < 2) {
      animationFrameRef.current = requestAnimationFrame(detectHands);
      return;
    }
    try {
      const results = handLandmarker.detectForVideo(video, performance.now());
      if (results.landmarks && results.landmarks.length > 0) {
        setHandDetected(true);
        const fist = isClosedFist(results.landmarks[0]);
        setFistDetected(fist);
        if (fist) startFistCountdown();
        else cancelFistCountdown();
      } else {
        setHandDetected(false);
        setFistDetected(false);
        cancelFistCountdown();
      }
    } catch (error) {
      console.error("Hand detection error:", error);
    }
    animationFrameRef.current = requestAnimationFrame(detectHands);
  };

  const startCamera = async () => {
    if (!userId) { alert("⚠️ Please login again before using AI Safety."); return; }
    if (contacts.length === 0) { alert("⚠️ Please add at least one trusted contact before using AI SOS."); return; }
    if (!navigator.mediaDevices?.getUserMedia) { alert("❌ Camera access is not supported by this browser."); return; }
    gestureTriggeredRef.current = false;
    cancelFistCountdown();
    const initialized = await initializeHandDetection();
    if (!initialized) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
      cameraStreamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setAiCameraActive(true);
      detectHands();
    } catch (error) {
      console.error("Camera error:", error);
      alert("❌ Camera access was denied.\n\nPlease allow camera permission and try again.");
    }
  };

  useEffect(() => () => {
    if (cameraStreamRef.current) cameraStreamRef.current.getTracks().forEach((track) => track.stop());
    if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    if (countdownTimerRef.current) clearInterval(countdownTimerRef.current);
  }, []);

  useEffect(() => {
    if (page !== "analytics" || !userId) return;
    const loadAnalytics = async () => {
      try {
        setAnalyticsLoading(true);
        const response = await fetch(`${BACKEND_URL}/api/analytics/${userId}`);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || "Failed to load analytics.");
        setAnalyticsData(data);
      } catch (error) {
        console.error("Analytics error:", error);
        alert("❌ Could not load Safety Analytics.");
      } finally { setAnalyticsLoading(false); }
    };
    loadAnalytics();
  }, [page, userId]);

  if (page === "login") return (
    <div className="login-page"><div className="login-box">
      <button className="back-btn" onClick={() => setPage("home")}>← Back</button>
      <div className="login-logo">G</div><h1>Welcome Back</h1><p>Login to your GARV safety account</p>
      <form onSubmit={async (e) => {
        e.preventDefault(); const formData = new FormData(e.currentTarget);
        const email = formData.get("email"); const password = formData.get("password");
        try {
          const response = await fetch(`${BACKEND_URL}/api/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
          const data = await response.json();
          if (response.ok) {
            setUserName(data.user.name); setUserId(data.user.id);
            try {
              const contactsResponse = await fetch(`${BACKEND_URL}/api/contacts/${data.user.id}`);
              const contactsData = await contactsResponse.json();
              setContacts(contactsResponse.ok ? contactsData.contacts || [] : []);
            } catch (error) { console.error("Failed to load trusted contacts:", error); setContacts([]); }
            alert(`Welcome back, ${data.user.name}!`); setPage("dashboard");
          } else alert(data.message || "Login failed.");
        } catch (error) { console.error("Login error:", error); alert("Cannot connect to GARV server."); }
      }}>
        <label>Email Address</label><input type="email" name="email" placeholder="Enter your email" required />
        <label>Password</label><input type="password" name="password" placeholder="Enter your password" required />
        <button type="submit" className="login-submit">Login</button>
      </form>
      <p className="login-register">Don't have an account? <button onClick={() => setPage("register")}>Register</button></p>
    </div></div>
  );

  if (page === "ai-safety") return (
    <div className="dashboard-page">
      <h1>🤖 AI Safety Detection</h1><p>Show a closed fist to activate Emergency SOS.</p>
      {!aiCameraActive ? <div className="dashboard-card">
        <h2>✊ Emergency Gesture</h2>
        <p>GARV uses AI hand-gesture detection to recognize an emergency fist gesture.</p>
        <p>When a closed fist is detected, a 3-second countdown will begin.</p>
        <p>If the gesture remains detected, GARV will automatically activate SOS.</p>
        <button onClick={startCamera} disabled={aiLoading}>{aiLoading ? "Initializing AI..." : "📷 Start AI Safety"}</button>
      </div> : <div className="dashboard-card">
        <h2>📷 AI Camera Active</h2>
        <div style={{ position: "relative", width: "100%", maxWidth: "700px", margin: "20px auto" }}>
          <video ref={videoRef} autoPlay playsInline muted style={{ width: "100%", borderRadius: "15px", background: "#111", transform: "scaleX(-1)" }} />
          {sosCountdown !== null && <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "rgba(127, 29, 29, 0.75)", borderRadius: "15px" }}>
            <div style={{ fontSize: "80px", fontWeight: "bold", color: "white" }}>{sosCountdown}</div>
            <h2 style={{ color: "white" }}>🚨 SOS ACTIVATING</h2><p style={{ color: "white" }}>Keep your fist visible</p>
          </div>}
        </div>
        <h2>{fistDetected ? "✊ Emergency fist detected!" : handDetected ? "🖐️ Hand detected" : "🔎 Looking for your hand..."}</h2>
        <p>{fistDetected ? "Hold the fist to activate SOS." : "Show your hand clearly to the camera."}</p>
        <button onClick={() => { cancelFistCountdown(); gestureTriggeredRef.current = false; stopCamera(); }}>🛑 Stop AI Safety</button>
      </div>}
      <button onClick={() => { cancelFistCountdown(); stopCamera(); setPage("dashboard"); }} className="back-home-button" style={{ marginTop: "25px" }}>← Back to Dashboard</button>
    </div>
  );

  if (page === "analytics") {
    const maxSOS = Math.max(...analyticsData.weeklySOS, 1);
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    return <div className="dashboard-page">
      <h1>📊 Safety Analytics</h1><p>Monitor your safety activity and emergency alerts.</p>
      <div className="dashboard-cards">
        {[ ["🚨 Total SOS", analyticsData.totalSOS, "Total emergency alerts"], ["✊ Gesture Alerts", analyticsData.gestureAlerts, "SOS alerts triggered by fist gesture"], ["🖱️ Manual Alerts", analyticsData.manualAlerts, "SOS alerts activated manually"], ["📍 Locations", analyticsData.locations, "Emergency locations recorded"] ].map(([title, value, text]) => <div className="dashboard-card" key={title}><h2>{title}</h2><strong style={{ fontSize: "42px", display: "block", marginTop: "15px" }}>{value}</strong><p>{text}</p></div>)}
      </div>
      <div className="dashboard-card" style={{ marginTop: "25px" }}><h2>📈 SOS Alerts — Last 7 Days</h2><p>Emergency activity throughout the week.</p><div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-around", height: "260px", marginTop: "30px", padding: "20px", gap: "15px" }}>{analyticsData.weeklySOS.map((value, index) => { const height = (value / maxSOS) * 180; return <div key={days[index]} style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%", flex: 1 }}><strong style={{ marginBottom: "8px" }}>{value}</strong><div style={{ width: "100%", maxWidth: "55px", height: `${height}px`, minHeight: "8px", borderRadius: "10px 10px 0 0", background: "linear-gradient(180deg, #ef4444, #7f1d1d)", transition: "height 0.3s ease" }} /><span style={{ marginTop: "10px" }}>{days[index]}</span></div>; })}</div></div>
      <div className="dashboard-card" style={{ marginTop: "25px" }}><h2>🛡️ Safety Summary</h2><div style={{ marginTop: "20px", lineHeight: "1.8" }}><p>🚨 <strong>{analyticsData.totalSOS}</strong> total emergency alerts recorded.</p><p>✊ <strong>{analyticsData.gestureAlerts}</strong> alerts were triggered using the emergency fist gesture.</p><p>🖱️ <strong>{analyticsData.manualAlerts}</strong> alerts were activated manually.</p><p>📍 <strong>{analyticsData.locations}</strong> emergency locations were recorded.</p></div></div>
      <div className="dashboard-card" style={{ marginTop: "25px", border: "1px solid rgba(255,255,255,0.15)" }}><h2>ℹ️ Analytics Status</h2><p>Analytics are connected to your MongoDB SOS history.</p>{analyticsLoading && <p>Loading latest analytics...</p>}</div>
      <button onClick={() => setPage("dashboard")} className="back-home-button" style={{ marginTop: "25px" }}>← Back to Dashboard</button>
    </div>;
  }

  if (page === "dashboard") return (
    <div className="dashboard-page">
      <h1>Welcome to GARV, {userName}! 🛡️</h1><p>Your personal safety dashboard</p>
      <div className="dashboard-cards">
        <div className="dashboard-card"><h2>🆘 Emergency SOS</h2><p>Quickly send an emergency alert.</p><button onClick={() => {
          if (!window.confirm("🚨 Are you sure you want to activate Emergency SOS?")) return;
          if (contacts.length === 0) { alert("⚠️ No trusted contacts have been added yet.\n\nPlease add at least one trusted contact before activating SOS."); return; }
          if (!navigator.geolocation) { alert("⚠️ Location is not supported by this browser."); return; }
          navigator.geolocation.getCurrentPosition(async (position) => {
            const latitude = position.coords.latitude, longitude = position.coords.longitude;
            const mapsLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
            try {
              const response = await fetch(`${BACKEND_URL}/api/sos`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ latitude, longitude, contacts, userName, userId, type: "manual" }) });
              const data = await response.json();
              if (!response.ok) { alert(data.message || "Failed to send emergency SOS."); return; }
              const contactList = contacts.map((contact) => `👤 ${contact.name}\n📞 ${contact.phone}\n\n`).join("");
              alert(`🚨 Emergency SOS activated successfully!\n\n👤 User:\n${userName}\n\n📍 Your Location:\nLatitude: ${latitude}\nLongitude: ${longitude}\n\n🗺️ Google Maps:\n${mapsLink}\n\n👥 Trusted Contacts:\n\n${contactList}✅ SOS information successfully sent to GARV backend.`);
              window.open(mapsLink, "_blank");
            } catch (error) { console.error("SOS error:", error); alert("🚨 Emergency SOS could not be sent.\n\nCannot connect to GARV backend."); }
          }, () => alert("🚨 Emergency SOS activated!\n\n⚠️ Unable to get your location.\n\nPlease make sure location permission is enabled."));
        }}>Activate SOS</button></div>

        <div className="dashboard-card"><h2>📍 Live Location</h2><p>Share and monitor your current location.</p><button onClick={() => {
          if (!navigator.geolocation) { alert("Location is not supported by your browser."); return; }
          navigator.geolocation.getCurrentPosition((position) => { const url = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`; window.open(url, "_blank"); }, () => alert("Unable to get your location. Please allow location access in your browser."));
        }}>View My Location</button></div>

        <div className="dashboard-card"><h2>🤖 AI Safety</h2><p>Use AI hand-gesture detection to activate SOS automatically.</p><button onClick={() => setPage("ai-safety")}>Start AI Safety</button></div>
        <div className="dashboard-card"><h2>📊 Safety Analytics</h2><p>View your safety activity and alerts.</p><button onClick={() => setPage("analytics")}>View Analytics</button></div>

        <div className="dashboard-card"><h2>👥 Trusted Contacts</h2><p>Add people who should receive your emergency alerts.</p><button onClick={async () => {
          if (!userId) { alert("⚠️ User information not found. Please login again."); return; }
          const name = prompt("Enter trusted contact name:"); if (!name) return;
          const phone = prompt("Enter trusted contact phone number:"); if (!phone) return;
          try {
            const response = await fetch(`${BACKEND_URL}/api/contacts`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ userId, name, phone }) });
            const data = await response.json();
            if (!response.ok) { alert(data.message || "Failed to save trusted contact."); return; }
            setContacts(data.contacts || [...contacts, { name, phone }]);
            alert(`✅ ${name} added as a trusted contact!\n\nThe contact has been saved to your GARV account.`);
          } catch (error) { console.error("Add contact error:", error); alert("❌ Could not save trusted contact.\n\nCannot connect to GARV backend."); }
        }}>Manage Contacts</button>
          {contacts.length > 0 && <div style={{ marginTop: "20px" }}><h3>Saved Contacts</h3>{contacts.map((contact, index) => <div key={contact._id || index} style={{ marginTop: "10px", padding: "12px", borderRadius: "10px", background: "rgba(255,255,255,0.08)" }}><strong>👤 {contact.name}</strong><p style={{ margin: "5px 0 0" }}>📞 {contact.phone}</p><button onClick={async () => {
            if (!window.confirm(`Are you sure you want to delete ${contact.name} from your trusted contacts?`)) return;
            try {
              const response = await fetch(`${BACKEND_URL}/api/contacts/${userId}/${contact._id}`, { method: "DELETE" });
              const data = await response.json();
              if (!response.ok) { alert(data.message || "Failed to delete contact."); return; }
              setContacts(data.contacts || []); alert(`✅ ${contact.name} has been deleted.`);
            } catch (error) { console.error("Delete contact error:", error); alert("❌ Could not delete contact.\n\nCannot connect to GARV backend."); }
          }} style={{ marginTop: "10px", padding: "8px 14px", border: "none", borderRadius: "8px", cursor: "pointer", background: "#dc2626", color: "white" }}>🗑️ Delete</button></div>)}</div>}
        </div>
      </div>
      <button onClick={() => { cancelFistCountdown(); stopCamera(); setUserId(""); setUserName("User"); setContacts([]); setPage("home"); }} style={{ marginTop: "15px", padding: "10px 20px", border: "none", borderRadius: "8px", cursor: "pointer", background: "#dc2626", color: "white", fontWeight: "600" }}>🚪 Logout</button>
      <button onClick={() => setPage("home")} className="back-home-button">← Back to Home</button>
    </div>
  );

  if (page === "register") return (
    <div className="login-page"><div className="login-box">
      <button className="back-btn" onClick={() => setPage("home")}>← Back</button><div className="login-logo">G</div><h1>Create Account</h1><p>Create your GARV safety account</p>
      <form onSubmit={async (e) => {
        e.preventDefault(); const formData = new FormData(e.currentTarget); const name = formData.get("name"), email = formData.get("email"), password = formData.get("password");
        try {
          const response = await fetch(`${BACKEND_URL}/api/register`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, email, password }) });
          const data = await response.json(); if (response.ok) { alert("Account created successfully!"); setPage("login"); } else alert(data.message || "Registration failed.");
        } catch (error) { console.error("Registration error:", error); alert("Cannot connect to GARV server."); }
      }}>
        <label>Full Name</label><input type="text" name="name" placeholder="Enter your name" required />
        <label>Email Address</label><input type="email" name="email" placeholder="Enter your email" required />
        <label>Password</label><input type="password" name="password" placeholder="Create a password" required />
        <button type="submit" className="login-submit">Create Account</button>
      </form>
      <p className="login-register">Already have an account? <button onClick={() => setPage("login")}>Login</button></p>
    </div></div>
  );

  return (
    <div className="app">
      <nav className="navbar"><div className="logo"><div className="logo-icon">G</div><div><h2>GARV</h2><span>Women Safety & Analytics</span></div></div>
        <div className="nav-links"><a href="#home">Home</a><a href="#features">Features</a><a href="#about">About</a><button className="login-btn" onClick={() => setPage("login")}>Login</button><button className="register-btn" onClick={() => setPage("dashboard")}>Dashboard</button><button className="register-btn" onClick={() => setPage("register")}>Register</button></div>
      </nav>
      <main id="home" className="hero"><div className="hero-content"><div className="badge">🛡️ Smart Women Safety Platform</div><h1>Your Safety.<br /><span>Our Priority.</span></h1><p>GARV is a women safety platform combining emergency response, AI gesture detection, real-time location tracking, trusted contacts and safety analytics.</p><div className="hero-buttons"><button className="sos-btn" onClick={() => setPage("login")}>🚨 Emergency SOS</button><button className="explore-btn" onClick={() => document.getElementById("features")?.scrollIntoView()}>Explore Features →</button></div><div className="stats"><div><strong>24/7</strong><span>Safety Support</span></div><div><strong>SOS</strong><span>Emergency Response</span></div><div><strong>AI</strong><span>Gesture Detection</span></div></div></div>
        <div className="safety-card"><div className="card-top"><span><i></i>Safety Status</span><b>SAFE</b></div><div className="shield">🛡️</div><h2>You are protected</h2><p>Your safety monitoring system is active.</p><button className="big-sos" onClick={() => setPage("login")}>SOS</button><small>Press in an emergency to alert your contacts</small></div>
      </main>
      <section id="features" className="features"><div className="section-title"><span>POWERFUL FEATURES</span><h2>Safety technology built for you</h2><p>One platform connecting emergency response, AI gesture detection and analytics.</p></div><div className="feature-grid">
        <div className="feature-card"><div className="feature-icon">🚨</div><h3>Emergency SOS</h3><p>Quickly send an emergency alert to your trusted contacts.</p></div>
        <div className="feature-card"><div className="feature-icon">✊</div><h3>AI Gesture Detection</h3><p>Detect an emergency fist gesture and automatically activate SOS.</p></div>
        <div className="feature-card"><div className="feature-icon">📍</div><h3>Live Location</h3><p>Share your location during an emergency.</p></div>
        <div className="feature-card"><div className="feature-icon">📊</div><h3>Safety Analytics</h3><p>Analyze emergency alerts and safety activity.</p></div>
      </div></section>
      <section id="about" className="about"><div><span>ABOUT GARV</span><h2>Technology that stands with you.</h2></div><p>GARV brings together modern web technology, AI hand-gesture detection, location services and data analytics to create a smarter women safety ecosystem.</p></section>
      <footer><strong>GARV</strong><span>Women Safety & Analytics</span><p>Built for a safer tomorrow.</p></footer>
    </div>
  );
}

export default App;
