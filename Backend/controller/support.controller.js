const SupportTicket = require("../model/supportTicket.model");

const createSupportTicket = async (req, res) => {
  try {
    const userId = req.user._id;
    const { name, email, subject, category, message } = req.body;

    if (!subject || !category || !message) {
      return res.status(400).json({ error: "Please fill in all required fields." });
    }

    const ticket = new SupportTicket({
      userId,
      name: name || req.user.fullName,
      email: email || req.user.email,
      subject,
      category,
      message,
    });

    await ticket.save();

    res.status(201).json({ message: "Support ticket created successfully.", ticket });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

const getSupportTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const tickets = await SupportTicket.find({ userId }).sort({ createdAt: -1 });
    res.status(200).json({ tickets });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    res.status(500).json({ error: "Internal server error." });
  }
};

module.exports = {
  createSupportTicket,
  getSupportTickets,
};
