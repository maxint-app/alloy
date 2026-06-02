import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";

const app = express();
const mcp = new McpServer({
    name: "test",
    version: "1.0.0"
});

mcp.tool("say_hello", { name: z.string() }, async ({ name }) => {
    return {
        content: [{ type: "text", text: `Hello ${name}` }]
    }
});

const transports = new Map<string, SSEServerTransport>();

app.get("/mcp/sse", async (req, res) => {
    const transport = new SSEServerTransport("/mcp/messages", res);
    transports.set(transport.sessionId, transport);
    await mcp.connect(transport);
    
    req.on("close", () => {
        transports.delete(transport.sessionId);
    });
});

app.post("/mcp/messages", express.json(), async (req, res) => {
    const sessionId = req.query.sessionId as string;
    const transport = transports.get(sessionId);
    if (!transport) {
        return res.status(400).send("Invalid sessionId");
    }
    await transport.handlePostMessage(req, res);
});

app.listen(3002, () => {
    console.log("Listening on 3002");
    process.exit(0);
});
