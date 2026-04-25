import request from "supertest";
import app from "../index.js";
import Blog from "../models/blog.js";
import { jest } from "@jest/globals";

describe("Blogs API", () => {
    it("should fetch all blogs with slug and date fields only", async () => {
        // Mocking the Blog.find method to avoid DB dependency in tests
        const mockBlogs = [
            { slug: "test-blog-1", date: new Date().toISOString() },
            { slug: "test-blog-2", date: new Date().toISOString() }
        ];

        const findSpy = jest.spyOn(Blog, 'find').mockReturnValue({
            sort: jest.fn().mockReturnThis(),
            select: jest.fn().mockReturnThis(),
            exec: jest.fn().mockResolvedValue(mockBlogs)
        });

        const response = await request(app).get("/api/allblogs");
        
        // Assertions
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBe(2);
        expect(response.body[0].slug).toBe("test-blog-1");
        
        // Cleanup spy
        findSpy.mockRestore();
    }, 20000);
});
