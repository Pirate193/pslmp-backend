import { Context } from "hono";
import { db } from "..";
import { folders, notes } from "../db/schema";
import { and, eq } from "drizzle-orm";
import z, { success } from "zod";


export const createfolder = async (c:Context)=>{
    try {
        const user = c.get("user");
        const body = await c.req.json();

        if(body.parentId){
          const [parent] = await db.select().from(folders).where(and(eq(folders.id,body.parentId),eq(folders.userId,user.id)))
          if (!parent) return c.json({error:"parent id does not exist "},404)
        }
        const [folder]= await db.insert(folders).values({
            userId:user.id,
            name:body.name,
            parentId:body.parentId ?? null,
        }).returning();

        return c.json(folder,201)
    } catch (error) {
        console.log("error in creating folder",error);
        return c.json({
            success:false,
            error:error,
            message:"error in creating folder "
        })
    }
}

export const updatefolder = async (c:Context)=>{
    try {
        const user = c.get("user");
        const id = c.req.param("id"); //note we dont await this 
        const body = await c.req.json();

        if(!id) return c.json({error:"id is required for updating note"},500);

        const uuidCheck = z.uuid().safeParse(id);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);

        const [existing] = await db.select().from(folders).where(and(eq(folders.id,id),eq(folders.userId,user.id)))
        if(!existing) return c.json({error:"folder not found"},404);

        if(body.parentId){
            const [parentId]= await db.select().from(folders).where(and(eq(folders.id,body.parentId),eq(folders.userId,user.id)))

            if(!parentId) return c.json({error:"parent id does not exist "},404)
        }

        if (body.parentId === id) {
          return c.json({ error: "A folder cannot be its own parent" }, 400);
        }
        const [updatedfolder] = await db.update(folders).set({
            name: body.name !== undefined ? body.name :existing.name,
            parentId:body.parentId !== undefined ? body.parentId : existing.parentId,
            updatedAt: new Date
        }).where(eq(folders.id,id)).returning();

        return c.json(updatedfolder,200)
        
    } catch (error) {
        console.log("error in updating folder",error);
        return c.json({
            success:false,
            error:error,
            message:"error in updating folder "
        })
    }
}

export const deletefolder = async (c:Context)=>{
    try {
        const user = c.get("user");
        const id = c.req.param("id");

        if(!id) return c.json({error:"id is required for deleting note"});

        const uuidCheck = z.uuid().safeParse(id);
        if (!uuidCheck.success) return c.json({ error: "Invalid ID format" }, 400);
        const [existing] = await db.select().from(folders).where(and(eq(folders.id,id),eq(folders.userId,user.id)))
        if(!existing) return c.json({error:"folder not found"},404);

        await db.delete(folders).where(eq(folders.id,id));

        return c.json({success:true},200)

    } catch (error) {
        console.log("error in deleting folder",error);
        return c.json({
            success:false,
            error:error,
            message:"error in deleting folder "
        })
    }
}

export const getusersfolders = async (c:Context)=>{
    try {
        const user = c.get("user");
        const usersfolders = await db.select().from(folders).where(eq(folders.userId,user.id));

        return c.json(usersfolders,200)
        
    } catch (error) {
        console.log("error in fetching folder",error);
        return c.json({
            success:false,
            error:error,
            message:"error in fetching folder "
        })
    }
}