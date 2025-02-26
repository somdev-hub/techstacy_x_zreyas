// filepath: /c:/Users/ariel/OneDrive/Desktop/projects/techstacyXathlon/techstacy_x_zreyas/src/pages/api/users.ts
import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "GET") {
    const users = await prisma.user.findMany();
    res.status(200).json(users);
  } else if (req.method === "POST") {
    const {
      name,
      email,
      phone,
      college,
      sic,
      year,
      imageUrl,
      eventParticipation
    } = req.body;
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        college,
        sic,
        year,
        imageUrl,
        eventParticipation
      }
    });
    res.status(201).json(newUser);
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
