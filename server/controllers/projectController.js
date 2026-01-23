import prisma from "../configs/prisma.js";
// create project 
export const createProject = async (req, res) => {
    try{
    const{userId}= await req.auth();
    const{name, description , status, start_date, end_date , team_members , team_lead , progress , priority}= req.body;

    //check if user has  admin role for  the workspace 
    const workspace = await prisma.workspace.findUnique({ 
        where: {userId: userId}, 
        include: {members : {include : {user:true}}}
    });
    if(!workspace){
        return res.status(404).json({ message: "Workspace not found" });
    }
    if(!workspace.members.some((member) => member.userId === userId && member.role === 'admin')){
        return res.status(403).json({ message: "Forbidden: You do not have admin privileges for this workspace"});
    }
    //Get Team Lead id using email 
    const teamLead = await prisma.user.findUnique({
        where : { email: team_lead.toLowerCase()},
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
            team_lead_id: teamLead ? teamLead.id : null,
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

    } catch (error) {
        console.error("Error updating project:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};
// Add Member to project 
export const addMemberToProject =  async (req, res) => {
    try{

    } catch (error) {
        console.error("Error adding member to project:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};