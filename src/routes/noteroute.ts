import { Hono } from "hono";
import { Variables } from "hono/types";
import { requireauth } from "../middleware/requireauth";
import { createnote, deletenote, getnote, getusersnotes, movenote, updatenote } from "../controllers/notecontroller";


const router = new Hono<{ Variables: Variables }>();

router.use('*',requireauth);

router.get('/',getusersnotes);
router.post('/',createnote);
router.get('/:id',getnote);
router.put('/:id',updatenote);
router.delete('/:id',deletenote);
router.patch('/:id/move',movenote)