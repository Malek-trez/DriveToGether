import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { pool } from '../db/db.js'; // Import the database connection

const secretKey = 'your_secret_key';

// Function to generate JWT token
function generateToken(user) {
  return jwt.sign({ userId: user.id, username: user.username }, secretKey, { expiresIn: '1h' });
}

// Controller for handling user signup
export async function signup(req, res) {
  const { username, password, confirmPassword, email, phoneNumber, role } = req.body;

  if (password !== confirmPassword) {
    return res.status(400).json({ message: 'Passwords do not match' });
  }

  try {
    // Check if user already exists
    const existsQuery = 'SELECT * FROM users WHERE username = $1';
    const { rows } = await pool.query(existsQuery, [username]);
    if (rows.length) {
      return res.status(409).json({ message: 'Username already taken' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create a new user and store it in the database
    const insertUserQuery = 'INSERT INTO users(username, password, email, phone_number, role) VALUES ($1, $2, $3, $4, $5) RETURNING id, username';
    const newUser = await pool.query(insertUserQuery, [username, hashedPassword, email, phoneNumber, role]);

    // Generate JWT token
    const token = generateToken(newUser.rows[0]);
    res.status(201).json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Error registering new user', err });
  }
}
