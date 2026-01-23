import prisma from "../configs/prisma.js";

//add comment to task
export const addComment = async (req, res)=>{
    try {
        const { userId } = await req.auth();
        const { taskId, content } = req.body;
        //check if user is project member
        const task = await prisma.task.findUnique({
            where: { id: taskId }
        });
        if(!task){
            return res.status(404).json({ message: "Task not found" });
        }
        const project = await prisma.project.findUnique({
            where : { id: task.projectId },
            include: { members : {include : {user:true}}}
        });
        if(!project){
            return res.status(404).json({ message: "Project not found" });
        }
       if(!project.members.find((member)=>member.userId===userId)){
        return res.status(403).json({message : "Forbidden: You do not have permission to add comments to this project" });
       }
       //add comment
        const comment = await prisma.comment.create({
            data:{
                taskId,
                content,
                authorId: userId
            }
        });
        return res.status(201).json({ message: "Comment added successfully", comment });
    }catch(error){
        console.error("Error adding comment:", error);
        res.status(500).json({ message: "Internal server error"});
    }
}
//get comments for a task
export const getTaskComments = async (req, res) =>{
    try {
        const { taskId } = req.params;

        const comments = await prisma.comment.findMany({
            where : { taskId },
            include : { user : true }
        });
        return res.status(200).json({ comments });
    } 
    catch (error){
        console.error("Error fetching comments:", error);
        res.status(500).json({ message: "Internal server error"});
    }
}