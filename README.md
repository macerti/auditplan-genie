# AuditPlan Genie

ISO Audit Planning – Visual Gantt Application

Build a single-page web application (HTML / CSS / JavaScript only, no backend required initially) whose sole purpose is to plan and validate ISO audit activities using a time-based visual Gantt view.

This is not a generic project-management tool.
The application is intended for audit governance and compliance control, where qualification rules and manday constraints drive the UI behavior.

Context and Goal

Standard Gantt tools are insufficient because they treat a task as a single block with one duration, whereas audit planning requires modeling:

• Process audit duration per auditor
• Qualification constraints (standards + EAC sector codes)
• Daily working time limits
• Total mandays per auditor defined by a mission order

The goal of the application is to visually verify compliance before finalizing an audit plan.

Core Entities (Conceptual Model)

The app should be designed around these entities:

Standards
– ISO 9001, ISO 14001, ISO 45001 (extensible)

Auditors
– Name
– EAC sector codes
– Qualified ISO standards
– Maximum mandays for the mission
– Automatically calculated total hours and mandays used

Processes
– Process name
– ISO standards audited in that process

Audit Assignments
– Link between process × auditor × time segment
– A single process may be split across:
• Multiple days
• Multiple auditors

Functional Requirements
Standards & Setup

• User selects which ISO standards are in scope for the audit.
• Only selected standards are available for processes and assignments.

Auditor Management

• User creates an audit team and defines:
– EAC sector codes
– Qualified ISO standards
– Maximum mandays

Process Definition

• User defines audit processes and selects:
– Which ISO standards are audited per process

Assignment Rules (Hard Constraints)

• An auditor may only be assigned to a process if:
– They are qualified for all required ISO standards
– They are qualified for the relevant EAC sector code
• An auditor may not exceed:
– 7 working hours per day
– Total mandays defined in the mission order

Visualization & Interaction

• Hour-level Gantt chart (not day-level)
• Horizontal axis: time (hours)
• Vertical axis: audit assignments
• User can:
– Drag and drop process segments on the timeline
– Resize segments to define duration
– Assign or reassign auditors to process segments
• The same process may appear multiple times (e.g. Day 1 auditor A, Day 2 auditor B)

Compliance Feedback (Critical)

The UI must continuously reflect compliance status:

• Green: fully compliant assignment
• Orange: warning (near manday limit, partial coverage, etc.)
• Red: violation (qualification mismatch, >7h/day, manday exceeded)

The application should prioritize preventing or clearly flagging invalid audit plans rather than merely displaying data.

Summary & Control View

Provide a summary showing:

• Total hours per auditor
• Mandays used per auditor
• Identification of all rule violations

This summary exists to allow a final audit-planning sanity check before approval.

Design Philosophy

This tool exists to answer one question:

“Does this audit plan fully comply with qualification, standard coverage, sector competence, and manday constraints?”

UI simplicity and correctness are more important than visual sophistication.

This project was originally scaffolded with [Lovable](https://lovable.dev)
and has since been fully de-coupled from it for self-hosted deployment.

## Tech stack

- **Frontend**: React + TypeScript + Vite, Tailwind CSS, shadcn/ui — built
  as a static single-page app with relative asset paths, deployable to any
  subfolder on shared hosting.
- **Backend**: plain PHP (no framework, no Composer dependency) exposing a
  small REST-ish API under `api/` for saving/loading named audit plans.
- **Database**: MySQL / MariaDB — one table (`audit_plans`), see
  `sql/schema.sql`.

See **[DEPLOY.md](./DEPLOY.md)** for the full shared-hosting deployment
guide (DirectAdmin / cPanel-style mutualized hosting, no SSH, no Node.js
on the server).

## Development

You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone https://github.com/macerti/auditplan-genie.git
cd auditplan-genie
npm install
npm run dev
```

For the PHP backend during local development, copy the config template
and point it at a local MySQL/MariaDB instance:

```sh
cp public/api/config.sample.php public/api/config.php
# edit public/api/config.php with your local DB credentials
mysql -u root your_db_name < public/sql/schema.sql
php -S localhost:8000 -t public/api
```

## Testing

Unit tests cover the compliance calculation engine (`src/lib/compliance.ts`)
— the core business logic that determines whether an audit plan is
compliant (green), at-risk (orange), or in violation (red):

```sh
npm run test
```

## Production build

```sh
npm run build
```

Outputs a self-contained, ready-to-upload folder in `dist/` — see
[DEPLOY.md](./DEPLOY.md) for exactly what to do with it.

