import { supabase, isConfigured } from "./supabase.js";
import { listActivities, saveActivity, deleteActivity, listEvaluations, saveEvaluation, listGoals, saveGoal, deleteGoal, saveMilestone, updateMilestone, deleteMilestone } from "./data.js";

const dimensions = [
  { key:"spiritual", name:"Spiritual life", icon:"✧", description:"Prayer, Bible study, Sabbath, evangelism and service." },
  { key:"economic", name:"Economic life", icon:"▤", description:"Business, income, savings, financial discipline and independence." },
  { key:"agriculture", name:"Agriculture & investment", icon:"♧", description:"Farm projects, productive assets, costs, yields and reinvestment." },
  { key:"relationships", name:"Relationships & family", icon:"♡", description:"Friendships, family, marriage preparation and communication." },
  { key:"character", name:"Character & emotional maturity", icon:"◈", description:"Patience, humility, kindness, integrity and self-control." },
  { key:"health", name:"Physical health", icon:"⌁", description:"Exercise, nutrition, sleep, hygiene and wellbeing." },
  { key:"learning", name:"Learning & career", icon:"⌑", description:"Reading, technical skills, professional growth and leadership." },
  { key:"impact", name:"Social impact & service", icon:"✦", description:"People helped, mentoring, witnessing and community service." }
];
const $ = s => document.querySelector(s);
const today = new Date().toLocaleDateString("en-CA");
let user = null, activities = [], evaluations = [], goals = [], currentView = "dashboard", chart = null, authMode = "signin";

function toast(message){const el=$("#toast");el.textContent=message;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function escapeHTML(value=""){return String(value).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function dimension(key){return dimensions.find(d=>d.key===key)}
function setView(view){currentView=view;document.querySelectorAll(".view").forEach(v=>v.classList.add("hidden"));const target=$("#view-"+view);if(target)target.classList.remove("hidden");document.querySelectorAll(".nav-item[data-view]").forEach(b=>b.classList.toggle("active",b.dataset.view===view));const titles={dashboard:"Overview",activities:"Daily activities",evaluations:"Self-evaluation",goals:"Goals",dimension:"Life dimension"};$("#page-title").textContent=titles[view]||"Overview";$("#sidebar").classList.remove("open")}
function setAuthenticated(on){$("#auth-screen").classList.toggle("hidden",on);$("#app-shell").classList.toggle("hidden",!on)}
function populateDimensions(){
  $("#dimension-nav").innerHTML=dimensions.map(d=>`<button class="nav-item" data-dimension="${d.key}"><span>${d.icon}</span>${d.name}</button>`).join("");
  $("#activity-category").innerHTML=dimensions.map(d=>`<option value="${d.key}">${d.name}</option>`).join("");
  $("#activity-filter").innerHTML='<option value="all">All dimensions</option>'+dimensions.map(d=>`<option value="${d.key}">${d.name}</option>`).join("");
  $("#goal-category").innerHTML=dimensions.map(d=>`<option value="${d.key}">${d.name}</option>`).join("");
  $("#score-fields").innerHTML=dimensions.map(d=>`<div class="score-input"><label for="score-${d.key}">${d.name}</label><input id="score-${d.key}" type="number" min="0" max="5" step="1" value="0" required></div>`).join("");
}
async function refresh(){
  [activities,evaluations,goals]=await Promise.all([listActivities(user.id),listEvaluations(user.id),listGoals(user.id)]);
  renderAll();
}
function renderAll(){renderDashboard();renderActivities();renderEvaluations();renderGoals();if(currentView==="dimension")renderDimension(currentDimension)}
function renderDashboard(){
  const now=new Date(), start=new Date(now);start.setDate(now.getDate()-6);start.setHours(0,0,0,0);
  const week=activities.filter(a=>new Date(a.activity_date+"T00:00:00")>=start);
  const todayRows=activities.filter(a=>a.activity_date===today);
  $("#today-count").textContent=todayRows.length;$("#weekly-count").textContent=week.length;$("#week-count").textContent=week.length;
  const dailyEvals=evaluations.filter(e=>e.evaluation_period==="daily");
  $("#average-score").textContent=dailyEvals.length?((dailyEvals.reduce((s,e)=>s+Number(e.average_score),0)/dailyEvals.length).toFixed(1)+"/5"):"—";
  $("#dimension-cards").innerHTML=dimensions.map(d=>{
    const count=activities.filter(a=>a.category===d.key&&a.completed).length;
    const pct=Math.min(100,count*10);
    return `<article class="dimension-card" data-dimension="${d.key}"><div class="dimension-top"><div class="dimension-icon">${d.icon}</div><div class="dimension-name">${d.name}</div></div><div class="dimension-count">${count} <small>completed</small></div><div class="progress"><span style="width:${pct}%"></span></div></article>`;
  }).join("");
  $("#recent-list").innerHTML=activities.slice(0,5).map(a=>`<div class="recent-item"><div><strong>${escapeHTML(a.title)}</strong><small>${escapeHTML(a.activity_date)} · ${dimension(a.category)?.name||a.category}</small></div><span class="tag">${a.completed?"Completed":"In progress"}</span></div>`).join("")||'<p class="muted">No activities yet. Add your first one.</p>';
  const labels=[], values=[];for(let i=6;i>=0;i--){const d=new Date();d.setDate(d.getDate()-i);const key=d.toLocaleDateString("en-CA");labels.push(d.toLocaleDateString(undefined,{weekday:"short"}));values.push(activities.filter(a=>a.activity_date===key).length)}
  if(chart)chart.destroy();chart=new Chart($("#activity-chart"),{type:"line",data:{labels,datasets:[{label:"Activities",data:values,borderColor:"#6558d3",backgroundColor:"#6558d31c",fill:true,tension:.35,pointRadius:4}]},options:{responsive:true,maintainAspectRatio:false,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{precision:0}},x:{grid:{display:false}}}}});
}
function renderActivities(){
  const q=$("#activity-search").value.toLowerCase(),filter=$("#activity-filter").value;
  const rows=activities.filter(a=>(filter==="all"||a.category===filter)&&(`${a.title} ${a.notes||""}`).toLowerCase().includes(q));
  $("#activity-table").innerHTML=rows.length?`<table><thead><tr><th>Activity</th><th>Dimension</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead><tbody>${rows.map(a=>`<tr><td><strong>${escapeHTML(a.title)}</strong><br><span class="muted">${escapeHTML(a.notes||"")}</span></td><td>${dimension(a.category)?.name||a.category}</td><td>${a.activity_date}</td><td><span class="tag">${a.completed?"Completed":"In progress"}</span></td><td><div class="table-actions"><button class="mini-btn" data-edit="${a.id}">Edit</button><button class="mini-btn danger" data-delete="${a.id}">Delete</button></div></td></tr>`).join("")}</tbody></table>`:'<div class="empty-state"><h3>No activities found</h3><p class="muted">Add an activity or change your search.</p></div>';
}
function renderEvaluations(){
  $("#evaluation-history").innerHTML=evaluations.length?evaluations.map(e=>`<div class="history-item"><strong>${e.evaluation_period.toUpperCase()} · ${e.evaluation_date}</strong><span class="tag">${Number(e.average_score).toFixed(1)} / 5</span><p>${escapeHTML(e.reflection||"No reflection added.")}</p></div>`).join(""):'<p class="muted">Your evaluations will appear here.</p>';
}
function renderGoals(){
  const filter=$("#goal-filter").value;
  const rows=goals.filter(g=>filter==="all"||g.status===filter);
  $("#goal-list").innerHTML=rows.length?rows.map(g=>{
    const milestones=[...(g.goal_milestones||[])].sort((a,b)=>(a.deadline||"9999-12-31").localeCompare(b.deadline||"9999-12-31"));
    const completed=milestones.filter(m=>m.completed).length;
    const progress=milestones.length?Math.round(completed/milestones.length*100):0;
    const overdue=g.status==="active"&&g.deadline<today;
    return `<article class="panel goal-card"><div class="goal-card-heading"><div><span class="tag">${escapeHTML(dimension(g.category)?.name||g.category)}</span><span class="tag ${g.status==="completed"?"goal-complete":overdue?"goal-overdue":""}">${g.status==="completed"?"Completed":overdue?"Overdue":"Due "+escapeHTML(g.deadline)}</span><h3>${escapeHTML(g.title)}</h3>${g.description?`<p class="muted">${escapeHTML(g.description)}</p>`:""}</div><div class="goal-actions"><button class="mini-btn" data-goal-edit="${escapeHTML(g.id)}">Edit</button><button class="mini-btn" data-goal-toggle="${escapeHTML(g.id)}">${g.status==="completed"?"Reopen":"Complete"}</button><button class="mini-btn danger" data-goal-delete="${escapeHTML(g.id)}">Delete</button></div></div><div class="goal-progress-label"><span>${completed} of ${milestones.length} milestones complete</span><span>${progress}%</span></div><div class="progress"><span style="width:${progress}%"></span></div><div class="milestone-list">${milestones.map(m=>`<div class="milestone-row"><button class="milestone-check ${m.completed?"checked":""}" data-milestone-toggle="${escapeHTML(m.id)}" aria-label="${m.completed?"Mark incomplete":"Mark complete"}" aria-pressed="${m.completed}">${m.completed?"✓":""}</button><span class="milestone-title ${m.completed?"completed":""}">${escapeHTML(m.title)}</span>${m.deadline?`<small class="${!m.completed&&m.deadline<today?"overdue-text":""}">${escapeHTML(m.deadline)}</small>`:""}<button class="mini-btn danger" data-milestone-delete="${escapeHTML(m.id)}" aria-label="Delete milestone">×</button></div>`).join("")||'<p class="muted milestone-empty">No milestones yet. Add the first step toward this goal.</p>'}</div><button class="text-button" data-milestone-add="${escapeHTML(g.id)}">＋ Add milestone</button></article>`;
  }).join(""):'<div class="empty-state panel"><div class="empty-icon">⚑</div><h3>${filter==="active"?"No active goals yet":"No goals found"}</h3><p class="muted">Set a clear target and deadline, then break it into milestones.</p><button class="btn primary" data-new-goal>＋ Create a goal</button></div>';
}
function openGoal(record=null){
  $("#goal-form").reset();$("#goal-id").value=record?.id||"";$("#goal-title").value=record?.title||"";$("#goal-category").value=record?.category||"spiritual";$("#goal-description").value=record?.description||"";$("#goal-deadline").value=record?.deadline||today;$("#goal-modal-title").textContent=record?"Edit goal":"New goal";$("#goal-dialog").showModal();
}
async function handleGoalSubmit(event){
  event.preventDefault();const id=$("#goal-id").value||undefined;
  const record={id,title:$("#goal-title").value.trim(),category:$("#goal-category").value,description:$("#goal-description").value.trim(),deadline:$("#goal-deadline").value};
  if(!record.title||!record.deadline){toast("Please enter a goal title and deadline.");return}
  try{await saveGoal(user.id,record);$("#goal-dialog").close();await refresh();toast(id?"Goal updated":"Goal created")}catch(e){toast(e.message||"Could not save goal")}
}
async function handleMilestoneSubmit(event){
  event.preventDefault();const record={goal_id:$("#milestone-goal-id").value,title:$("#milestone-title").value.trim(),deadline:$("#milestone-deadline").value||null};
  if(!record.title){toast("Please enter a milestone.");return}
  try{await saveMilestone(user.id,record);$("#milestone-dialog").close();await refresh();toast("Milestone added")}catch(e){toast(e.message||"Could not save milestone")}
}
let currentDimension=null;
function renderDimension(key){const d=dimension(key);if(!d)return;currentDimension=key;$("#dimension-title").textContent=d.name;$("#dimension-description").textContent=d.description;const rows=activities.filter(a=>a.category===key);$("#dimension-activity-list").innerHTML=rows.length?rows.map(a=>`<div class="recent-item"><div><strong>${escapeHTML(a.title)}</strong><small>${a.activity_date} · ${escapeHTML(a.notes||"")}</small></div><span class="tag">${a.completed?"Completed":"In progress"}</span></div>`).join(""):'<p class="muted">No records in this dimension yet.</p>';setView("dimension")}
function openActivity(record=null,category=null){
  $("#activity-form").reset();$("#activity-id").value=record?.id||"";$("#activity-title").value=record?.title||"";$("#activity-category").value=record?.category||category||"spiritual";$("#activity-date").value=record?.activity_date||today;$("#activity-notes").value=record?.notes||"";$("#activity-duration").value=record?.duration_minutes??30;$("#activity-completed").value=String(record?.completed??true);$("#activity-modal-title").textContent=record?"Edit activity":"Add activity";$("#activity-dialog").showModal();
}
async function handleActivitySubmit(event){
  event.preventDefault();const id=$("#activity-id").value||undefined;
  const record={id,title:$("#activity-title").value.trim(),category:$("#activity-category").value,activity_date:$("#activity-date").value,notes:$("#activity-notes").value.trim(),duration_minutes:Number($("#activity-duration").value||0),completed:$("#activity-completed").value==="true"};
  if(!record.title){toast("Please enter an activity title.");return}
  try{await saveActivity(user.id,record);$("#activity-dialog").close();await refresh();toast(id?"Activity updated":"Activity added")}catch(e){toast(e.message||"Could not save activity")}
}
async function handleEvaluationSubmit(event){
  event.preventDefault();const scores={};let total=0;
  dimensions.forEach(d=>{const score=Number($("#score-"+d.key).value);scores[d.key]=score;total+=score});
  const record={evaluation_period:$("#eval-period").value,evaluation_date:$("#eval-date").value,scores,average_score:total/dimensions.length,reflection:$("#eval-reflection").value.trim()};
  try{await saveEvaluation(user.id,record);$("#eval-reflection").value="";await refresh();toast("Evaluation saved")}catch(e){toast(e.message||"Could not save evaluation")}
}
async function signIn(event){event.preventDefault();if(!isConfigured){toast("Add your Supabase URL and key in js/config.js first.");return}const email=$("#auth-email").value,password=$("#auth-password").value;const result=authMode==="signin"?await supabase.auth.signInWithPassword({email,password}):await supabase.auth.signUp({email,password});if(result.error){toast(result.error.message);return}if(authMode==="signup"&&!result.data.session){toast("Check your email to confirm your account.");return}user=result.data.user;await enterApp()}
async function enterApp(){if(!user)return;setAuthenticated(true);$("#user-email").textContent=user.email;$("#user-avatar").textContent=(user.email||"U")[0].toUpperCase();try{await refresh()}catch(e){toast("Database setup required: "+e.message)}}
async function init(){
  populateDimensions();$("#date-pill").textContent=new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"});$("#today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"});$("#eval-date").value=today;
  if(!isConfigured){$("#setup-notice").classList.remove("hidden");$("#setup-notice").textContent="Setup needed: add your Supabase project URL and publishable key in js/config.js, then run the SQL setup file. See README.md."}
  $("#auth-form").addEventListener("submit",signIn);
  $("#auth-toggle").addEventListener("click",()=>{authMode=authMode==="signin"?"signup":"signin";$("#auth-submit").textContent=authMode==="signin"?"Sign in":"Create account";$("#auth-toggle").textContent=authMode==="signin"?"New here? Create an account":"Already registered? Sign in"});
  $("#signout-btn").addEventListener("click",async()=>{await supabase?.auth.signOut();user=null;setAuthenticated(false)});
  $("#quick-add").addEventListener("click",()=>openActivity());$("#add-activity").addEventListener("click",()=>openActivity());$("#dimension-add").addEventListener("click",()=>openActivity(null,currentDimension));
  $("#close-modal").addEventListener("click",()=>$("#activity-dialog").close());$("#cancel-modal").addEventListener("click",()=>$("#activity-dialog").close());
  $("#activity-form").addEventListener("submit",handleActivitySubmit);$("#evaluation-form").addEventListener("submit",handleEvaluationSubmit);
  $("#add-goal").addEventListener("click",()=>openGoal());$("#goal-form").addEventListener("submit",handleGoalSubmit);$("#milestone-form").addEventListener("submit",handleMilestoneSubmit);$("#goal-filter").addEventListener("change",renderGoals);
  $("#activity-search").addEventListener("input",renderActivities);$("#activity-filter").addEventListener("change",renderActivities);
  document.body.addEventListener("click",async e=>{
    const close=e.target.closest("[data-close-dialog]");if(close){$("#"+close.dataset.closeDialog).close();return}
    if(e.target.closest("[data-new-goal]")){openGoal();return}
    const goalEdit=e.target.closest("[data-goal-edit]");if(goalEdit){openGoal(goals.find(g=>String(g.id)===goalEdit.dataset.goalEdit));return}
    const milestoneAdd=e.target.closest("[data-milestone-add]");if(milestoneAdd){$("#milestone-form").reset();$("#milestone-goal-id").value=milestoneAdd.dataset.milestoneAdd;$("#milestone-dialog").showModal();return}
    const milestoneToggle=e.target.closest("[data-milestone-toggle]");if(milestoneToggle){const milestone=goals.flatMap(g=>g.goal_milestones||[]).find(m=>String(m.id)===milestoneToggle.dataset.milestoneToggle);if(milestone){try{await updateMilestone(user.id,milestone.id,{completed:!milestone.completed});await refresh()}catch(err){toast(err.message||"Could not update milestone")}}return}
    const milestoneDelete=e.target.closest("[data-milestone-delete]");if(milestoneDelete&&confirm("Delete this milestone?")){try{await deleteMilestone(user.id,milestoneDelete.dataset.milestoneDelete);await refresh();toast("Milestone deleted")}catch(err){toast(err.message||"Could not delete milestone")}return}
    const goalToggle=e.target.closest("[data-goal-toggle]");if(goalToggle){const goal=goals.find(g=>String(g.id)===goalToggle.dataset.goalToggle);if(goal){try{await saveGoal(user.id,{id:goal.id,title:goal.title,category:goal.category,description:goal.description,deadline:goal.deadline,status:goal.status==="completed"?"active":"completed"});await refresh();toast(goal.status==="completed"?"Goal reopened":"Goal completed")}catch(err){toast(err.message||"Could not update goal")}}return}
    const goalDelete=e.target.closest("[data-goal-delete]");if(goalDelete&&confirm("Delete this goal and all its milestones? This cannot be undone.")){try{await deleteGoal(user.id,goalDelete.dataset.goalDelete);await refresh();toast("Goal deleted")}catch(err){toast(err.message||"Could not delete goal")}return}
    const nav=e.target.closest("[data-view]");if(nav){setView(nav.dataset.view);return}
    const go=e.target.closest("[data-go]");if(go){setView(go.dataset.go);return}
    const dim=e.target.closest("[data-dimension]");if(dim){renderDimension(dim.dataset.dimension);return}
    const edit=e.target.closest("[data-edit]");if(edit){openActivity(activities.find(a=>String(a.id)===edit.dataset.edit));return}
    const del=e.target.closest("[data-delete]");if(del&&confirm("Delete this activity? This cannot be undone.")){try{await deleteActivity(user.id,del.dataset.delete);await refresh();toast("Activity deleted")}catch(err){toast(err.message)}}
  });
  $("#menu-btn").addEventListener("click",()=>$("#sidebar").classList.toggle("open"));
  if(isConfigured){const {data}=await supabase.auth.getSession();if(data.session){user=data.session.user;await enterApp()}supabase.auth.onAuthStateChange((_event,session)=>{if(session?.user){user=session.user;enterApp()}else if(!session){setAuthenticated(false)}})}
}
init();
