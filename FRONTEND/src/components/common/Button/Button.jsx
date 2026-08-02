import './Button.css'
export default function Button({ children, variant = 'solid', ...props }) { return <button className={`sv-button ${variant}`} {...props}>{children}</button> }
