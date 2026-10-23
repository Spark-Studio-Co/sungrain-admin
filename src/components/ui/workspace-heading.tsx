import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import "./workspace-heading.css";

export function WorkspaceHeading({
  icon: Icon,
  eyebrow,
  title,
  description,
  actions,
}: {
  icon: LucideIcon;
  eyebrow: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="record-heading">
      <div className="record-heading-main">
        <span className="record-heading-eyebrow">
          <Icon size={14} aria-hidden="true" />
          {eyebrow}
        </span>
        <div className="record-heading-copy">
          <h1>{title}</h1>
          {description && (
            <div className="record-heading-description">{description}</div>
          )}
        </div>
      </div>
      {actions && <div className="record-heading-actions">{actions}</div>}
    </header>
  );
}
