import prisma from "../configs/prisma.js";
// create project 
export const createProject = async (req, res) => {
    try{
    const{userId}= await req.auth();
    const{ workspaceId, name, description , status, start_date, end_date , team_members , team_lead , progress , priority}= req.body;

    //check if user has  admin role for  the workspace 
    const workspace = await prisma.workspace.findUnique({ 
        where: {id: workspaceId}, 
        include: {members : {include : {user:true}}}
    });
    if(!workspace){
        return res.status(404).json({ message: "Workspace not found" });
    }
const isAdmin = workspace.ownerId === userId || workspace.members.some(
    (member) => member.userId === userId && member.role === 'ADMIN'
);

if (!isAdmin) {
    return res.status(403).json({ message: "Forbidden: You do not have admin privileges for this workspace"});
}

    //Get Team Lead id using email 
    const teamLead = await prisma.user.findUnique({
        where : { email: team_lead},
        select: { id: true }});

    const project = await prisma.project.create({
        data: {
            name,
            description,
            status,
            start_date: start_date ? new Date(start_date) : null,
            end_date: end_date ? new Date(end_date) : null,
            progress,
            priority,
             team_lead: teamLead ? teamLead.id : null,
            workspaceId: workspace.id,
        },
    });
    // Add members to projectMember if they are in the workspace 
    if(team_members?.length > 0){
        const membersToAdd = [];
        workspace.members.forEach((member) => {
            if(team_members.includes(member.user.email)) {
                membersToAdd.push(member.user.id);
            }
        });
        await prisma.projectMember.createMany({
            data: membersToAdd.map( memberId => ({
                projectId: project.id,
                userId: memberId,

            }))
        });
    }
    //restore project data with members also.
    const projectWithMembers = await prisma.project.findUnique({
        where: { id: project.id },
        include: {
             members: { include: { user: true } } ,
             tasks: { include: { assignee: true , comments: { include: { user: true }} } },
             owner: true,
            },
    });
    res.status(201).json({ message: "Project created successfully", project: projectWithMembers });


    } catch (error) {
        console.error("Error creating project:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};

// update project 
export const updateProject = async (req, res) => {
    try{
    const{userId}= await req.auth();
    const{id, workspaceId, name, description, status, start_date, end_date, progress, priority}= req.body;
    //check if user has  admin role for  the workspace
        //check if user has  admin role for  the workspace 
    const workspace = await prisma.workspace.findUnique({ 
        where: {userId: userId}, 
        include: {members : {include : {user:true}}}
    });
    if(!workspace){
        return res.status(404).json({ message: "Workspace not found" });
    }
    if(!workspace.members.some((member) => member.userId === userId && member.role === 'ADMIN')){
        const project = await prisma.project.findUnique({ 
            where: { id}
        });
        if(!project){
            return res.status(404).json({ message: "Project not found" });
        }else if(project.team_lead !== userId){
            return res.status(403).json({ message: "Forbidden: You do not have permission to update this workspace"});
        }
        }
        const project = await prisma.project.update({
            where: { id },
            data: {
                name,
                description,
                status,
                start_date: start_date ? new Date(start_date) : null,
                end_date: end_date ? new Date(end_date) : null,
                progress,
                priority,
            },
        });
        res.status(200).json({ message: "Project updated successfully", project } );
    }
     catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};

// Add Member to project 
export const addMember=  async (req, res) => {
    try{
    const{userId}= await req.auth();
    const{ projectId }= req.params;
    const{email}= req.body;
    // check if user is project lead or admin of workspace 
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members: { include: { user: true } } },
    });
    if(!project){
        return res.status(404).json({ message: "Project not found" });
    }
    const isAdmin = project.members.some((member) => member.user.id === userId && member.role === 'admin');

    if(project.team_lead_id !== userId && !isAdmin){
        return res.status(403).json({ message: "Forbidden: You do not have permission to add members to this project"});
    }
    // check if user exists
    const existingMember  = project.members.find((member) => member.user.email.toLowerCase() === email.toLowerCase());
    if(existingMember){
        return res.status(400).json({ message: "User is already a member of the project"});
    }
    const user = await prisma.user.findUnique({
        where: { email: email.toLowerCase() },
     })
     if(!user){
        return res.status(404).json({ message: "User not found" });
    }
    // add member to project
    const member = await prisma.projectMember.create({
        data: {
            projectId,
            userId: user.id,
        }
    });
    res.status(200).json({ message: "Member added to project successfully", member } );
    }
     catch (error) {
        console.error("Error adding member to project:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};