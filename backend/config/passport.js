import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcrypt";
import { getDB } from "../db.js";

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const db = getDB();
      const user = await db
        .collection("users")
        .findOne({ username: username.trim() });

      if (!user) {
        return done(null, false, { message: "Incorrect username." });
      }

      const match = await bcrypt.compare(password, user.password);
      if (!match) {
        return done(null, false, { message: "Incorrect password." });
      }

      return done(null, user);
    } catch (err) {
      return done(err);
    }
  })
);

passport.serializeUser((user, done) => {
  done(null, user.username);
});

passport.deserializeUser(async (username, done) => {
  try {
    const db = getDB();
    const user = await db.collection("users").findOne({ username });
    done(null, user);
  } catch (err) {
    done(err);
  }
});

export default passport;
