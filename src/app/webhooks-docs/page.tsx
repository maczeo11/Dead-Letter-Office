export default function WebhooksDocs() {
  return (
    <div className="max-w-2xl mx-auto px-6 py-8">
      <h1 className="font-serif text-3xl mb-4">Webhook docs</h1>
      <pre className="bg-black border border-white/10 rounded p-4 text-xs overflow-x-auto">
        {`# Sign the exact bytes you send — the server verifies the raw body,
# not a re-serialization of it.
BODY='{"userId":"<uuid>","email":"a@b.com","type":"hard","reason":"550 5.1.1","eventId":"evt_123"}'
SIG=$(printf '%s' "$BODY" | openssl dgst -sha256 -hmac "$WEBHOOK_SECRET" -r | cut -d' ' -f1)

curl -X POST http://localhost:3001/api/webhooks/bounce \\
  -H "X-Bounce-Signature: $SIG" \\
  -H 'Content-Type: application/json' \\
  -d "$BODY"
# → 202 {"ok":true,"queued":true}   (replay the same eventId — score is unchanged)

# Preview suppression
curl -X POST http://localhost:3001/api/sends/preview \\
  -H 'Authorization: Bearer <token>' \\
  -H 'Content-Type: application/json' \\
  -d '{"leadIds":["id1","id2"]}'`}
      </pre>
      <p className="mt-4 text-xs text-zinc-500">
        Queue: <code>BounceEvent PENDING</code> → worker claims with <code>FOR UPDATE SKIP LOCKED</code> (PROCESSING,
        requeued if the worker dies) → <code>Bounce.eventId @unique</code> inside the same transaction as the Lead status
        and HygieneScore updates, so a redelivery either applies once or not at all.
      </p>
    </div>
  )
}
