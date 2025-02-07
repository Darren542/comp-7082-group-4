import { Router, Request, Response } from "express";
import supabase from "../services/authService";

const router = Router();

// Sign up a user
router.post("/signup", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        res.status(400).json({ error: error.message });
    } else {
        res.json(data.user);
    }
});

// Log in
router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        res.status(400).json({ error: error.message });
    } else {
        res.json(data)
    }
});

export default router;