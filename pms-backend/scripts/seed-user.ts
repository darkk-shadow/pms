/**
 * Run once after the DB tables are created (synchronize:true creates them on app start)
 * to insert a login user, since there's no signup screen required by the spec.
 *
 * Usage: npx ts-node scripts/seed-user.ts
 */
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../src/entities/user.entity';
import { Patient } from '../src/entities/patient.entity';
import { Bill } from '../src/entities/bill.entity';
import { Payment } from '../src/entities/payment.entity';
import 'dotenv/config';

async function seed() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USERNAME ?? 'postgres',
    password: process.env.DB_PASSWORD ?? 'postgres',
    database: process.env.DB_NAME ?? 'pms_db',
    entities: [User, Patient, Bill, Payment],
  });

  await dataSource.initialize();

  const userRepo = dataSource.getRepository(User);
  const email = 'admin@pms.com';
  const existing = await userRepo.findOne({ where: { email } });

  if (existing) {
    console.log('Seed user already exists:', email);
  } else {
    const hashed = await bcrypt.hash('Admin@123', 10);
    const user = userRepo.create({ name: 'Admin', email, password: hashed });
    await userRepo.save(user);
    console.log('Seed user created -> email: admin@pms.com  password: Admin@123');
  }

  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
