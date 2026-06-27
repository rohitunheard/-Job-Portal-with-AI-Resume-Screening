const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const path = require('path');
const connectDB = require('./confg/db');
const userinfoRoutes = require('./routes/userinfo');
const userresumeRoutes = require('./routes/userresume');
const userlogininfoRoutes = require('./routes/userlogininfo');
const jobapplicationRoutes = require('./routes/jobapplication');
const adminRoutes = require('./routes/admin');
const resumeScreenRoutes = require('./routes/resumescreen');
const employerRoutes = require('./routes/employer');
const jobPostingsRoutes = require('./routes/jobpostings');
const conversationRoutes = require('./routes/conversations');
const messageRoutes = require('./routes/messages');
const profileRoutes = require('./routes/profile');
const notificationRoutes = require('./routes/notifications');
const updatepasswordRoutes = require('./routes/updatepassword');
const chatbotRoutes = require('./routes/chatbot');
const passwordResetRoutes = require('./routes/passwordReset');

dotenv.config();
const app = express();
app.use(cors({
  origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
}));
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
connectDB();

//crud user info
app.use('/api/userinfo', userinfoRoutes);
//crud user resume
app.use('/api/userresume', userresumeRoutes);
//crud user login info
app.use('/api/userlogininfo', userlogininfoRoutes);
//crud job applications
app.use('/api/jobapplications', jobapplicationRoutes);
//admin
app.use('/api/admin', adminRoutes);
//ai resume screening
app.use('/api/resume-screen', resumeScreenRoutes);
//employer auth
app.use('/api/employer', employerRoutes);
//job postings
app.use('/api/jobpostings', jobPostingsRoutes);
//conversations
app.use('/api/conversations', conversationRoutes);
//messages
app.use('/api/messages', messageRoutes);
//profiles
app.use('/api/profile', profileRoutes);
//notifications
app.use('/api/notifications', notificationRoutes);
//update password
app.use('/api/update-password', updatepasswordRoutes);
//chatbot
app.use('/api/chatbot', chatbotRoutes);
//password reset
app.use('/api/password-reset', passwordResetRoutes);

app.get('/', (req, res) => {
    res.send('Api is running');
});

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const io = require('socket.io')(server, {
  cors: {
    origin: ["http://localhost:3000", "http://localhost:5173", "http://localhost:5174"],
  },
});
app.set('io', io);

let users = [];

const addUser = ({ userId, role = 'user' }, socketId) => {
  if (!userId) return;
  !users.some((user) => user.userId === userId && user.role === role) &&
    users.push({ userId, role, socketId });
};

const removeUser = (socketId) => {
  users = users.filter((user) => user.socketId !== socketId);
};

const getUser = (userId, role) => {
  return users.find((user) => user.userId === userId && (!role || user.role === role));
};

io.on('connection', (socket) => {
  //when connect
  console.log('a user connected.');

  //take userId and socketId from user
  socket.on('addUser', (payload) => {
    const data = typeof payload === 'object' && payload !== null
      ? { userId: String(payload.userId || payload.id || ''), role: payload.role || 'user' }
      : { userId: String(payload || ''), role: 'user' };

    addUser(data, socket.id);
    if (data.userId) {
      socket.join(`${data.role}:${data.userId}`);
      socket.join(data.userId);
    }
    io.emit('getUsers', users);
  });

  //send and get message
  socket.on('sendMessage', ({ senderId, receiverId, receiverRole, text }) => {
    const user = getUser(receiverId, receiverRole);
    if (user) {
      io.to(user.socketId).emit('getMessage', {
        senderId,
        text,
      });
    }
  });

  //when disconnect
  socket.on('disconnect', () => {
    console.log('a user disconnected!');
    removeUser(socket.id);
    io.emit('getUsers', users);
  });
});
