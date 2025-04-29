import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { z } from "zod";
import { insertUserSchema } from "@shared/schema";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

export async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // Use fallback values first, will be updated with config values
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "mirxa-super-secret-session-key",
    resave: false,
    saveUninitialized: false, // Changed to false to prevent empty session creation
    store: storage.sessionStore,
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // Extended to 30 days for better persistence
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: '/',
      httpOnly: true,
    },
  };
  
  app.set('trust proxy', 1); // trust first proxy
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Register endpoint
  app.post("/api/register", async (req, res, next) => {
    try {
      // Validate the request body
      const validatedData = insertUserSchema.safeParse(req.body);
      if (!validatedData.success) {
        return res.status(400).json({
          error: "Validation failed",
          details: validatedData.error.format(),
        });
      }

      // Check if username or email already exists
      const existingUsername = await storage.getUserByUsername(
        validatedData.data.username,
      );
      if (existingUsername) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(
        validatedData.data.email,
      );
      if (existingEmail) {
        return res.status(400).json({ error: "Email already exists" });
      }

      // Hash the password
      const hashedPassword = await hashPassword(validatedData.data.password);

      // Create the user
      const user = await storage.createUser({
        ...validatedData.data,
        password: hashedPassword,
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      // Log the user in
      req.login(user, (err) => {
        if (err) return next(err);
        
        // Ensure session is saved immediately
        req.session.save((err) => {
          if (err) return next(err);
          
          // Set max age on cookie directly
          if (req.session.cookie) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          }
          
          res.status(201).json(userWithoutPassword);
        });
      });
    } catch (error) {
      next(error);
    }
  });

  // Login endpoint
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ error: "Invalid username or password" });
      }

      req.login(user, (err) => {
        if (err) return next(err);

        // Ensure session is saved immediately
        req.session.save((err) => {
          if (err) return next(err);
          
          // Remove password from response
          const { password, ...userWithoutPassword } = user;
          
          // Set max age on cookie directly
          if (req.session.cookie) {
            req.session.cookie.maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
          }
          
          res.status(200).json(userWithoutPassword);
        });
      });
    })(req, res, next);
  });

  // Logout endpoint
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      
      // Destroy the session to fully log out
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  // Current user endpoint
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = req.user;
    res.json(userWithoutPassword);
  });
}
