import { Inngest } from "inngest";
import  prisma  from "../configs/prisma.js";
import sendEmail from "../configs/nodemailer.js";

// Create a client to send and receive events
const inngest = new Inngest({ id: "Project-managment" });

//function to save user data in the database
const syncUserCreation = inngest.createFunction(
    { id : "sync-user-from-clerk" },
    {event : "clerk/user.created"},
    async ({ event }) => {
        const{ data } =event; 
        await prisma.user.create({
            data: {
                id: data.id,
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data?.image_url,
            }
        });
    }
)

//function to delete user data in the database
const syncUserDeletion = inngest.createFunction(
    { id : "delete-user-from-clerk" },
    {event : "clerk/user.deleted"},
    async ({ event }) => {
        const{ data } =event; 
        await prisma.user.deleteMany({
            where: {
                id: data.id,
            }
        });
    }
)
//function to update userdata in the database
const syncUserUpdation = inngest.createFunction(
    { id : "update-user-from-clerk" },
    {event : "clerk/user.updated"},
    async ({ event }) => {
        const{ data } =event; 
        await prisma.user.update({
            where: {
                id: data.id,
            },
            data: {
                email: data?.email_addresses[0]?.email_address,
                name: data?.first_name + " " + data?.last_name,
                image: data?.image_url,
            }
        });
    }
)

//Inngest functions to save workspace data to a database

const syncWorkspaceCreation = inngest.createFunction(
    { id : "sync-workspace-from-clerk" },
    {event : "clerk/organization.created"},
    async ({ event }) => {
        const{ data } =event;
        await prisma.workspace.create({
            data : {
                id : data.id,
                name : data.name,
                slug : data.slug,
                ownerId : data.created_by,
                image_url: data.image_url,
            }
        });
        //Add creator as Admin member of the workspace
        await prisma.workspaceMember.create({
            data : {
              userId : data.created_by,
              workspaceId: data.id,
              role : "ADMIN",
                  }});
    }
);

//Inngest functions to update workspace data to a database
const syncWorkspaceUpdation = inngest.createFunction({
    id : "update-workspace-from-clerk" },
    {event : "clerk/organization.updated"},
    async ({ event }) => {
            const{data} = event;
            await prisma.workspace.update({
                where :{ id : data.id},
                data:{
                    name : data.name,
                    slug : data.slug,
                    image_url: data.image_url,

                }
            });

   
    }
)

//Inngest functions to update workspace data to a database
const syncWorkspaceDeletion = inngest.createFunction({
    id : "delete-workspace-from-clerk" },
    {event : "clerk/organization.deleted"},
    async ({ event }) => {
        const {data}=event;
        await prisma.workspace.deleteMany({
            where:{ 
                id : data.id
            }})
 
    }
);

//Inngest functions to update workspace memebr data to a database
const syncWorkspaceMemberCreation = inngest.createFunction({
    id : "sync-workspace-member-from-clerk" },
    {event : "clerk/organizationInvitation.accepted"},
    async ({ event }) => {
        const {data}=event;
        await prisma.workspaceMember.create({
            data:{
                userId : data.user_id,
                workspaceId : data.organization_id,
                role : String(data.role_name).toUpperCase(),
            }
        })
    }
);
//Inngest function to send email on task creation 
const sendTaskAssignmentEmail = inngest.createFunction(
    { id : "send-task-assignment-mail"},
    { event : "app/task.assigned"},
    async ({ event , step}) => {
        const{ taskId, origin}= event.data;
        const task = await prisma.task.findUnique({
            where: { id: taskId },
            include: { assignee : true , project : true }
        });
await sendEmail({
  to: task.assignee.email,
  subject: `New task assigned in ${task.project.name}`,
  body: `
    Hi ${task.assignee.name},

    You’ve been assigned a new task in the project "${task.project.name}".

    Task: ${task.title}
    Due date: ${new Date(task.due_date).toLocaleDateString()}

    You can view the task details and start working on it here:
    <a href="${origin}">View task</a>

    This task is also available in your dashboard.

    —  
    The Project Management App Team
  `
});
if( new Date(task.due_date) !== new Date().toDateString()){
    await step.sleepUntil( 'wait-for-due-date', new Date(task.due_date) );
    await step.run('check-if-task-completed', async()=>{
        const task = await prisma.task.findUnique({
            where: { id: taskId},
            include: {assignee: true , project : true}});
            if(!task) return;
            if(task.status !== 'DONE'){
                //send reminder email
         await step.run('send-task-reminder-email', async () => {
  await sendEmail({
    to: task.assignee.email,
    subject: `Reminder: "${task.title}" is due today`,
    body: `
      Hi ${task.assignee.name},

      This is a reminder that the following task is due today:

      Task: ${task.title}
      Project: ${task.project.name}

      Please make sure to review and complete it as soon as possible.

      You can view the task details here:
      <a href="${origin}">View task</a>

      —  
      The Project Management App Team
    `
  });

});

            }
        
    })
   
    }
});
    
export { inngest };
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation, syncWorkspaceCreation, syncWorkspaceUpdation, syncWorkspaceDeletion, syncWorkspaceMemberCreation , sendTaskAssignmentEmail];