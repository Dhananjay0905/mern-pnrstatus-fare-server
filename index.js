require('dotenv').config();
const express = require('express');
const connectDB = require('./db/dbConnection');
const User = require('./db/user');
const cors = require('cors');
const bcrypt = require('bcrypt');
const axios = require('axios');

const app = express();
const port = 8000;

// Middleware for parsing JSON
app.use(express.json());

// Enable Cors
app.use(cors({
    origin: ["https://mern-pnrstatus-fare.vercel.app/"],
    methods: ["GET", "POST"],
    credentials: true
}));

// Registration endpoint
app.post('/register', async (req, res) => {
    try {
        const {
            username,
            password,
            email,
            name,
            nationality,
            age,
            mobile,
        } = req.body;

        // Check if username or email already exists
        const existingUser = await User.findOne({ username });
        if (existingUser) return res.status(400).json({ msg: 'Username already exists' });

        const existingEmail = await User.findOne({ email });
        if (existingEmail) return res.status(400).json({ msg: 'Email already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = new User({
            username,
            password: hashedPassword,
            email,
            name,
            nationality,
            age: parseInt(age),
            mobile,
        });

        await user.save();
        res.status(201).json({ message: 'Registration Successful' });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ message: 'Registration Failed' });
    }
});

// Login endpoint
app.post('/', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ error: 'Invalid Username or Password' });
        }

        if (!(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({ error: 'Invalid Credentials' });
        }

        res.status(200).json({ message: 'Login Successful' });
    } catch (error) {
        res.status(500).json({ error: 'Login Failed' });
    }
});

// Function to fetch fare from RapidAPI
async function fetchFareFromAPI(trainNo, fromStationCode, toStationCode) {
    const options = {
        method: 'GET',
        url: 'https://irctc1.p.rapidapi.com/api/v2/getFare',
        params: {
            trainNo,
            fromStationCode,
            toStationCode
        },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'irctc1.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch fare details');
    }
}

// Endpoint to fetch fare details
app.get('/fare', async (req, res) => {
    const { trainNo, fromStationCode, toStationCode } = req.query;

    try {
        const fareDetails = await fetchFareFromAPI(trainNo, fromStationCode, toStationCode);
        res.status(200).json({ fare: fareDetails });
    } catch (error) {
        console.error('Error fetching fare details:', error);
        res.status(500).json({ error: 'Failed to fetch fare details' });
    }
});

// Function to fetch PNR status 
async function fetchPNRStatusFromAPI(pnr) {
    const options = {
        method: 'GET',
        url: 'https://irctc1.p.rapidapi.com/api/v3/getPNRStatus',
        params: { pnrNumber: pnr },
        headers: {
            'x-rapidapi-key': process.env.RAPIDAPI_KEY,
            'x-rapidapi-host': 'irctc1.p.rapidapi.com'
        }
    };

    try {
        const response = await axios.request(options);
        return response.data;
    } catch (error) {
        throw new Error('Failed to fetch PNR status');
    }
}

// Endpoint to fetch PNR status
app.get('/pnr/:pnr', async (req, res) => {
    const { pnr } = req.params;

    try {
        const pnrStatus = await fetchPNRStatusFromAPI(pnr);
        res.status(200).json({ status: pnrStatus });
    } catch (error) {
        console.error('Error fetching PNR status:', error);
        res.status(500).json({ error: 'Failed to fetch PNR status' });
    }
});

connectDB();

app.listen(port, () => {
    console.log(`Server is listening on port ${port}`);
});
