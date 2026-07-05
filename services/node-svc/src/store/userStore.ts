
import fs from 'fs';

export interface User {
    id: string;
    email: string;
    pinHash: string;
    displayName: string;
    currency: string;
}

export class UserStore {
    private users: User[];

    constructor(seedFilePath: string) {
        const raw = fs.readFileSync(seedFilePath, 'utf-8');
        this.users = JSON.parse(raw) as User[];
    }

    findByEmail(email: string): User | undefined {
        console.log(email)
        console.log(this.users)
        return this.users.find(u => u.email === email);
    }

    findById(id: string): User | undefined {
        return this.users.find(u => u.id === id);
    }
}