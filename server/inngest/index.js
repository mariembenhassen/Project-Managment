import { Inngest } from "inngest";
import  prisma  from "../configs/prisma.js";

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
        await prisma.user.delete({
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
export { inngest };
export const functions = [syncUserCreation, syncUserDeletion, syncUserUpdation];