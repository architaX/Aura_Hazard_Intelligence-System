import clientPromise from "@/lib/mongodb";
import { hash } from 'bcryptjs'; // To hash the password

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method Not Allowed' });
  }

  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const client = await clientPromise;
    const db = client.db("AuraDB");
    const usersCollection = db.collection("users");

    // 1. Check if user already exists
    const existingUser = await usersCollection.findOne({ email: email });
    if (existingUser) {
      return res.status(409).json({ message: 'User already exists' });
    }

    // 2. Hash the password
    const hashedPassword = await hash(password, 12); // 12 salt rounds

    // 3. Create the new user
    const newUser = {
      name: name,
      email: email,
      password: hashedPassword,
      role: 'user', // Default role
      createdAt: new Date(),
    };

    // 4. Insert into database
    const result = await usersCollection.insertOne(newUser);

    res.status(201).json({ message: 'User created successfully', userId: result.insertedId });

  } catch (error) {
    console.error('Registration failed:', error);
    res.status(500).json({ message: 'Error creating user', error: error.message });
  }
}