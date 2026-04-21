import mongoose from "mongoose";

const ABCSchema = new mongoose.Schema(
    {
        text: {
            type: String,
        }
    },
    {
        timestamps: true
    }
);

export default mongoose.model('ABC', ABCSchema);

