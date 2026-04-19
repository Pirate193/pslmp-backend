import { Hono } from "hono";
import { Variables } from "hono/types";
import { requireauth } from "../middleware/requireauth";
import { createnote, deletenote, getfoldernotes, getnote, getusersnotes, movenote, updatenote } from "../controllers/notecontroller";
import { Appvariables } from "..";


const router = new Hono<{ Variables: Appvariables }>();

router.use('*',requireauth);

router.get('/',getusersnotes);
router.post('/',createnote);
router.get('/:id',getnote);
router.put('/:id',updatenote);
router.delete('/:id',deletenote);
router.patch('/:id/move',movenote);
router.get('/:id/getfoldernotes',getfoldernotes);

export default router;