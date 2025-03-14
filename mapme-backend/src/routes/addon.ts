import { Router, Request, Response } from "express";
import supabase from "../utils/supabase/createServerClient";

const router = Router();

interface ServerAddon {
    addon_id: string;
    active: boolean;
    installed: boolean;
    addons: {
        name: string;
        desc: string;
        api_location: string;
    };
}

function convertServerAddonToFrontendAddon(addon: ServerAddon) {
    return {
        id: addon.addon_id,
        name: addon.addons.name,
        desc: addon.addons.desc,
        active: addon.active,
        installed: addon.installed,
        apiLocation: addon.addons.api_location,
    };
}

router.get("/", async (req, res) => {
    console.log("Getting Addons");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        res.status(400).json({ error: "User not logged in" });
        return;
    }

    // Get the Addons from the database
    const { data: addons, error: addonsError } = await supabase.from("user_addons")
        .select("*, addons (name, desc, api_location)")
        .eq("user_id", user.id);

    const frontendAddons = addons?.map(convertServerAddonToFrontendAddon);
    res.json(frontendAddons);
});

router.post("/", async (req, res) => {
    const { id, active, installed } = req.body;
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        res.status(400).json({ error: "User not logged in" });
        return;
    }

    // Update the database
    const { data, error } = await supabase.from("user_addons")
        .update({ active, installed })
        .eq("user_id", user.id)
        .eq("addon_id", id)
        .select("*, addons (name, desc, api_location)");

    if (error) {
        res.status(500).json({ error: "Failed to update addon." });
        return;
    }

    if (!data) {
        res.status(400).json({ error: "No addon found." });
        return;
    }

    const frontendAddons = data?.map(convertServerAddonToFrontendAddon);
    res.json(frontendAddons);
});

export default router;