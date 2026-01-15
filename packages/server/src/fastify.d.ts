import "fastify";
import type Plebbit from "@plebbit/plebbit-js";

type PlebbitInstance = Awaited<ReturnType<typeof Plebbit>>;

declare module "fastify" {
    interface FastifyInstance {
        getPlebbitInstance: () => Promise<PlebbitInstance>;
    }
}
