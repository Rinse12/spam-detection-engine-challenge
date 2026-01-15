import * as cborg from "cborg";
import { fromString as uint8ArrayFromString } from "uint8arrays/from-string";
import { verifyBufferEd25519 } from "../plebbit-js-signer.js";
import type { z } from "zod";
import { JsonSignatureSchema } from "../plebbit-js-internals.js";

type RequestSignature = z.infer<typeof JsonSignatureSchema>;

const CBORG_ENCODE_OPTIONS = {
  typeEncoders: {
    undefined: () => {
      throw new Error(
        "Signed payload cannot include undefined values (cborg)"
      );
    },
  },
};

const buildSignedPayload = (
  payload: Record<string, unknown>,
  signedPropertyNames: string[]
) => {
  const propsToSign: Record<string, unknown> = {};
  for (const propertyName of signedPropertyNames) {
    propsToSign[propertyName] = payload[propertyName];
  }
  return propsToSign;
};

const requestSignatureError = (message: string) => {
  const error = new Error(message);
  (error as { statusCode?: number }).statusCode = 401;
  return error;
};

export const verifySignedRequest = async (
  payload: Record<string, unknown>,
  signature: RequestSignature
): Promise<void> => {
  const payloadKeys = Object.keys(payload);
  const signedKeys = signature.signedPropertyNames ?? [];

  if (!signedKeys.length) {
    throw requestSignatureError("Request signature has no signed fields");
  }

  if (payloadKeys.length !== signedKeys.length) {
    throw requestSignatureError("Request signature does not cover all fields");
  }

  const signedKeySet = new Set(signedKeys);
  const hasAllSignedKeys = payloadKeys.every((key) => signedKeySet.has(key));
  if (!hasAllSignedKeys) {
    throw requestSignatureError("Request signature fields do not match payload");
  }

  const propsToSign = buildSignedPayload(payload, signedKeys);
  let encoded: Uint8Array;
  try {
    encoded = cborg.encode(propsToSign, CBORG_ENCODE_OPTIONS);
  } catch (error) {
    throw requestSignatureError("Request signature payload is invalid");
  }

  let signatureBuffer: Uint8Array;
  try {
    signatureBuffer = uint8ArrayFromString(signature.signature, "base64");
  } catch (error) {
    throw requestSignatureError("Request signature is invalid");
  }

  let isValid = false;
  try {
    isValid = await verifyBufferEd25519(
      encoded,
      signatureBuffer,
      signature.publicKey
    );
  } catch (error) {
    throw requestSignatureError("Request signature is invalid");
  }

  if (!isValid) {
    throw requestSignatureError("Request signature is invalid");
  }
};
