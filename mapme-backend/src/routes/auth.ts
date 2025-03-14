import { Router, Request, Response } from "express";
import supabase from "../utils/supabase/createServerClient";

const router = Router();

// // Sign up a user
router.post("/signup", async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400).json({ error: "Email and password are required." });
        return
    }
    
    // Gonna Just Make Names from Emails for Ease ATM
    let [firstName, lastName] = email.split("@");
    lastName = lastName.split(".")[0];

    // Sign up the user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                display_name: `${firstName} ${lastName}`,
            },
        },
    });

    if (authError) {
        console.error("Error:", authError.message);
        res.status(400).json({ error: authError.message });
        return
    }

    if (!authData.user) {
        console.error("Error: User creation failed in authentication.");
        res.status(500).json({ error: "User creation failed in authentication." });
        return
    }


    const userId = authData.user.id;

    // Fetch all available addons
    const { data: addons, error: addonsError } = await supabase.from("addons").select("id");
    console.log("addons", addons);

    if (addonsError) {
        res.status(500).json({ error: "Failed to fetch addons." });
        return
    }

    if (!addons || addons.length === 0) {
        res.status(200).json({ message: "User created, but no addons found.", auth: authData });
        return
    }
    // Create entries in user_addons for each addon
    const userAddonsData = addons.map((addon) => ({
        user_id: userId,
        addon_id: addon.id,
    }));

    const { error: userAddonsError } = await supabase.from("user_addons").insert(userAddonsData);

    if (userAddonsError) {
        res.status(500).json({ error: "Failed to assign addons to user." });
        return
    }

    res.json(authData);
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