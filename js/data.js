import { supabase } from "./supabase.js";

export async function listActivities(userId) {
  const { data, error } = await supabase.from("daily_activities")
    .select("*").eq("user_id", userId).order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function saveActivity(userId, record) {
  const payload = { ...record, user_id: userId };
  const query = record.id
    ? supabase.from("daily_activities").update(payload).eq("id", record.id).eq("user_id", userId)
    : supabase.from("daily_activities").insert(payload);
  const { error } = await query;
  if (error) throw error;
}
export async function deleteActivity(userId, id) {
  const { error } = await supabase.from("daily_activities")
    .delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
export async function listEvaluations(userId) {
  const { data, error } = await supabase.from("evaluations")
    .select("*").eq("user_id", userId).order("evaluation_date", { ascending: false });
  if (error) throw error;
  return data ?? [];
}
export async function saveEvaluation(userId, record) {
  const { error } = await supabase.from("evaluations")
    .insert({ ...record, user_id: userId });
  if (error) throw error;
}
export async function listGoals(userId) {
  const { data, error } = await supabase.from("goals")
    .select("*, goal_milestones(*)").eq("user_id", userId)
    .order("deadline", { ascending: true });
  if (error) throw error;
  return data ?? [];
}
export async function saveGoal(userId, record) {
  const payload = { ...record, user_id: userId };
  const query = record.id
    ? supabase.from("goals").update(payload).eq("id", record.id).eq("user_id", userId)
    : supabase.from("goals").insert(payload);
  const { error } = await query;
  if (error) throw error;
}
export async function deleteGoal(userId, id) {
  const { error } = await supabase.from("goals")
    .delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
export async function saveMilestone(userId, record) {
  const { error } = await supabase.from("goal_milestones")
    .insert({ ...record, user_id: userId });
  if (error) throw error;
}
export async function updateMilestone(userId, id, updates) {
  const { error } = await supabase.from("goal_milestones")
    .update(updates).eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
export async function deleteMilestone(userId, id) {
  const { error } = await supabase.from("goal_milestones")
    .delete().eq("id", id).eq("user_id", userId);
  if (error) throw error;
}
