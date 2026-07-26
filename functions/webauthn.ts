// Catalyst Serverless Function — Real WebAuthn (FIDO2) biometric ceremony.
// Uses the device's real platform authenticator (Touch ID / Face ID / Windows
// Hello) via @simplewebauthn. No simulated scanner — the OS performs the check.

import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse
} from "@simplewebauthn/server";

interface StoredCredential {
  credentialID: string;        // base64url
  credentialPublicKey: Uint8Array;
  counter: number;
}

const CREDENTIALS = new Map<string, StoredCredential[]>(); // badge → credentials
const CHALLENGES = new Map<string, string>();               // badge → outstanding challenge
const RP_NAME = "SAHASRA KSP Intelligence";

export function hasCredential(badge: string): boolean {
  return (CREDENTIALS.get(badge)?.length || 0) > 0;
}

export async function registrationOptions(badge: string, userName: string, rpID: string) {
  const existing = CREDENTIALS.get(badge) || [];
  const opts = await generateRegistrationOptions({
    rpName: RP_NAME,
    rpID,
    userID: new TextEncoder().encode(badge), // v10 requires bytes
    userName,
    attestationType: "none",
    excludeCredentials: existing.map((c) => ({ id: c.credentialID, type: "public-key" as const })),
    authenticatorSelection: {
      residentKey: "preferred",
      userVerification: "preferred",
      authenticatorAttachment: "platform" // fingerprint / Face ID / Windows Hello
    }
  });
  CHALLENGES.set(badge, opts.challenge);
  return opts;
}

export async function verifyRegistration(badge: string, response: any, origin: string | string[], rpID: string) {
  const expectedChallenge = CHALLENGES.get(badge);
  if (!expectedChallenge) return { verified: false, error: "No challenge" };
  const verification = await verifyRegistrationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin as any,
    expectedRPID: rpID,
    requireUserVerification: false
  });
  if (verification.verified && verification.registrationInfo) {
    const { credentialID, credentialPublicKey, counter } = verification.registrationInfo as any;
    const list = CREDENTIALS.get(badge) || [];
    list.push({ credentialID, credentialPublicKey, counter });
    CREDENTIALS.set(badge, list);
  }
  CHALLENGES.delete(badge);
  return { verified: verification.verified };
}

export async function authenticationOptions(badge: string, rpID: string) {
  const creds = CREDENTIALS.get(badge) || [];
  const opts = await generateAuthenticationOptions({
    rpID,
    allowCredentials: creds.map((c) => ({ id: c.credentialID, type: "public-key" as const })),
    userVerification: "preferred"
  });
  CHALLENGES.set(badge, opts.challenge);
  return opts;
}

export async function verifyAuthentication(badge: string, response: any, origin: string | string[], rpID: string) {
  const expectedChallenge = CHALLENGES.get(badge);
  if (!expectedChallenge) return { verified: false, error: "No challenge" };
  const creds = CREDENTIALS.get(badge) || [];
  const cred = creds.find((c) => c.credentialID === response.id) || creds[0];
  if (!cred) return { verified: false, error: "No registered credential" };
  const verification = await verifyAuthenticationResponse({
    response,
    expectedChallenge,
    expectedOrigin: origin as any,
    expectedRPID: rpID,
    authenticator: {
      credentialID: cred.credentialID,
      credentialPublicKey: cred.credentialPublicKey,
      counter: cred.counter
    } as any,
    requireUserVerification: false
  });
  if (verification.verified) {
    cred.counter = verification.authenticationInfo.newCounter;
  }
  CHALLENGES.delete(badge);
  return { verified: verification.verified };
}
