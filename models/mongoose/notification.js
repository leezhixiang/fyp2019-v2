const mongoose = require("mongoose");
const moment = require("moment");

const User = require("./user");

const NotificationSchema = new mongoose.Schema({
  recipient_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  sender_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  type: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  time_stamp: {
    type: String,
    default: moment().format("YYYY-MM-DD HH:mm")
  },
  isRead: {
    type: Boolean,
    default: false
  }
});

module.exports = mongoose.model(
  "Notification",
  NotificationSchema,
  "notifications"
);
