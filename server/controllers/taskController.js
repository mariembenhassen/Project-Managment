import prisma from "../configs/prisma.js";
import { inngest } from "../inngest/index.js";

//create task 
export const createTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const{ projectId, title, description, status,type, priority,  assigneeId, due_date }= req.body;

    const origin = req.get('origin')

    //check if user has admin role for the project 
    const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: { members : {include : {user:true}}}
    });
    if(!project){
        return res.status(404).json({ message: "Project not found" });
    }else if (project.team_lead !== userId){
       return res.status(403).json({ message: "Forbidden: You do not have permission to create task in this project"});
    }
    // check if assigneeId is a memeber in the project
 if (assigneeId && !project.members.find(member => member.userId === assigneeId)) {
    return res.status(400).json({ message: "Assignee is not a member of the project" });
}

const task = await prisma.task.create({
  data: {
    title,
    description,
    status,
    type,
    priority,
    due_date: due_date ? new Date(due_date) : null,

    project: {
      connect: {
        id: projectId,
      },
    },

    assignee: assigneeId
      ? {
          connect: {
            id: assigneeId,
          },
        }
      : undefined, // in case no assignee
  },
});


    //add assignnee details in task
    const taskWithAssignee = await prisma.task.findUnique({
        where: { id: task.id },
        include: { assignee: true },
    });

    await inngest.send({ 
        name: "app/task.assigned",
        data: { 
            taskId: task.id,
             origin
             }
    });
    return res.status(201).json({ message: "Task created successfully", task: taskWithAssignee} );
    }catch(error){
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};

//update task 
export const updateTask = async (req, res) => {
  try {
    const { userId } = await req.auth();
    const { taskId } = req.params;

    const {
      title,
      description,
      status,
      type,
      priority,
      assigneeId,
      due_date
    } = req.body;

    const task = await prisma.task.findUnique({
      where: { id: taskId }
    });

    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    const project = await prisma.project.findUnique({
      where: { id: task.projectId },
      include: { members: { include: { user: true } } }
    });

    if (!project) {
      return res.status(404).json({ message: "Project not found" });
    }

    if (project.team_lead !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    // Build update object safely
    const data = {
      title,
      description,
      status,
      type,
      priority,
      due_date: due_date ? new Date(due_date) : undefined,
    };

    // Handle assignee relation properly
    if (assigneeId) {
      data.assignee = {
        connect: { id: assigneeId }
      };
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskId },
      data
    });

    return res.status(200).json({
      message: "Task updated successfully",
      task: updatedTask
    });

  } catch (error) {
    console.error("Error updating task:", error);
    res.status(400).json({ message: error.message });
  }
};

//Delete task
export const deleteTask = async (req, res) => {
    try {
        const { userId } = await req.auth();
        const{ tasksIds } = req.body;
        const tasks = await prisma.task.findMany({
            where: { id: {in : tasksIds} }
        });
        if(tasks.length ===0){
            return res.status(404).json({ message: "Task not found" });
        }

           //check if user has admin role for the project 
        const project = await prisma.project.findUnique({
         where: { id: tasks[0].projectId },
         include: { members : {include : {user:true}}}
        });

        if(!project){
             return res.status(404).json({ message: "Project not found" });
        }
        else if (project.team_lead !== userId){
              return res.status(403).json({ message: "Forbidden: You do not have permission to create task in this project"});
        }

       await prisma.task.deleteMany({
        where: { id: { in: tasksIds } }
        });
        
        return res.status(200).json({ message: "Task deleted successfully"} );
    }
    catch(error){
        console.error("Error creating task:", error);
        res.status(500).json({ message: "Internal server error"});
    }
};
