import { Hono } from "hono";
import { Variables } from "hono/types";
import { requireauth } from "../middleware/requireauth";
import { createfolder, deletefolder, getusersfolders, updatefolder } from "../controllers/foldercontroller";


const router = new Hono<{ Variables: Variables }>();

router.use('*',requireauth);

router.get("/",getusersfolders);
router.post("/",createfolder);
router.put('/:id',updatefolder);
router.delete('/:id',deletefolder);

export default router