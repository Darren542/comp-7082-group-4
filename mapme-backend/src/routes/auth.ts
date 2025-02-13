import { Router, Request, Response } from "express";
import supabase from "../utils/supabase/createServerClient";

const router = Router();

// Sign up a user
router.post("/signup", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signUp({ email, password });

    if (error) {
        res.status(400).json({ error: error.message });
    } else {
        res.json(data);
    }
});

// Log in
router.post("/login", async (req: Request, res: Response) => {
    const { email, password } = req.body;
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
        res.status(400).json({ error: error.message });
    } else {
        res.json(data);
    }
});

// Fetch user
router.get("/user", async (req: Request, res: Response) => {
    const { 
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        res.status(400).json({ error: "User not logged in" });
    }

    res.json(user);
});

export default router;