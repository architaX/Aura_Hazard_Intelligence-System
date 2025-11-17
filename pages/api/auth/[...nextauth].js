import NextAuth from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import clientPromise from "@/lib/mongodb"; // To connect to DB
import { compare } from 'bcryptjs'; // To check passwords

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      
      // --- THIS IS THE UPDATED LOGIC ---
      async authorize(credentials, req) {
        // 1. Connect to the 'users' collection in our database
        const client = await clientPromise;
        const db = client.db("AuraDB");
        const usersCollection = db.collection("users");

        // 2. Find the user by their email
        const user = await usersCollection.findOne({ 
          email: credentials.email 
        });

        if (!user) {
          // No user found with that email
          throw new Error("No user found with this email.");
        }

        // 3. Check if the password is correct
        const isValid = await compare(
          credentials.password, 
          user.password // The hashed password from the DB
        );

        if (!isValid) {
          throw new Error("Incorrect password.");
        }

        // 4. If everything is valid, return the user object
        // We use user._id.toString() to make it JSON-compatible
        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name, // We'll get 'name' from registration
          role: user.role,
        };
      },
      // --- END OF UPDATED LOGIC ---

    }),
  ],

  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
        token.id = user.id;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.role = token.role;
      session.user.id = token.id;
      session.user.name = token.name;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  // Add a custom error page for auth errors
  theme: {
    colorScheme: "dark",
  },
  logger: {
    error(code, metadata) {
      console.error(code, metadata)
    },
  }
};

export default NextAuth(authOptions);