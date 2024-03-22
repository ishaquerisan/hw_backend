import mongoose from "mongoose";
const gallerySchema = mongoose.Schema(
  {
    imgTitle: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: false,
    },
    image: {
      type: String,
      required: true,
    },
    // Define foreign key reference to Monument model
    monumentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "monument", // Reference to the Monument model
    },
  },

  {
    timestamps: true,
  }
);
const Gallery = mongoose.model("gallery", gallerySchema);
export default Gallery;
