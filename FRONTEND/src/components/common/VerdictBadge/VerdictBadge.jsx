import './VerdictBadge.css'
const labels = {
    SKIP: ['Skip', 'coral'],
    TIMEPASS: ['Timepass', 'amber'],
    GO_FOR_IT: ['Go For It', 'teal'],
    PERFECTION: ['Perfection', 'violet']
}
export default function VerdictBadge({ verdict }) {
    const [label, tone] = labels[verdict] || labels.GO_FOR_IT;
    return (
        <span className={`sv-verdict ${tone}`}>
            {label}
        </span>
    )
}
