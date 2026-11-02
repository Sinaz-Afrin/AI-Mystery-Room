import mongoose from 'mongoose'

const suspectSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, required: true },
  role: { type: String, required: true },
  profile: { type: String, required: true },
  motive: { type: String, required: true },
  opportunity: { type: String, required: true },
  alibi: { type: String, required: true },
  evidenceIds: { type: [String], default: [] },
}, { _id: false })

const mysteryCaseSchema = new mongoose.Schema({
  ownerId: { type: String, required: true, index: true },
  status: { type: String, enum: ['generating', 'playable', 'accused', 'failed'], required: true, index: true },
  title: { type: String, required: true },
  premise: { type: String, required: true },
  briefing: { type: String, required: true },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], required: true },
  tone: { type: String, enum: ['classic_detective', 'suspense', 'lighthearted'], required: true },
  suspects: { type: [suspectSchema], default: [] },
  timeline: { type: [mongoose.Schema.Types.Mixed], default: [] },
  evidence: { type: [mongoose.Schema.Types.Mixed], default: [] },
  solutionPrivate: { type: mongoose.Schema.Types.Mixed, select: false },
  playerState: { type: mongoose.Schema.Types.Mixed, default: () => ({ reviewedEvidenceIds: [] }) },
}, { timestamps: true, minimize: false })

mysteryCaseSchema.index({ createdAt: -1 })
mysteryCaseSchema.index({ ownerId: 1, createdAt: -1 })

export const MysteryCase = mongoose.model('MysteryCase', mysteryCaseSchema)
