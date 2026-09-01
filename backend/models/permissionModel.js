import mongoose from "mongoose";
import { softDeletePlugin } from "../plugins/softDeletePlugin.js";

const permissionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    key: {
      type: String,
      required: true,
      trim: true,
    },
    parentKey: {
      type: String,
      trim: true,
      default: null,
    },
    actions: {
      type: [String],
      default: [],
    },
    sectionType: {
      type: String,
      trim: true,
      default: null,
    },
  },
  { timestamps: true }
);

// ✅ Compound unique index on userId + key
permissionSchema.index({ userId: 1, key: 1 }, { unique: true });


permissionSchema.plugin(softDeletePlugin);
export default mongoose.model("Permission", permissionSchema);
