import mongoose from 'mongoose'

const accusationSchema = new mongoose.Schema({
  caseId: { type: mongoose.Schema.Types.ObjectId, ref: 'MysteryCase', required: true, unique: true },
  suspectId: { type: String, required: true },
  reasoningNote: { type: String, maxlength: 500 },
  isCorrect: { type: Boolean, required: true },
}, { timestamps: true })

export const Accusation = mongoose.model('Accusation', accusationSchema)
