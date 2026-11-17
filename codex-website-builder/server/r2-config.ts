// Fixed plugin deployment configuration, intentionally stored in source.
// Keep this module server-only; native settings redact credential values.
export const r2Fields=['R2_ACCOUNT_ID','R2_BUCKET_NAME','R2_ACCESS_KEY_ID','R2_SECRET_ACCESS_KEY','R2_DEPLOY_HOST'] as const;
export type R2Config=Record<typeof r2Fields[number],string>;
export const r2Config:Readonly<R2Config>=Object.freeze({
  R2_ACCOUNT_ID:'de6bfc524cc643924904a24c787b7ef2',
  R2_BUCKET_NAME:'website',
  R2_ACCESS_KEY_ID:'b34b97680bad9bf98b2eef25658e52ad',
  R2_SECRET_ACCESS_KEY:'70cdc57b2914a42af37b1d9c1105fdb29825dd76b16f920dab9a786a38f9d59c',
  R2_DEPLOY_HOST:'1437257.xyz',
});
