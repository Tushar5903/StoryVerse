import { motion } from 'framer-motion'
import { fadeInUp } from '../../../animations/variants'
import './StatCard.css'
export default function StatCard({ label, value, note = 'Live from your archive' }) { return <motion.article {...fadeInUp} className="sv-stat-card"><span>{label}</span><strong>{value}</strong><small>{note}</small></motion.article> }
