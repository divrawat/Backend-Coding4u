import WebStory from "../models/webstory.js";
import slugify from "slugify";
import moment from "moment-timezone"
import multer from 'multer';
import { FRONTEND } from "../config.js";
const upload = multer({});

export const createWebStory = async (req, res) => {

  upload.none()(req, res, async (err) => {
    if (err) { return res.status(400).json({ error: 'Something went wrong' }) }
    const { title, description, slug, coverphoto, slides, link, lastimage, lastheading, ads } = req.body;

    if (!title || title.length > 69) { return res.status(400).json({ error: 'Title is required, less than 70 characters' }) }
    if (!description || description.length > 200) { return res.status(400).json({ error: 'Description is required, less than 200 characters' }); }
    if (!slug) { return res.status(400).json({ error: 'Slug is required' }) }
    if (!coverphoto) { return res.status(400).json({ error: 'Cover photo is required' }) }
    if (!slides) { return res.status(400).json({ error: 'Slides is required' }); }

    let story = new WebStory();
    story.title = title;
    story.slug = slugify(slug).toLowerCase();
    story.description = description;
    story.coverphoto = coverphoto;
    const currentDateTimeIST = moment().tz('Asia/Kolkata').format();
    story.date = currentDateTimeIST;
    story.slides = JSON.parse(slides);
    story.link = link;
    story.lastheading = lastheading;
    story.lastimage = lastimage;
    story.ads = ads;

    try {
      const savedStory = await story.save();
       fetch(`${FRONTEND}/api/revalidate?path=/web-stories/${story.slug}`, { method: 'POST' })
       fetch(`${FRONTEND}/api/revalidate?path=/web-stories`, { method: 'POST' })
      return res.status(201).json(savedStory);
    } catch (error) { return res.status(500).json({ error: "Slug should be unique" }) }
  });
};



export const fetchWebStoryBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const webStory = await WebStory.findOne({ slug });
    if (!webStory) { return res.status(404).json({ error: 'Web story not found' }) }
    res.json(webStory);
  } catch (error) {
    console.error('Error fetching web story by slug:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


export const allstories0 = async (req, res) => {
  try {
    const data = await WebStory.find({}).sort({ date: -1 }).select('title slug date coverphoto description').limit(12).exec();
    res.json(data);
  } catch (err) { return res.json({ error: "Something Went Wrong" }) }
};


export const allstories = async (req, res) => {
  try {
      const totalCount = await WebStory.countDocuments({}).exec();
      const page = Number(req.query.page) || 1;
      const perPage = 10;
      const { search } = req.query;
      const query = {$or: [{ title: { $regex: search, $options: 'i' } },]};    
      
      const skip = (page - 1) * perPage;
      const data = await WebStory.find(query).sort({ createdAt: -1 }).skip(skip).limit(perPage).exec();
      res.json({
          status: true,
          message: 'All Web Stories Fetched Successfully',
          totalBlogs: totalCount , data 
      });
  } catch (err) { console.error('Error fetching Stories:', err); res.status(500).json({ error: 'Internal Server Error' }); }
};














export const allslugs = async (req, res) => {
  try {
    const data = await WebStory.find({}).sort({ date: -1 }).select('slug').exec();
    res.json(data);
  } catch (err) { return res.json({ error: "Something Went Wrong" }) }
};


export const sitemap = async (req, res) => {
  try {
    const data = await WebStory.find({}).sort({ date: -1 }).select('title slug date coverphoto').exec();
    res.json(data);
  } catch (err) { return res.json({ error: "Something Went Wrong" }) }
};




export const deletestory = async (req, res) => {
  const slug = req.params.slug.toLowerCase();
  try {
    const data = await WebStory.findOneAndRemove({ slug }).exec();
    if (!data) {
      return res.status(404).json({ error: 'WebStory not found' });
    }
    res.json({ message: 'WebStory deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: "Something went wrong" });
  }
   fetch(`${FRONTEND}/api/revalidate?path=/web-stories/${slug}`, { method: 'POST' })
   fetch(`${FRONTEND}/api/revalidate?path=/web-stories`, { method: 'POST' })
};



export const updateStory = async (req, res) => {

  upload.none()(req, res, async (err) => {
    if (err) { return res.status(400).json({ error: 'Something went wrong' }) }

    const updateFields = req.body;

    try {
      const slug = req.params.slug.toLowerCase();
      if (!slug) { return res.status(404).json({ error: 'Story not found' }) }

      let story = await WebStory.findOne({ slug }).exec();

      const currentDateTimeIST = moment().tz('Asia/Kolkata').format();
      story.date = currentDateTimeIST;

      Object.keys(updateFields).forEach((key) => {
        if (key === 'title') { story.title = updateFields.title; }
        else if (key === 'description') { story.description = updateFields.description; }
        else if (key === 'slug') { story.slug = slugify(updateFields.slug).toLowerCase(); }
        else if (key === 'coverphoto') { story.coverphoto = updateFields.coverphoto; }
        else if (key === 'ads') { story.ads = updateFields.ads; }
        else if (key === 'slides') { story.slides = JSON.parse(updateFields.slides); }
        else if (key === 'link') { story.link = updateFields.link; }
        else if (key === 'lastimage') { story.lastimage = updateFields.lastimage; }
        else if (key === 'lastheading') { story.lastheading = updateFields.lastheading; }
      });
      const savedStory = await story.save();
      await fetch(`${FRONTEND}/api/revalidate?path=/web-stories/${story.slug}`, { method: 'POST' })
    await  fetch(`${FRONTEND}/api/revalidate?path=/web-stories`, { method: 'POST' })
      return res.status(200).json(savedStory);
    } catch (error) {
      console.error("Error updating web story:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
};