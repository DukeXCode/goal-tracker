export type GoalStatus = "not_started" | "in_progress" | "completed";

export interface Goal {
  id: string;
  title: string;
  description: string;
  status: GoalStatus;
  target_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateGoalInput {
  title: string;
  description?: string;
  status?: GoalStatus;
  target_date?: string | null;
}

export interface UpdateGoalInput {
  title?: string;
  description?: string;
  status?: GoalStatus;
  target_date?: string | null;
}

export type Mood = "great" | "good" | "okay" | "bad" | "terrible";

export interface JournalEntry {
  id: string;
  title: string;
  content: string;
  mood: Mood | null;
  goal_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateJournalEntryInput {
  title: string;
  content?: string;
  mood?: Mood | null;
  goal_id?: string | null;
}

export interface UpdateJournalEntryInput {
  title?: string;
  content?: string;
  mood?: Mood | null;
  goal_id?: string | null;
}

export interface CoachingTopic {
  id: string;
  title: string;
  session_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CoachingSession {
  id: string;
  session_date: string;
  created_at: string;
}

export interface CoachingSessionWithTopics extends CoachingSession {
  topics: CoachingTopic[];
}

export interface CreateCoachingTopicInput {
  title: string;
}

export interface UpdateCoachingTopicInput {
  title?: string;
}

export interface CompleteSessionInput {
  topic_ids: string[];
  session_date?: string;
}

export interface UpdateCoachingSessionInput {
  session_date: string;
}

export interface ApiResponse<T> {
  data: T;
}

export interface ApiListResponse<T> {
  data: T[];
}

export interface ApiErrorResponse {
  error: string;
}
