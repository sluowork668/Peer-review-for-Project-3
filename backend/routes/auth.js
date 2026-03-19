import { Router } from "express";
import passport from "../config/passport.js";
import { signup, logout, getMe } from "../controllers/authController.js";

const router = Router();

router.post("/signup", signup);

router.post("/login", (req, res, next) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return res.status(500).json({ error: "Login error" });
    if (!user)
      return res
        .status(401)
        .json({ error: info?.message || "Invalid credentials" });

    req.login(user, (err) => {
      if (err) return res.status(500).json({ error: "Session error" });
      res.json({ user: { username: user.username } });
    });
  })(req, res, next);
});

router.post("/logout", logout);

router.get("/me", getMe);

export default router;
