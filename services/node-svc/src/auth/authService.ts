// authService.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import  { UserStore }  from '../store/userStore';
import path from 'path';


interface User {
    id: string;
    email: string;
    pinHash: string;
    displayName: string;
    currency: string;
}

export async function login(
    email: string,
    pin: string,
    userStore : UserStore
): Promise<string> {
    console.log('--- LOGIN ATTEMPT ---');
    console.log('Email received:', JSON.stringify(email));
    console.log('Pin received:', JSON.stringify(pin));

    const user = userStore.findByEmail(email);
    console.log('User found:', user);

    if (!user) throw new Error('invalid credentials');
    console.log('Comparing pin against hash:', user.pinHash);

    const match = await bcrypt.compare(pin, user.pinHash);
    console.log('Match result:', match);

    if (!match) throw new Error('invalid credentials');

    const token = jwt.sign(
        { userId: user.id, email: user.email },
        process.env.JWT_SECRET as string,
        { expiresIn: '1h' }
    );

    return token;
}