const express = require('express');
const fs = require('fs');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { expressjwt: expressJwt } = require('express-jwt');
const app = express();

const USERS_FILE = './users.json';

app.use(cors());
app.use(express.json());

// Helper function to read users from a file
const readUsersFromFile = () => {
  try {
    const usersData = fs.readFileSync(USERS_FILE, 'utf-8');
    return JSON.parse(usersData);
  } catch (error) {
    return [];
  }
};

// Helper function to write users to a file
const writeUsersToFile = (users) => {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
};

// Register Route
app.post('/api/register', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required' });
  }

  let users = readUsersFromFile();
  const userExists = users.find(user => user.username === username);

  if (userExists) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  const hashedPassword = bcrypt.hashSync(password, 8);
  users.push({ username, password: hashedPassword });
  writeUsersToFile(users);

  res.status(201).json({ message: 'User registered successfully!' });
});

// Login Route
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  let users = readUsersFromFile();
  const user = users.find(u => u.username === username);
  if (!user) {
    return res.status(400).json({ message: 'User not found' });
  }
  const isPasswordValid = bcrypt.compareSync(password, user.password);
  if (!isPasswordValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }
  const token = jwt.sign({ username }, 'your_jwt_secret', { expiresIn: '1h' });
  res.json({ token });
});

// Protected Route Example
app.get('/api/protected', expressJwt({ secret: 'your_jwt_secret', algorithms: ['HS256'] }), (req, res) => {
  res.json({ message: 'This is a protected route', user: req.user });
});

// Hard-coded articles data
const articles = [
  {
    title: "Inte klart med ersättare för Ribbenvik",
    summary: "Regeringen och SD har ännu inte hittat någon ersättare för Migrationsverkets avgående generaldirektör Mikael Ribbenvik.",
    link: "https://www.aftonbladet.se/nyheter/a/8JWWL2/inte-klart-med-ersattare-for-ribbenvik",
    published: new Date(Date.now() - 86400000),
    topic: ["SamhalleKonflikter"]
  },
  {
    title: "Drogs in i inhägnad – dödades av 40 krokodiler",
    summary: "En 72-årig man har dödats av omkring 40 krokodiler sedan han dragits in i en inhägnad på familjens reptilfarm.",
    link: "https://www.aftonbladet.se/nyheter/a/bgWW6e/drogs-in-i-inhagnad-dodades-av-40-krokodiler",
    published: new Date(Date.now() - 172800000),
    topic: ["Ekonomi"]
  },
];

// API endpoint to get articles
app.get('/api/articles', (req, res) => {
  let filteredArticles = articles;
  const { sortBy } = req.query;

  if (sortBy === 'newest') {
    filteredArticles = filteredArticles.sort((a, b) => new Date(b.published) - new Date(a.published));
  } else if (sortBy === 'oldest') {
    filteredArticles = filteredArticles.sort((a, b) => new Date(a.published) - new Date(b.published));
  }

  res.json(filteredArticles);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
