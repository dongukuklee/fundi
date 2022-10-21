import { Role } from "@prisma/client";
import * as jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();
const APP_SECRET = process.env.APP_SECRET!;

interface EmailData {
  email: string;
  verificationCode: string;
}

export interface AuthTokenPayload {
  userId: number;
  userName: string;
  userRole: Role;
}

export function decodeAuthHeader(authHeader: string): AuthTokenPayload {
  const token = authHeader.replace("Bearer ", "");
  if (!token) {
    throw new Error("No token found");
  }
  return jwt.verify(token, APP_SECRET) as AuthTokenPayload;
}

export function send_gmail(data: EmailData) {
  let nodemailer = require("nodemailer");
  const transporter = nodemailer.createTransport({
    port: 465,
    host: "smtp.gmail.com",
    auth: {
      user: "nuart.inform@gmail.com",
      pass: process.env.PASSWORD,
    },
    secure: true,
  });

  const { email, verificationCode } = data;
  let mailData = {
    from: "info@fundi.co.kr",
    to: email,
    subject: `Fundi 인증번호입니다.`,
    text: ` Sent from: Fundi`,
    html: `
      <div style="font-family: 'Apple SD Gothic Neo', 'sans-serif' !important; width: 540px; height: 600px; border-top: 4px solid #c4ac6f; margin: 100px auto; padding: 30px 0; box-sizing: border-box;">
      <h1 style="margin: 0; padding: 0 5px; font-size: 28px; font-weight: 400;">
        <span style="font-size: 15px; margin: 0 0 10px 3px;">Fundi</span><br />
        <span style="color: #c4ac6f;">인증번호</span> 안내입니다.
      </h1>
      <p style="font-size: 16px; line-height: 26px; margin-top: 50px; padding: 0 5px;">
        안녕하세요.<br />
        인증번호가 생성되었습니다.<br />
      </p>
    
      <p style="font-size: 16px; margin: 40px 5px 20px; line-height: 28px;">
        인증번호 : <br/>
        <span style="font-size: 24px;">${verificationCode}</span>
      </p>
    </div>`,
  };

  transporter.sendMail(mailData, (err: any, info: any) => {
    if (err) {
      return false;
    } else {
      return true;
    }
  });
}
