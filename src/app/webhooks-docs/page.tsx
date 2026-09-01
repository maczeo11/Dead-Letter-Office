export default function WebhooksDocs() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="font-serif text-3xl mb-4">Webhook docs</h1>
      <pre className="bg-black border border-white/10 rounded p-4 text-xs overflow-x-auto">
        {`curl -X POST http://localhost:3001/api/webhooks/bounce \\
  -H 'X-Bounce-Signature: <hmac>' \\
  -H 'Content-Type: application/json' \\
  -d '{"email":"a@b.com","type":"hard","reason":"550 5.1.1","eventId":"evt_123"}'

# HMAC
echo -n '{"email":"a@b.com","type":"hard","reason":"550","eventId":"evt_123"}' | openssl dgst -sha256 -hmac $WEBHOOK_SECRET

# Preview suppression
curl -X POST http://localhost:3001/api/sends/preview -H 'Authorization: Bearer <token>' -d '{"leadIds":["id1","id2"]}'`}
      </pre>
      <p className="mt-4 text-xs text-zinc-500">Queue: BounceEvent PENDING → worker `FOR UPDATE SKIP LOCKED` → Bounce `eventId @unique` → Lead status + HygieneScore weighted.</p>
    </div>
  )
}
