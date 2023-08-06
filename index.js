const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const session = require('express-session');
const flash = require('express-flash');
const bodyParser = require('body-parser');
const user_model = require('./model/users');
const bcrypt = require('bcrypt');
const path = require('path');

dotenv.config();
const User = user_model.users;

mongoose.connect(process.env.DATA_URL)
  .then(() => {
    console.log('Connected to the database');
  })
  .catch((error) => {
    console.error('Failed to connect to the database', error);
  });

const server = express();
server.use(express.static(path.join(__dirname, 'build')));
server.use(cors());
server.use(flash());
server.use(express.json());
server.use(bodyParser.urlencoded({ extended: false }));
server.use(session({ secret: 'secret', resave: false, saveUninitialized: false }));

// Routes
server.get('/', async (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});


server.get('/savedartical', async (req, res) => {
  try {
    const userId = req.query.userid;

    // Find the user by their ID
    const user = await User.findById(userId);

    // Check if the user exists
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Send the saved articles as a response
    res.json({ savedArticles: user.savedArticles });
  } catch (error) {
    console.error('Error fetching saved articles:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch saved articles' });
  }
});

server.post('/savedartical', async (req, res) => {
  const { article,userid } = req.body;
  try {
    const userId = userid.userid;
    // Find the user by their ID
    const user = await User.findById(userId);
    // Check if the user exists
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Add the article to the user's savedArticles array
    user.savedArticles.push(article);
    // Save the updated user document
    await user.save();

    res.json({ success: true, message: 'Article saved successfully' });
  } catch (error) {
    console.error('Error saving article:', error);
    res.status(500).json({ success: false, message: 'Failed to save article' });
  }
});

server.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user) {
    // In a real scenario, you'd generate a token here and return it as the response
    res.json({ success: false, message: 'No user with that email' });
  } else {
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (passwordMatch) {
      // Store the user ID in the session
      const id = user._id;
      res.json({ success: true, message: 'Logged In', userid:id });
    } else {
      res.json({ success: false, message: 'Incorrect Password' });
    }
  }
});

server.post('/registration', async (req, res) => {
  const { user, email, password, topics } = req.body;
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    res.json({ success: false, message: 'Email is already registered with another account' });
  } else {
    bcrypt.hash(password, 10, async (err, hashedPassword) => {
      if (err) {
        return res.status(500).send('Internal Server Error');
      }
      try {
        // Create a new USER document with the hashed password
        const newuser = new User({
          username: user,
          email,
          password: hashedPassword,
          topics: topics, // Save the topics in the database
        });

        // Save the USER to the database
        await newuser.save();
        const id = newuser._id;
        res.json({ success: true, message: 'Registration Successful', userid:id});
      } catch (error) {
        res.status(500).send('Internal Server Error');
      }
    });
  }
});

server.get("/home", async (req, res) => {
  try {
    // Get the user ID from the session
    const userId = req.query.userid;
    // Make sure to await the result of User.findById
    const user = await User.findById(userId);

    // If the user is not found, send an error response
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Send the user data as a response
    res.json({ user: user.username, email: user.email, topics: user.topics });
  } catch (error) {
    console.error("Error fetching user data:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// Start the server
const port = process.env.PORT;
server.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
