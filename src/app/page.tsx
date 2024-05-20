import Button from '@/components/Button';
import db from '@/modules/db';
import { faker } from '@faker-js/faker';
import { revalidatePath } from 'next/cache';
import Image from 'next/image';

type Post = {
  id: string;
  content: string;
  created_at: Date;
  updated_at: Date;
};

export default async function Home() {
  const posts = await db.post.findMany({ orderBy: { createdAt: 'desc' } });

  const generatePosts = async () => {
    'use server';

    await db.post.createMany({
      data: [
        { content: faker.lorem.sentences(3) },
        { content: faker.lorem.sentences() },
        { content: faker.lorem.sentences() },
      ],
    });

    revalidatePath('/');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-24">
      <Button onClick={generatePosts}>Generate Posts</Button>

      {posts.map((post) => (
        <div key={post.id} className="">
          {post.content}
        </div>
      ))}
    </main>
  );
}
