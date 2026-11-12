
let io;

const setIO = (socketInstance) => {
  io = socketInstance;
};

const getIO = () => {
  if (!io) {
    throw new Error("Socket.IO is not initialized");
  }

  return io;
};

const emitVisitorUpdate = (eventData = {}) => {
  if (!io) return;

  // Send only to authenticated connected users
  io.emit("visitorUpdated", eventData);
};

module.exports = {
  setIO,
  getIO,
  emitVisitorUpdate,
};
