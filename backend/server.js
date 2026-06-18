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


dotenv.config();
const app = express();
app.use(cors());
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

app.get('/', (req, res) => {
    res.send('Api is running');
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});