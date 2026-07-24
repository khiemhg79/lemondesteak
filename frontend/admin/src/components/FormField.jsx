export default function FormField({ label, children }) {
  return <div className="field"><label>{label}</label>{children}</div>;
}
