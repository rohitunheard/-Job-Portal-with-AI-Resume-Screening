const Notification = require('../models/Notification')

const userRoom = (role, id) => `${role}:${id}`

const createNotification = async (req, data) => {
  const notification = await Notification.create(data)
  const payload = notification.toObject()
  const io = req.app.get('io')

  if (io) {
    io.to(userRoom(payload.recipientRole, payload.recipientId)).emit('notification:new', payload)
  }

  return payload
}

module.exports = {
  createNotification,
  userRoom,
}
