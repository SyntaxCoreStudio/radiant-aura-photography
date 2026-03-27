const express = require("express");
const nodemailer = require("nodemailer");
const rateLimit = require("express-rate-limit");

const router = express.Router();

// Rate limiter for contact form
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many contact requests. Please try again later.",
  },
});

// Create mail transporter
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// Contact form route
router.post("/", contactLimiter, async (req, res) => {
  try {
    const { name, email, message, website } = req.body;

    // Honeypot spam field
    if (website) {
      return res.status(400).json({
        success: false,
        message: "Spam detected.",
      });
    }

    // Basic validation
    if (!name || !email || !message) {
      return res.status(400).json({
        success: false,
        message: "All fields are required.",
      });
    }

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_TO,
      replyTo: email,
      subject: `New contact form submission from ${name}`,
      text: `
Name: ${name}
Email: ${email}

Message:
${message}
      `,
    };

    await transporter.sendMail(mailOptions);

    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Thanks for reaching out!",
      text: `Hi ${name},

Thanks for contacting Radiant Aura Photography.

I've received your message and will get back to you shortly.

– Radiant Aura Photography`,
    });

    return res.json({
      success: true,
      message: "Message sent successfully.",
    });
  } catch (error) {
    console.error("Contact form error:", error);
    return res.status(500).json({
      success: false,
      message: "Something went wrong sending your message.",
    });
  }
});

module.exports = router;
