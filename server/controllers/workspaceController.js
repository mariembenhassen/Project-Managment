import prisma from "../configs/prisma.js";

//Get all workspaces for user
export const getUserWorkspaces = async (req, res) => {
    try{
        const {userId} = await req.auth(); //req.auth() :It returns the current logged-in user's session/data
        const workspaces = await prisma.workspace.findMany({
        where: {
           members: {
               some: {
                  userId: userId, // "at least one member has this userId"
             },
            },
     },
     //Load a lot of related data in one query
        include: {
            owner: true ,   // The workspace owner  

            // All members of the workspace + their user profile

            members: {
                include: {
                    user: true , // brings name, email, image, etc.
                }
            },
            // All projects within the workspace + their tasks, assignees, comments, and members
            projects: {
                include: {
                    tasks: {
                        include: {
                            // Who is assigned to this task
                            assignee: true ,
                            // All comments on this task
                            comments: { 
                                        include:{
                                             user: true 
                                                } 
                                        },
                            // All members involved in this task
                            members: {
                                include: { 
                                    user: true ,
                                }
                            },
                        }
                    },
          
                },
            },
        },
    });
        res.json({workspaces});
    }
    catch (error) {
        console.log(error);
        res.status(500).json({ message:error.code ||error.message });
    }
};
// Add member to workspace 
export const addMember = async (req , res) =>{
    try{ 
        const {userId} = await req.auth();
        if (!userId) return res.status(401).json({ message: 'Unauthorized' });
        const {email ,role , workspaceId, message} = req.body;
        // check if user exists
        const memberId = await prisma.user.findUnique({
            where:{
                email:email.toLowerCase()
            },
            select:{
                id:true,
            } 
        });
        if (!memberId){
            return res.status(404).json({message:"User not found"});
        }
        // check workspace & permission
        if (!workspaceId || !role){
            return res.status(400).json({message:"workspaceId and role are required"})
        }
        //role validation
        const validRoles=["ADMIN","MEMBER"];
        if(!validRoles.includes(role) ){
            return res.status(400).json({message:"Invalid role"});
        };
        //fetch workspace
        const workspace =  await prisma.workspace.findUnique({ where : {id:workspaceId} , include:{ members:true, }});

        if(!workspace){
            return res.status(404).json({message:"Workspace not found"});
        }
        //check creator permission
        if (!workspace.members.find((member)=>member.userId === userId && member.role ==="ADMIN")){
            return res.status(401).json({message:"Only workspace admin can add members"}

            );
        }

//      if ( userId !== workspace.ownerId){ return  res.status(403).json({message:"Only workspace owner can add members"});}

        // check if user is already a member
 /*    const existingMember =  await prisma.workspaceMember.findUnique({
           where: {
             userId_workspaceId: {
              userId: memberId.id,
               workspaceId: workspaceId,
             }
            },
            select: { id: true }
        });
*/

        // check if user is already a member
        const existingMember = workspace.members.find((member) => member.userId === memberId.id);
        if(existingMember){
            return res.status(400).json({message:"User is already a member"});
        }

        // add member
        await prisma.workspaceMember.create({
            data:{
                workspaceId : workspaceId,
                userId: memberId.id,
                role: role,
                message: message,
            }
        });
        res.status(201).json({ member, message:"Member added successfully"});
    }
    catch(error){
        console.error(error);
        res.status(500).json({ message:error.code ||error.message ||'Internal server error' });
    }
}
