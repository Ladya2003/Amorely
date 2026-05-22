import webpush from 'web-push';

const keys = webpush.generateVAPIDKeys();

console.log('Добавьте в server/.env:\n');
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log('VAPID_SUBJECT=mailto:your-email@example.com');
