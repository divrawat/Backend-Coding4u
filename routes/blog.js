import express from "express";
const router = express.Router();
import { create, list, list2, listAllBlogsCategoriesTags, read, remove, update, relatedposts, listSearch, listByUser, allblogs, feeds, allblogslugs } from "../controllers/blog.js"
import { requireSignin, adminMiddleware, authMiddleware, canUpdateDeleteBlog } from "../controllers/auth.js"
import ABC from "../models/abc.js";
// import redisClient from "../redis.js";

router.post('/blog', requireSignin, adminMiddleware, create);
router.get('/blogs', list);
router.get('/allblogs', allblogs);
router.get('/rss', feeds);
router.get('/blogs/search', listSearch);
router.get('/blogs-categories-tags', listAllBlogsCategoriesTags);
router.get('/blog/:slug', read);
router.delete('/blog/:slug', requireSignin, adminMiddleware, remove);
router.patch('/blog/:slug', requireSignin, adminMiddleware, update);
router.get('/blog/related/:slug', relatedposts);
router.get('/allblogslugs', allblogslugs);

router.get('/:username/userblogs', list2);
router.post('/user/blog', requireSignin, authMiddleware, create);
router.get('/:username/blogs', listByUser);
router.delete('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, remove);
router.patch('/user/blog/:slug', requireSignin, authMiddleware, canUpdateDeleteBlog, update);

/*
router.post("/testing-elasticache", async (req, res) => {
    try {
        const documents = [];

        for (let i = 1; i <= 1000; i++) {
            documents.push({
                text: `Sample text ${i}`,
            });
        }

        const result = await ABC.insertMany(documents);

        res.status(200).json({
            message: "1000 documents inserted successfully",
            count: result.length,
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({
            message: "Error inserting documents",
            error: error.message,
        });
    }
});

router.get("/abc", async (req, res) => {
    try {
        const cacheKey = "abc_all";

        // 1. Check cache
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            return res.status(200).json({
                source: "cache",
                ...JSON.parse(cachedData),
            });
        }

        // 2. Fetch from MongoDB
        const data = await ABC.find().sort({ createdAt: -1 });

        const response = {
            count: data.length,
            data,
        };

        // 3. Store in cache (EX = expiry in seconds)
        await redisClient.set(cacheKey, JSON.stringify(response), {
            EX: 60, // cache for 60 seconds
        });

        res.status(200).json({
            source: "db",
            ...response,
        });

    } catch (error) {
        res.status(500).json({
            message: "Error fetching data",
            error: error.message,
        });
    }
});
*/

export default router

