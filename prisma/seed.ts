import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create AI Models
    const aiModels = [
      {
        name: 'GPT-4',
        description: 'Most capable GPT model, particularly good at tasks that require creativity and advanced reasoning'
      },
      {
        name: 'GPT-3.5 Turbo',
        description: 'Fast and efficient model for most chat and text generation tasks'
      },
      {
        name: 'Claude 2',
        description: 'Advanced AI model with strong capabilities in analysis and technical content'
      },
      {
        name: 'DALL-E 3',
        description: 'Specialized in creating and editing images from natural language descriptions'
      },
      {
        name: 'PaLM 2',
        description: 'Google\'s language model with strong multilingual capabilities'
      },
      {
        name: 'Gemini Pro',
        description: 'Google\'s advanced language model with real API integration'
      }
    ];

    console.log('Start seeding AI models...');

    for (const model of aiModels) {
      await prisma.aIModel.create({
        data: model
      });
    }

    console.log('Seeding completed successfully.');
  } catch (error) {
    console.error('Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });