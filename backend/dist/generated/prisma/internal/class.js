import * as runtime from "@prisma/client/runtime/client";
const config = {
    "previewFeatures": [],
    "clientVersion": "7.10.0",
    "engineVersion": "0edf323efd1d98336f3f0a68684b56f689b900d3",
    "activeProvider": "mysql",
    "inlineSchema": "// This is your Prisma schema file,\n// learn more about it in the docs: https://pris.ly/d/prisma-schema\n\n// Get a free hosted Postgres database in seconds: `npx create-db`\n\ngenerator client {\n  provider = \"prisma-client\"\n  output   = \"../src/generated/prisma\"\n}\n\ndatasource db {\n  provider = \"mysql\"\n}\n\nmodel User {\n  id        Int      @id @default(autoincrement())\n  email     String   @unique\n  name      String?\n  createdAt DateTime @default(now())\n  updatedAt DateTime @updatedAt\n}\n",
    "runtimeDataModel": {
        "models": {},
        "enums": {},
        "types": {}
    },
    "parameterizationSchema": {
        "strings": [],
        "graph": ""
    }
};
config.runtimeDataModel = JSON.parse("{\"models\":{\"User\":{\"fields\":[{\"name\":\"id\",\"kind\":\"scalar\",\"type\":\"Int\"},{\"name\":\"email\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"name\",\"kind\":\"scalar\",\"type\":\"String\"},{\"name\":\"createdAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"},{\"name\":\"updatedAt\",\"kind\":\"scalar\",\"type\":\"DateTime\"}],\"dbName\":null,\"schema\":null}},\"enums\":{},\"types\":{}}");
config.parameterizationSchema = {
    strings: JSON.parse("[\"where\",\"User.findUnique\",\"User.findUniqueOrThrow\",\"orderBy\",\"cursor\",\"User.findFirst\",\"User.findFirstOrThrow\",\"User.findMany\",\"data\",\"User.createOne\",\"User.createMany\",\"User.updateOne\",\"User.updateMany\",\"create\",\"update\",\"User.upsertOne\",\"User.deleteOne\",\"User.deleteMany\",\"having\",\"_count\",\"_avg\",\"_sum\",\"_min\",\"_max\",\"User.groupBy\",\"User.aggregate\",\"AND\",\"OR\",\"NOT\",\"id\",\"email\",\"name\",\"createdAt\",\"updatedAt\",\"equals\",\"in\",\"notIn\",\"lt\",\"lte\",\"gt\",\"gte\",\"not\",\"contains\",\"startsWith\",\"endsWith\",\"search\",\"_relevance\",\"set\",\"increment\",\"decrement\",\"multiply\",\"divide\"]"),
    graph: "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"
};
async function decodeBase64AsWasm(wasmBase64) {
    const { Buffer } = await import('node:buffer');
    const wasmArray = Buffer.from(wasmBase64, 'base64');
    return new WebAssembly.Module(wasmArray);
}
config.compilerWasm = {
    getRuntime: async () => await import("@prisma/client/runtime/query_compiler_fast_bg.mysql.mjs"),
    getQueryCompilerWasmModule: async () => {
        const { wasm } = await import("@prisma/client/runtime/query_compiler_fast_bg.mysql.wasm-base64.mjs");
        return await decodeBase64AsWasm(wasm);
    },
    importName: "./query_compiler_fast_bg.js"
};
export function getPrismaClientClass() {
    return runtime.getPrismaClient(config);
}
//# sourceMappingURL=class.js.map