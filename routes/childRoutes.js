const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

const {
    addChild,
    getChildren,
    getChild,
    updateChild,
    deleteChild
} = require("../controllers/childController");

router.post("/", protect, addChild);

router.get("/", protect, getChildren);

router.get("/:id", protect, getChild);

router.put("/:id", protect, updateChild);

router.delete("/:id", protect, deleteChild);

module.exports = router;