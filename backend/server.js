const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);

const express = require("express");
const User = require("./models/User");
const SOS = require("./models/SOS");
const cors = require("cors");
const bcrypt = require("bcryptjs");
require("dotenv").config();
const connectDB = require("./config/db");

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors());
app.use(express.json());


// ==========================================
// REGISTER USER
// ==========================================

app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        message: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      trustedContacts: [],
    });

    res.status(201).json({
      message: "Registration successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustedContacts: user.trustedContacts,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);

    res.status(500).json({
      message: "Registration failed",
      error: error.message,
    });
  }
});


// ==========================================
// LOGIN USER
// ==========================================

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    const passwordMatch = await bcrypt.compare(
      password,
      user.password
    );

    if (!passwordMatch) {
      return res.status(400).json({
        message: "Invalid email or password",
      });
    }

    res.json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        trustedContacts: user.trustedContacts || [],
      },
    });
  } catch (error) {
    console.error("Login error:", error);

    res.status(500).json({
      message: "Login failed",
      error: error.message,
    });
  }
});


// ==========================================
// GET TRUSTED CONTACTS
// ==========================================

app.get("/api/contacts/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      success: true,
      contacts: user.trustedContacts || [],
    });
  } catch (error) {
    console.error("Get contacts error:", error);

    res.status(500).json({
      message: "Failed to get trusted contacts",
      error: error.message,
    });
  }
});


// ==========================================
// ADD TRUSTED CONTACT
// ==========================================

app.post("/api/contacts", async (req, res) => {
  try {
    const {
      userId,
      name,
      phone,
    } = req.body;

    if (!userId) {
      return res.status(400).json({
        message: "User ID is required.",
      });
    }

    if (!name || !phone) {
      return res.status(400).json({
        message: "Contact name and phone number are required.",
      });
    }

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }

    user.trustedContacts.push({
      name,
      phone,
    });

    await user.save();

    res.json({
      success: true,
      message: "Trusted contact added successfully.",
      contact: {
        name,
        phone,
      },
      contacts: user.trustedContacts,
    });
  } catch (error) {
    console.error("Add contact error:", error);

    res.status(500).json({
      message: "Failed to add trusted contact.",
      error: error.message,
    });
  }
});


// ==========================================
// DELETE TRUSTED CONTACT
// ==========================================

app.delete(
  "/api/contacts/:userId/:contactId",
  async (req, res) => {
    try {
      const {
        userId,
        contactId,
      } = req.params;

      const user = await User.findById(userId);

      if (!user) {
        return res.status(404).json({
          message: "User not found.",
        });
      }

      user.trustedContacts =
        user.trustedContacts.filter(
          (contact) =>
            contact._id.toString() !== contactId
        );

      await user.save();

      res.json({
        success: true,
        message:
          "Trusted contact deleted successfully.",
        contacts: user.trustedContacts,
      });
    } catch (error) {
      console.error(
        "Delete contact error:",
        error
      );

      res.status(500).json({
        message: "Failed to delete trusted contact.",
        error: error.message,
      });
    }
  }
);


// ==========================================
// TEST ROUTE
// ==========================================

app.get("/", (req, res) => {
  res.json({
    message:
      "GARV Backend is running successfully!",
    status: "OK",
  });
});


// ==========================================
// EMERGENCY SOS API
// ==========================================

app.post("/api/sos", async (req, res) => {
  try {
    const {
      latitude,
      longitude,
      contacts,
      userName,
      userId,
      type,
    } = req.body;

    console.log("🚨 SOS REQUEST RECEIVED");

    console.log("User:", userName);

    console.log(
      "Location:",
      latitude,
      longitude
    );

    console.log(
      "Trusted Contacts:",
      contacts
    );

    console.log(
      "SOS Type:",
      type
    );


    // ------------------------------------------
    // CHECK LOCATION
    // ------------------------------------------

    if (
      latitude === undefined ||
      longitude === undefined
    ) {
      return res.status(400).json({
        message:
          "Location is required for SOS.",
      });
    }


    // ------------------------------------------
    // CHECK TRUSTED CONTACTS
    // ------------------------------------------

    if (
      !contacts ||
      contacts.length === 0
    ) {
      return res.status(400).json({
        message:
          "No trusted contacts found.",
      });
    }


    // ------------------------------------------
    // CREATE GOOGLE MAPS LINK
    // ------------------------------------------

    const mapsLink =
      `https://www.google.com/maps?q=${latitude},${longitude}`;

    console.log(
      "🗺️ Google Maps:",
      mapsLink
    );


    // ------------------------------------------
    // CREATE EMERGENCY MESSAGE
    // ------------------------------------------

    const emergencyMessage =
      `🚨 GARV EMERGENCY ALERT 🚨\n\n` +
      `👤 User: ${userName}\n\n` +
      `📍 Emergency Location:\n` +
      `${mapsLink}\n\n` +
      `⚠️ Please contact the user immediately.\n\n` +
      `This alert was generated by GARV Women Safety Platform.`;

    console.log(
      "📱 Emergency Message:"
    );

    console.log(
      emergencyMessage
    );


    // ------------------------------------------
    // CHECK USER ID
    // ------------------------------------------

    if (!userId) {
      return res.status(400).json({
        message:
          "User ID is required to save SOS history.",
      });
    }


    // ------------------------------------------
    // FIND USER
    // ------------------------------------------

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found.",
      });
    }


    // ------------------------------------------
    // DETERMINE SOS TYPE
    // ------------------------------------------

    const sosType =
      type === "gesture"
        ? "gesture"
        : "manual";


    // ------------------------------------------
    // SAVE SOS HISTORY
    // ------------------------------------------

    const sosRecord = await SOS.create({
      userId: user._id,
      userName: user.name,
      type: sosType,
      latitude: Number(latitude),
      longitude: Number(longitude),
    });


    console.log(
      "✅ SOS HISTORY SAVED:",
      sosRecord._id
    );


    // ------------------------------------------
    // SEND RESPONSE
    // ------------------------------------------

    res.json({
      success: true,

      message:
        "Emergency SOS received and saved successfully.",

      mapsLink: mapsLink,

      contacts: contacts,

      sos: {
        id: sosRecord._id,
        type: sosRecord.type,
        userName: sosRecord.userName,
        latitude: sosRecord.latitude,
        longitude: sosRecord.longitude,
        createdAt: sosRecord.createdAt,
      },
    });

  } catch (error) {
    console.error(
      "SOS ERROR:",
      error
    );

    res.status(500).json({
      message:
        "Failed to process SOS.",

      error:
        error.message,
    });
  }
});


// ==========================================
// START SERVER
// ==========================================

app.get("/api/analytics/:userId", async (req, res) => {
  try {
    const { userId } = req.params;

    const records = await SOS.find({ userId }).sort({ createdAt: 1 });

    const totalSOS = records.length;

    const gestureAlerts = records.filter(
      (record) => record.type === "gesture"
    ).length;

    const manualAlerts = records.filter(
      (record) => record.type === "manual"
    ).length;

    const locations = records.length;

    const weeklySOS = Array(7).fill(0);

    const today = new Date();

    records.forEach((record) => {
      const recordDate = new Date(record.createdAt);

      const diffMs = today.getTime() - recordDate.getTime();

      const diffDays = Math.floor(
        diffMs / (1000 * 60 * 60 * 24)
      );

      if (diffDays >= 0 && diffDays < 7) {
        const dayIndex = 6 - diffDays;
        weeklySOS[dayIndex]++;
      }
    });

    res.json({
      totalSOS,
      gestureAlerts,
      manualAlerts,
      locations,
      weeklySOS,
    });
  } catch (error) {
    console.error("Analytics error:", error);

    res.status(500).json({
      message: "Failed to load analytics.",
    });
  }
});

app.listen(PORT, () => {
  console.log(
    `GARV Backend running on http://localhost:${PORT}`
  );
});