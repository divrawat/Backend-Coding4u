import request from "supertest";
import app from "../index.js";

describe("GET /", () => {
    it("should return backend message", async () => {
        const res = await request(app).get("/");
        expect(res.statusCode).toBe(200);
        expect(res.body).toBe("Backend index 00 - Jenkins Auto Deploy Divyanshu");
    });
});