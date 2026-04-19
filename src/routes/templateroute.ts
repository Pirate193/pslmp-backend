import { Hono } from "hono";
import { Variables } from "hono/types";
import { requireauth } from "../middleware/requireauth";
import { applytemplate, createtemplate, createtemplatefromnote, deletetemplate, getCommunitytemplates, getmytemplates, gettemplate, updatetemplate } from "../controllers/templatecontroller";


const router = new Hono<{ Variables: Variables }>();

router.use("*",requireauth);

router.get("/my",getmytemplates);
router.get("/community",getCommunitytemplates);
router.post("/",createtemplate);
router.post("/from-note/:noteid",createtemplatefromnote);
router.put("/:id",updatetemplate);
router.delete("/:id",deletetemplate);
router.post("/:id/apply",applytemplate);
router.get("/:id",gettemplate);

export default router;