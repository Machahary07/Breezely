const admin = require('firebase-admin');

// Initialize the Admin SDK (since you're logged in, it will use your credentials)
admin.initializeApp({
  projectId: 'breezely-001'
});

const db = admin.firestore();

async function seedData() {
  console.log('Seeding initial production-ready data...');

  // 1. Create a sample user
  const userRef = db.collection('users').doc('sample-user-id');
  await userRef.set({
    email: 'jeumachahary07@gmail.com',
    displayName: 'Jeu Machahary',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    settings: {
      theme: 'dark'
    }
  });
  console.log('User created: sample-user-id');

  // 2. Create sample api keys for that user
  const apiKeysRef = db.collection('users').doc('sample-user-id').collection('apiKeys').doc('openai');
  await apiKeysRef.set({
    provider: 'openai',
    key: 'sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Placeholder for now
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('API keys added for user');

  // 3. Create a sample chat session
  const chatRef = db.collection('chats').doc('sample-chat-id');
  await chatRef.set({
    userId: 'sample-user-id',
    title: 'How can I automate my daily browser tasks?',
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    updatedAt: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('Chat session created: sample-chat-id');

  // 4. Add the first message to that chat
  const messageRef = chatRef.collection('messages').doc();
  await messageRef.set({
    role: 'user',
    content: 'Explain how Breezely can help me with browser automation.',
    timestamp: admin.firestore.FieldValue.serverTimestamp()
  });
  console.log('First message added to chat session');

  console.log('Seeding complete! You can check your Firebase Console now.');
}

seedData().catch(err => {
  console.error('Error seeding data:', err);
  process.exit(1);
});
