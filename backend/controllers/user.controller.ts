import {Request, Response} from 'express'
import {prisma} from '../lib/prisma'

export const getUserData = async (req : Request, res : Response) => {
    try {
        const users = await prisma.user.findMany();
        res.json(users);
    }
    catch (err) {
        console.error("Error encountered: ", err);
    }
} 