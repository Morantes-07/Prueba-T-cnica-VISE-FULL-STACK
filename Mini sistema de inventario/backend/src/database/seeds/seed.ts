import * as bcrypt from 'bcrypt';
import dataSource from '../data-source';
import { User } from '../../users/user.entity';

const BCRYPT_COST = 12;

async function seed() {
  const email = process.env.SEED_USER_EMAIL;
  const password = process.env.SEED_USER_PASSWORD;
  if (!email || !password) {
    throw new Error('SEED_USER_EMAIL y SEED_USER_PASSWORD son obligatorias');
  }

  await dataSource.initialize();
  try {
    const users = dataSource.getRepository(User);
    const existing = await users.findOne({ where: { email } });

    if (existing) {
      console.log(`Usuario ${email} ya existe, se omite.`);
    } else {
      const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
      await users.save(users.create({ email, passwordHash }));
      console.log(`Usuario ${email} creado.`);
    }
  } finally {
    await dataSource.destroy();
  }
}

seed().catch((error) => {
  console.error('Error en el seed:', error);
  process.exit(1);
});