export type UserRole = 'owner' | 'collaborator';

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'needs_changes' | 'blocked' | 'done' | 'archived';

export type TaskPriority = 'Low' | 'Medium' | 'High' | 'Urgent';

export type TaskType = 'Content' | 'Ads' | 'Design' | 'Video' | 'Strategy' | 'Audit' | 'Review' | 'Admin' | 'General';

export interface Project {
  id: number;
  name: string;
  client: string;
  status: 'green' | 'yellow' | 'red';
  progress: number;
  assignees: string[];
  color: string;
  icon_name: string;
  created_at: string;
  activeTasksCount?: number;
  activeTasksList?: Task[];
}

export interface Task {
  id: number;
  project_id: number;
  title: string;
  assignee: string; // Initials
  reviewer: string; // Initials, defaults to RM
  deadline: string;
  priority: TaskPriority;
  task_type: TaskType;
  instructions: string;
  status: TaskStatus;
  block_reason?: string;
  created_at: string;
  updated_at: string;
  moved_to_review_at?: string;
  completed_at?: string;
  archived_at?: string;
  attachments?: string[]; // Array of URLs
  created_by: string; // User ID or Initials
  client?: string;
  drive_link?: string;
  extra_link?: string;
  finished_link?: string;
  description?: string;
}

export type Severity = 'critical' | 'warning' | 'info';

export interface Alert {
  id: string;
  title: string;
  description: string;
  client: string;
  assignee: string;
  assigneeInitials: string;
  assigneeColor: string;
  errorCode: string;
  severity: Severity;
  isResolved: boolean;
  created_at: string;
}
