import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding doctors into new database...');

  const doctorsData = [
    {
      email: 'malika@navbat.uz',
      firstName: 'Malika',
      lastName: 'Yusupova',
      role: 'DOCTOR' as const,
      profile: {
        specialty: 'Cardiologist',
        experienceYrs: 12,
        rating: 4.8,
        reviewCount: 248,
        priceAmount: 150000,
        currency: "so'm",
        availability: 'Available Today',
        bg: '#FEF3C7',
        color: '#92400E',
      },
    },
    {
      email: 'jasur@navbat.uz',
      firstName: 'Jasur',
      lastName: 'Toshmatov',
      role: 'DOCTOR' as const,
      profile: {
        specialty: 'Neurologist',
        experienceYrs: 8,
        rating: 4.9,
        reviewCount: 156,
        priceAmount: 180000,
        currency: "so'm",
        availability: 'Next Ref: Tomorrow',
        bg: '#FFEDD5',
        color: '#C2410C',
      },
    },
    {
      email: 'sarvinoz@navbat.uz',
      firstName: 'Sarvinoz',
      lastName: 'Rahmonova',
      role: 'DOCTOR' as const,
      profile: {
        specialty: 'Pediatrician',
        experienceYrs: 5,
        rating: 4.7,
        reviewCount: 312,
        priceAmount: 120000,
        currency: "so'm",
        availability: 'Available Today',
        bg: '#F3E8FF',
        color: '#6B21A8',
      },
    },
    {
      email: 'davron@navbat.uz',
      firstName: 'Davron',
      lastName: 'Umarov',
      role: 'DOCTOR' as const,
      profile: {
        specialty: 'Dermatologist',
        experienceYrs: 15,
        rating: 4.5,
        reviewCount: 189,
        priceAmount: 200000,
        currency: "so'm",
        availability: 'Available Tomorrow',
        bg: '#E0F2FE',
        color: '#0369A1',
      },
    },
  ];

  for (const doc of doctorsData) {
    const existing = await prisma.user.findUnique({ where: { email: doc.email } });
    if (!existing) {
      await prisma.user.create({
        data: {
          email: doc.email,
          firstName: doc.firstName,
          lastName: doc.lastName,
          role: doc.role,
          doctorProfile: {
            create: doc.profile,
          },
        },
      });
      console.log(`Created doctor: Dr. ${doc.firstName} ${doc.lastName}`);
    } else {
      console.log(`Doctor Dr. ${doc.firstName} ${doc.lastName} already exists. Skipping.`);
    }
  }

  console.log('Seeding complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
