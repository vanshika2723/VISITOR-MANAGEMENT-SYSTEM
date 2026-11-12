
const User = require("../models/User");
const createNotification = require("./createNotification");

const notifyByRole = async ({
  roles,
  title,
  message,
  type = "system",
  visitor = null,
  actionUrl = "",
  excludeUserId = null,
}) => {
  try {
    const query = {
      role: { $in: roles },
      isActive: true,
    };

    if (excludeUserId) {
      query._id = { $ne: excludeUserId };
    }

    const users = await User.find(query).select("_id");

    return await Promise.all(
      users.map((user) =>
        createNotification({
          recipient: user._id,
          title,
          message,
          type,
          visitor,
          actionUrl,
        })
      )
    );
  } catch (error) {
    console.error("Role notification failed:", error.message);
    return [];
  }
};

module.exports = notifyByRole;
