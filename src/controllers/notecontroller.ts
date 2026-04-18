import  { Context } from "hono";
import { db } from "..";
import { folders, notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import z from "zod";

export const getusersnotes = async (c:Context)=>{
    try {
        const user = c.get("user")
        const Notes = await db.select().from(notes).where(eq(notes.userId,user.id))

        //note am ommiting content because we dont want to send large content just for listing the note 
        return c.json(Notes.map(note=>({
            id:note.id,
            title:note.title,
            folderId:note.folderId,
            createdAt:note.createdAt,
            updatedAt:note.updatedAt
        })))
    } catch (error) {
        console.log("error in getting users notes",error)
        return c.json({
            success:false,
            error:error,
            message:"error in getting users notes "
        })
    } 
}

export const createnote = async (c:Context)=>{
    try {
        const user = c.get("user")
        const body = await c.req.json()

        if(body.folderId){
             const folder = await db.select().from(folders).where(and(eq(folders.id,body.folderId),eq(folders.userId,user.id)));
             //note here we are checking for length because the folder returns an array and if we check !folder it will just pass bringing errors 
             if(folder.length === 0) return c.json({error:"folder not found"},404)
        }
       
        const note = await db.insert(notes).values({
            id:body.id,
            userId:user.id,
            title:body.title.trim()|| "untitled",
            content:body.content ?? null,
            folderId:body.folderId ?? null,
        }).returning();

        return c.json(note[0],201)
        
    } catch (error) {
        console.log("error in creating a note ",error)
        return c.json({
            success:false,
            error:error,
            message:"error in creating a note "
        })
    }
}

export const updatenote = async (c:Context)=>{
    try {
        const user = c.get("user")
        const id = c.req.param("id");
        const body = await c.req.json();
        if (!id) return c.json({error:"note id is required "});
        
        const uuidCheck = z.uuid().safeParse(id);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);

        const existing = await db.select().from(notes).where(and(eq(notes.id,id),eq(notes.userId,user.id)));
        if(existing.length === 0) return c.json({error:"note not found "},401);

        if(body.folderId){
             const folder = await db.select().from(folders).where(and(eq(folders.id,body.folderId),eq(folders.userId,user.id)));
             if(folder.length === 0) return c.json({error:"folder not found"},404)
        }
        const note = await db.update(notes).set({
            title:body.title,
            content:body.content,
            folderId:body.folderId,
        }).where(eq(notes.id,id)).returning()

     return c.json(note[0],201)
        
    } catch (error) {
        console.log("error in updating note ",error)
        return c.json({
            success:false,
            error:error,
            message:"error in updating note "
        })
        
    }
}


export const getnote = async (c:Context)=>{
    try {
        const user = c.get("user");
        const id = c.req.param("id");
        if (!id) return c.json({error:"note id is required "});
        
        const uuidCheck = z.uuid().safeParse(id);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);
        const note = await db.select().from(notes).where(and(eq(notes.id,id),eq(notes.userId,user.id)));

        return c.json(note[0],200)
    } catch (error) {
        console.log("error in getting note ",error)
        return c.json({
            success:false,
            error:error,
            message:"error in getting note "
        })
    }
}
export const deletenote = async (c:Context)=>{
    try {
        const user = c.get("user");
        const id = c.req.param("id");
        if (!id) return c.json({error:"note id is required "});
        
        const uuidCheck = z.uuid().safeParse(id);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);

        const existing = await db.select().from(notes).where(and(eq(notes.id,id),eq(notes.userId,user.id)));
        if(existing.length === 0) return c.json({error:"note not found "},401);
         
        await db.delete(notes).where(and(eq(notes.id,id),eq(notes.userId,user.id)))

        return c.json({success:true},200);
    } catch (error) {
        console.log("error in deleting note ",error)
         
        return c.json({
            success:false,
            error:error,
            message:"error in deleting note "
        })
    }
}

export const movenote = async (c:Context)=>{
    try {
       const user = c.get("user"); 
        const id = c.req.param("id"); 
        if (!id) return c.json({error:"note id is required "});
        
        const uuidCheck = z.uuid().safeParse(id);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);
        
        const body = await c.req.json();
        const parsedData = z.object({ folderId: z.string().uuid().nullable() }).parse(body);

        const existing = await db.select().from(notes).where(
            and(eq(notes.id, id), eq(notes.userId, user.id))
        );
        if (existing.length === 0) return c.json({ error: "note not found" }, 404);

        if (parsedData.folderId) {
            const folder = await db.select().from(folders).where(
                and(eq(folders.id, parsedData.folderId), eq(folders.userId, user.id))
            );
            if (folder.length === 0) return c.json({ error: "folder not found" }, 404);
        }
        
        const updatedNote = await db.update(notes).set({
            folderId: parsedData.folderId ?? null,
            updatedAt: new Date() 
        }).where(eq(notes.id, id)).returning(); 

        return c.json(updatedNote[0], 200);
        
    } catch (error) {
        console.log("error in moving note ",error);
        return c.json({
            success:false,
            error:error,
            message:"error in moving note ",
        },500)
    }
}

export const getfoldernotes = async (c:Context)=>{
    try {
        const user = c.get("user");
        const folderId = c.req.param("id");
        if (!folderId) return c.json({error:"folder id is required "});
        
        const uuidCheck = z.uuid().safeParse(folderId);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);
        const foldernotes = await db.select().from(notes).where(and(eq(notes.folderId,folderId),eq(notes.userId,user.id)));
        return c.json(foldernotes.map((n)=>({
            id:n.id,
            title:n.title,
            updatedAt:n.updatedAt,
            createdAt:n.createdAt
        })))
    } catch (error) {
        console.log("error in getting foldernotes",error);
        return c.json({
            success:false,
            error:error,
            message:"error in getting foldernotes"
        })
    }
}

