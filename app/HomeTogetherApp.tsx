"use client";

import {
  BedDouble,
  Bell,
  Building2,
  CalendarDays,
  Check,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  ClipboardCheck,
  Clock3,
  Copy,
  Droplets,
  Heart,
  Home,
  LayoutList,
  LogOut,
  Mail,
  Menu,
  Moon,
  MoreHorizontal,
  PawPrint,
  Plus,
  Repeat2,
  Search,
  Settings,
  Sparkles,
  Sun,
  UserPlus,
  WashingMachine,
  Wifi,
  WifiOff,
  Wrench,
  X,
  type LucideIcon,
} from "lucide-react";
import type { Session } from "@supabase/supabase-js";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useState,
} from "react";
import { getSupabaseClient, isSupabaseConfigured } from "@/lib/supabase/client";
import {
  type AppTask,
  type HouseholdMember,
  type HouseholdSnapshot,
  completeTaskRecord,
  createHousehold,
  createInvite,
  createTaskRecord,
  joinHousehold,
  loadHouseholdSnapshot,
  subscribeToHousehold,
  undoTaskCompletion,
  updateCompletionNote,
} from "@/lib/supabase/tasks";

type ViewKey = "week" | "calendar" | "tasks" | "settings";

const WEEK_LABELS = ["周一", "周二", "周三", "周四", "周五", "周六", "周日"];

function dateInChicago() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Chicago",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
}

function addDays(value: string, amount: number) {
  const date = new Date(`${value}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + amount);
  return date.toISOString().slice(0, 10);
}

function mondayWeek(value: string) {
  const day = new Date(`${value}T12:00:00Z`).getUTCDay();
  const mondayOffset = day === 0 ? -6 : 1 - day;
  return Array.from({ length: 7 }, (_, index) => addDays(value, mondayOffset + index));
}

const DEMO_TODAY = dateInChicago();
const DEMO_WEEK = mondayWeek(DEMO_TODAY);

const DEMO_MEMBERS: HouseholdMember[] = [
  { id: "nicole", displayName: "Nicole", avatarUrl: null },
  { id: "partner", displayName: "伴侣", avatarUrl: null },
];

const DEMO_TASKS: AppTask[] = [
  {
    id: "demo-1",
    title: "换床单",
    category: "bedroom",
    type: "recurring",
    assignee: "共同",
    assigneeMode: "shared",
    dueDate: DEMO_TODAY,
    status: "pending",
    recurrence: "每 14 天",
    recurrenceRule: { kind: "interval_days", interval: 14, keep_schedule: false },
    lastCompleted: "8 月 1 日",
    nextDue: "今天",
    description: "床单和枕套一起更换。",
  },
  {
    id: "demo-2",
    title: "联系物业确认门禁卡",
    category: "admin",
    type: "one_off",
    assignee: "Nicole",
    assigneeId: "nicole",
    assigneeMode: "member",
    dueDate: DEMO_WEEK[2],
    status: "pending",
    description: "确认补办时间和取卡地点。",
  },
  {
    id: "demo-3",
    title: "清理猫砂盆",
    category: "pet",
    type: "recurring",
    assignee: "伴侣",
    assigneeId: "partner",
    assigneeMode: "member",
    dueDate: DEMO_WEEK[4],
    status: "completed",
    recurrence: "每 3 天",
    recurrenceRule: { kind: "interval_days", interval: 3 },
    completedAt: `${DEMO_WEEK[4]}T19:40:00-05:00`,
    note: "猫砂快用完了，周末补一袋。",
    lastCompleted: "昨天",
    nextDue: "8 月 17 日",
  },
  {
    id: "demo-4",
    title: "给绿植浇水",
    category: "plants",
    type: "recurring",
    assignee: "共同",
    assigneeMode: "shared",
    dueDate: DEMO_WEEK[6],
    status: "pending",
    recurrence: "每周",
    recurrenceRule: { kind: "weekly", interval: 1 },
    lastCompleted: "8 月 9 日",
    nextDue: "明天",
  },
  {
    id: "demo-5",
    title: "清洁洗衣机滤网",
    category: "laundry",
    type: "recurring",
    assignee: "Nicole",
    assigneeId: "nicole",
    assigneeMode: "member",
    dueDate: DEMO_WEEK[0],
    status: "completed",
    recurrence: "每月",
    recurrenceRule: { kind: "monthly", interval: 1 },
    completedAt: `${DEMO_WEEK[0]}T18:15:00-05:00`,
    note: "已冲洗并晾干。",
    lastCompleted: "周一",
    nextDue: "9 月 10 日",
  },
  {
    id: "demo-6",
    title: "整理冰箱过期食材",
    category: "kitchen",
    type: "recurring",
    assignee: "共同",
    assigneeMode: "shared",
    dueDate: DEMO_WEEK[3],
    status: "completed",
    recurrence: "每周",
    recurrenceRule: { kind: "weekly", interval: 1 },
    completedAt: `${DEMO_WEEK[3]}T20:20:00-05:00`,
    note: "下周少买一盒牛奶。",
    lastCompleted: "周四",
    nextDue: "8 月 20 日",
  },
  {
    id: "demo-7",
    title: "预约年度体检",
    category: "admin",
    type: "one_off",
    assignee: "伴侣",
    assigneeId: "partner",
    assigneeMode: "member",
    dueDate: DEMO_WEEK[1],
    status: "completed",
    completedAt: `${DEMO_WEEK[2]}T09:30:00-05:00`,
    note: "约在 9 月 3 日上午。",
  },
  {
    id: "demo-8",
    title: "更换空调滤芯",
    category: "repair",
    type: "recurring",
    assignee: "共同",
    assigneeMode: "shared",
    dueDate: addDays(DEMO_TODAY, 9),
    status: "pending",
    recurrence: "每 90 天",
    recurrenceRule: { kind: "interval_days", interval: 90 },
    lastCompleted: "5 月 26 日",
    nextDue: "8 月 24 日",
  },
];

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  bedroom: BedDouble,
  laundry: WashingMachine,
  pet: PawPrint,
  plants: Droplets,
  admin: Building2,
  repair: Wrench,
  kitchen: Home,
  home: Sparkles,
};

const NAV_ITEMS: Array<{ id: ViewKey; label: string; icon: LucideIcon }> = [
  { id: "week", label: "本周", icon: Home },
  { id: "calendar", label: "月历", icon: CalendarDays },
  { id: "tasks", label: "全部事项", icon: LayoutList },
  { id: "settings", label: "设置", icon: Settings },
];

function formatShortDate(value: string) {
  const date = new Date(`${value}T12:00:00`);
  return `${date.getMonth() + 1} 月 ${date.getDate()} 日`;
}

function initials(name: string) {
  return name.trim().slice(0, 1).toUpperCase();
}

function isOverdue(task: AppTask) {
  return task.status === "pending" && task.dueDate < DEMO_TODAY;
}

function taskStatus(task: AppTask) {
  if (task.status === "completed") return "completed";
  if (task.status === "skipped") return "skipped";
  if (task.dueDate === DEMO_TODAY) return "today";
  if (isOverdue(task)) return "overdue";
  return "pending";
}

export function HomeTogetherApp() {
  const configured = isSupabaseConfigured();
  const [authReady, setAuthReady] = useState(!configured);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    const supabase = getSupabaseClient();
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setAuthReady(true);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthReady(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  if (!authReady) return <LoadingScreen />;
  if (configured && !session) return <AuthScreen />;
  return <HouseholdLoader isDemo={!configured} session={session} />;
}

function LoadingScreen() {
  return (
    <main className="loading-screen" aria-live="polite">
      <div className="brand-mark"><Heart aria-hidden="true" /></div>
      <p>正在整理今天的家事…</p>
    </main>
  );
}

function AuthScreen() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function sendMagicLink(event: FormEvent) {
    event.preventDefault();
    const supabase = getSupabaseClient();
    if (!supabase) return;
    setBusy(true);
    setMessage("");
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.href.split(/[?#]/)[0] },
    });
    setBusy(false);
    setMessage(error ? error.message : "登录链接已经发到邮箱，请在同一设备打开。🌿");
  }

  return (
    <main className="auth-screen">
      <section className="auth-card">
        <div className="brand-lockup">
          <div className="brand-mark"><Heart aria-hidden="true" /></div>
          <div><strong>HOME TOGETHER</strong><span>把家里的事，温柔地放在一起</span></div>
        </div>
        <div className="auth-illustration" aria-hidden="true">
          <span className="house-shape"><Heart /></span>
          <span className="plant-shape"><Droplets /></span>
        </div>
        <h1>欢迎回家</h1>
        <p>输入邮箱，我们会发一封无需密码的安全登录链接。</p>
        <form onSubmit={sendMagicLink} className="auth-form">
          <label htmlFor="email">邮箱</label>
          <div className="input-with-icon"><Mail aria-hidden="true" /><input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} placeholder="you@example.com" /></div>
          <button className="primary-button wide" disabled={busy}>{busy ? "正在发送…" : "发送登录链接"}</button>
        </form>
        {message && <p className="form-message" role="status">{message}</p>}
        <p className="tiny-copy">继续即表示你同意在家庭成员之间共享任务与完成记录。</p>
      </section>
    </main>
  );
}

function HouseholdLoader({ isDemo, session }: { isDemo: boolean; session: Session | null }) {
  const [snapshot, setSnapshot] = useState<HouseholdSnapshot | null>(null);
  const [loading, setLoading] = useState(!isDemo);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (isDemo) return;
    try {
      const data = await loadHouseholdSnapshot();
      setSnapshot(data);
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "数据加载失败");
    } finally {
      setLoading(false);
    }
  }, [isDemo]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!snapshot?.householdId) return;
    const channel = subscribeToHousehold(snapshot.householdId, () => void refresh());
    return () => { if (channel) void getSupabaseClient()?.removeChannel(channel); };
  }, [snapshot?.householdId, refresh]);

  if (loading) return <LoadingScreen />;
  if (!isDemo && !snapshot) return <OnboardingScreen onDone={refresh} error={error} />;

  return (
    <AppShell
      isDemo={isDemo}
      snapshot={snapshot}
      session={session}
      refresh={refresh}
      loadError={error}
    />
  );
}

function OnboardingScreen({ onDone, error }: { onDone: () => Promise<void>; error: string }) {
  const [mode, setMode] = useState<"create" | "join">("create");
  const [value, setValue] = useState("我们的家");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState(error);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      if (mode === "create") await createHousehold(value);
      else await joinHousehold(value);
      await onDone();
    } catch (caught) {
      setMessage(caught instanceof Error ? caught.message : "暂时无法完成，请重试");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-screen">
      <section className="auth-card onboarding-card">
        <div className="brand-mark"><Heart aria-hidden="true" /></div>
        <h1>{mode === "create" ? "先给这个家起个名字" : "加入伴侣的家庭"}</h1>
        <p>{mode === "create" ? "创建后可以生成邀请码，邀请另一位成员加入。" : "输入对方分享给你的 8 位邀请码。"}</p>
        <div className="segmented-control">
          <button className={mode === "create" ? "active" : ""} onClick={() => { setMode("create"); setValue("我们的家"); }}>创建家庭</button>
          <button className={mode === "join" ? "active" : ""} onClick={() => { setMode("join"); setValue(""); }}>使用邀请码</button>
        </div>
        <form onSubmit={submit} className="auth-form">
          <label htmlFor="household-value">{mode === "create" ? "家庭名称" : "邀请码"}</label>
          <input id="household-value" required value={value} onChange={(event) => setValue(event.target.value)} maxLength={mode === "create" ? 60 : 8} />
          <button className="primary-button wide" disabled={busy}>{busy ? "请稍候…" : mode === "create" ? "创建并进入" : "加入家庭"}</button>
        </form>
        {message && <p className="form-message error" role="alert">{message}</p>}
      </section>
    </main>
  );
}

function AppShell({
  isDemo,
  snapshot,
  session,
  refresh,
  loadError,
}: {
  isDemo: boolean;
  snapshot: HouseholdSnapshot | null;
  session: Session | null;
  refresh: () => Promise<void>;
  loadError: string;
}) {
  const [view, setView] = useState<ViewKey>("week");
  const [tasks, setTasks] = useState<AppTask[]>(isDemo ? DEMO_TASKS : snapshot?.tasks ?? []);
  const [showAdd, setShowAdd] = useState(false);
  const [noteTarget, setNoteTarget] = useState<AppTask | null>(null);
  const [detailTarget, setDetailTarget] = useState<AppTask | null>(null);
  const [toast, setToast] = useState("");

  useEffect(() => {
    if (isDemo || !snapshot) return;
    const timer = window.setTimeout(() => setTasks(snapshot.tasks), 0);
    return () => window.clearTimeout(timer);
  }, [isDemo, snapshot]);
  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(""), 3600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const members = isDemo ? DEMO_MEMBERS : snapshot?.members ?? [];
  const householdName = isDemo ? "Nicole 的家" : snapshot?.householdName ?? "我们的家";

  async function toggleTask(task: AppTask) {
    const completing = task.status !== "completed";
    const nextStatus: AppTask["status"] = completing ? "completed" : "pending";
    setTasks((current) => current.map((item) => item.id === task.id ? { ...item, status: nextStatus, completedAt: completing ? new Date().toISOString() : undefined } : item));
    setDetailTarget((current) => current?.id === task.id ? { ...current, status: nextStatus } : current);
    if (completing) {
      setNoteTarget({ ...task, status: "completed" });
      setToast("完成啦，家里又轻松了一点 ✨");
    } else {
      setToast("已撤销完成，任务回到待办");
    }

    if (!isDemo) {
      try {
        if (completing) await completeTaskRecord(task.id);
        else await undoTaskCompletion(task.id);
        await refresh();
      } catch (caught) {
        setTasks((current) => current.map((item) => item.id === task.id ? task : item));
        setToast(caught instanceof Error ? caught.message : "保存失败，已恢复原状态");
      }
    }
  }

  async function saveNote(note: string) {
    if (!noteTarget) return;
    setTasks((current) => current.map((item) => item.id === noteTarget.id ? { ...item, note } : item));
    if (!isDemo) {
      try { await updateCompletionNote(noteTarget.id, note); }
      catch { setToast("备注暂时没有保存，请稍后重试"); }
    }
    setNoteTarget(null);
    setToast(note ? "完成备注已保存" : "已完成，没有添加备注");
  }

  async function addTask(task: AppTask) {
    setTasks((current) => [...current, task]);
    setShowAdd(false);
    setToast("新事项已加入，一起慢慢完成 🌿");
    if (!isDemo && snapshot) {
      try {
        await createTaskRecord(snapshot.householdId, task);
        await refresh();
      } catch (caught) {
        setTasks((current) => current.filter((item) => item.id !== task.id));
        setToast(caught instanceof Error ? caught.message : "创建失败，请重试");
      }
    }
  }

  return (
    <div className="app-frame">
      <aside className="sidebar">
        <div className="brand-lockup compact">
          <div className="brand-mark"><Heart aria-hidden="true" /></div>
          <div><strong>HOME TOGETHER</strong><span>{householdName}</span></div>
        </div>
        <nav className="side-nav" aria-label="主要导航">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)} aria-current={view === id ? "page" : undefined}>
              <Icon aria-hidden="true" /><span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-home-card">
          <span className="mini-home"><Home /></span>
          <div><strong>本周一起完成</strong><span>{tasks.filter((task) => task.status === "completed" && DEMO_WEEK.includes(task.dueDate)).length} 件事</span></div>
          <Heart className="soft-heart" />
        </div>
        <div className="sidebar-members"><Avatar name={members[0]?.displayName ?? "我"} /><Avatar name={members[1]?.displayName ?? "伴侣"} /><span>共享同一份清单</span></div>
      </aside>

      <main className="main-content">
        <header className="mobile-header">
          <div className="brand-lockup compact"><div className="brand-mark"><Heart /></div><div><strong>HOME TOGETHER</strong><span>{householdName}</span></div></div>
          <button className="icon-button" aria-label="打开菜单"><Menu /></button>
        </header>
        {loadError && <div className="inline-alert">{loadError}</div>}
        {view === "week" && <WeekView tasks={tasks} members={members} onToggle={toggleTask} onOpen={setDetailTarget} onAdd={() => setShowAdd(true)} />}
        {view === "calendar" && <CalendarView tasks={tasks} onOpen={setDetailTarget} />}
        {view === "tasks" && <AllTasksView tasks={tasks} onToggle={toggleTask} onOpen={setDetailTarget} onAdd={() => setShowAdd(true)} />}
        {view === "settings" && <SettingsView isDemo={isDemo} snapshot={snapshot} session={session} members={members} />}
      </main>

      <nav className="bottom-nav" aria-label="移动端导航">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button key={id} className={view === id ? "active" : ""} onClick={() => setView(id)}><Icon /><span>{label}</span></button>
        ))}
      </nav>

      {view !== "settings" && <button className="floating-add" onClick={() => setShowAdd(true)} aria-label="添加事项"><Plus /></button>}
      {showAdd && <AddTaskModal members={members} onClose={() => setShowAdd(false)} onSave={addTask} />}
      {noteTarget && <CompletionSheet task={noteTarget} onClose={() => setNoteTarget(null)} onSave={saveNote} />}
      {detailTarget && <TaskDetail task={tasks.find((task) => task.id === detailTarget.id) ?? detailTarget} onClose={() => setDetailTarget(null)} onToggle={toggleTask} />}
      {toast && <div className="toast" role="status"><Check />{toast}</div>}
    </div>
  );
}

function WeekView({ tasks, members, onToggle, onOpen, onAdd }: { tasks: AppTask[]; members: HouseholdMember[]; onToggle: (task: AppTask) => void; onOpen: (task: AppTask) => void; onAdd: () => void }) {
  const weekTasks = tasks.filter((task) => DEMO_WEEK.includes(task.dueDate));
  const completed = weekTasks.filter((task) => task.status === "completed").length;
  const focusTasks = weekTasks.filter((task) => task.status === "pending" && task.dueDate <= DEMO_TODAY);
  const progress = weekTasks.length ? Math.round((completed / weekTasks.length) * 100) : 0;

  return (
    <div className="page-shell week-page">
      <section className="page-heading week-heading">
        <div>
          <p className="eyebrow">{formatShortDate(DEMO_WEEK[0])} — {formatShortDate(DEMO_WEEK[6])}</p>
          <h1>这周，我们一起把家照顾好</h1>
          <p className="heading-copy">今天可以先处理 {focusTasks.length} 件事，其他的慢慢来。</p>
        </div>
        <div className="heading-actions"><button className="icon-button" aria-label="上一周"><ChevronLeft /></button><button className="subtle-button">回到本周</button><button className="icon-button" aria-label="下一周"><ChevronRight /></button></div>
      </section>

      <section className="progress-card">
        <div className="progress-copy"><span className="progress-icon"><Sparkles /></span><div><strong>已经一起完成 {completed} 件事</strong><span>做得很好，剩下的不用着急</span></div></div>
        <div className="progress-visual"><span>{progress}%</span><div className="progress-track"><i style={{ width: `${progress}%` }} /></div><span>{completed}/{weekTasks.length}</span></div>
        <div className="member-stack">{members.slice(0, 2).map((member) => <Avatar key={member.id} name={member.displayName} />)}</div>
      </section>

      <section className="today-section">
        <div className="section-heading"><div><span className="section-dot coral" /><div><h2>今天可以处理</h2><p>今日到期和需要补上的事项</p></div></div><span className="count-pill">{focusTasks.length}</span></div>
        <div className="task-list prominent-list">
          {focusTasks.length ? focusTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} />) : <EmptyState message="今天没有着急的事项，可以轻松一点。" />}
        </div>
      </section>

      <section className="week-schedule">
        <div className="section-heading"><div><span className="section-dot mauve" /><div><h2>本周安排</h2><p>按日期查看家里的节奏</p></div></div><button className="text-button" onClick={onAdd}><Plus />快速添加</button></div>
        <div className="day-groups">
          {DEMO_WEEK.map((date, index) => {
            const dayTasks = weekTasks.filter((task) => task.dueDate === date && !(task.status === "pending" && date <= DEMO_TODAY));
            if (!dayTasks.length && date !== DEMO_TODAY) return null;
            return (
              <div className={`day-group ${date === DEMO_TODAY ? "current" : ""}`} key={date}>
                <div className="day-label"><span>{WEEK_LABELS[index]}</span><strong>{new Date(`${date}T12:00:00`).getDate()}</strong>{date === DEMO_TODAY && <em>今天</em>}</div>
                <div className="task-list">{dayTasks.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} compact />)}</div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function TaskRow({ task, onToggle, onOpen, compact = false }: { task: AppTask; onToggle: (task: AppTask) => void; onOpen: (task: AppTask) => void; compact?: boolean }) {
  const Icon = CATEGORY_ICONS[task.category] ?? Sparkles;
  const state = taskStatus(task);
  const timing = state === "overdue" ? `已经晚了 ${Math.max(1, Math.round((new Date(DEMO_TODAY).getTime() - new Date(task.dueDate).getTime()) / 86400000))} 天` : task.dueDate === DEMO_TODAY ? "今天" : formatShortDate(task.dueDate);
  return (
    <div
      className={`task-row ${state} ${compact ? "compact" : ""}`}
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(event) => { if (event.key === "Enter" || event.key === " ") onOpen(task); }}
    >
      <button className="task-check" onClick={(event) => { event.stopPropagation(); onToggle(task); }} aria-label={task.status === "completed" ? `撤销完成：${task.title}` : `完成：${task.title}`}><Check /></button>
      <span className="task-icon"><Icon aria-hidden="true" /></span>
      <div className="task-main"><div className="task-title-line"><h3>{task.title}</h3>{task.type === "recurring" && <span className="type-pill"><Repeat2 />周期</span>}</div><div className="task-meta"><span className={state === "overdue" ? "overdue-copy" : ""}><Clock3 />{timing}</span><span className="assignee-chip"><Avatar name={task.assignee} small />{task.assignee}</span>{task.recurrence && <span>{task.recurrence}</span>}</div>{task.note && !compact && <p className="task-note">“{task.note}”</p>}</div>
      <button className="more-button" aria-label={`查看 ${task.title} 详情`}><MoreHorizontal /></button>
    </div>
  );
}

function CalendarView({ tasks, onOpen }: { tasks: AppTask[]; onOpen: (task: AppTask) => void }) {
  const [selectedDate, setSelectedDate] = useState(DEMO_TODAY);
  const [memberFilter, setMemberFilter] = useState("全部成员");
  const [typeFilter, setTypeFilter] = useState("全部类型");
  const filtered = tasks.filter((task) => (memberFilter === "全部成员" || task.assignee === memberFilter || task.assignee === "共同") && (typeFilter === "全部类型" || (typeFilter === "周期家务" ? task.type === "recurring" : task.type === "one_off")));
  const monthPrefix = DEMO_TODAY.slice(0, 7);
  const [year, month] = monthPrefix.split("-").map(Number);
  const daysInMonth = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const firstWeekday = (new Date(Date.UTC(year, month - 1, 1)).getUTCDay() + 6) % 7;
  const calendarCellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
  const monthTasks = filtered.filter((task) => task.dueDate.startsWith(monthPrefix));
  const days = Array.from({ length: calendarCellCount }, (_, index) => index - firstWeekday + 1).map((day) => day > 0 && day <= daysInMonth ? `${monthPrefix}-${String(day).padStart(2, "0")}` : null);
  const selectedTasks = filtered.filter((task) => task.dueDate === selectedDate || task.completedAt?.slice(0, 10) === selectedDate);
  const completed = monthTasks.filter((task) => task.status === "completed").length;
  const overdue = monthTasks.filter(isOverdue).length;

  return (
    <div className="page-shell calendar-page">
      <section className="page-heading"><div><p className="eyebrow">家庭回顾</p><h1>月历</h1><p className="heading-copy">看看这个月，家里发生了哪些小小的完成。</p></div><div className="heading-actions"><button className="icon-button"><ChevronLeft /></button><button className="subtle-button">{year} 年 {month} 月</button><button className="icon-button"><ChevronRight /></button></div></section>
      <section className="month-stats"><div><span className="stat-icon mint"><Check /></span><p><strong>{completed}</strong><span>已完成</span></p></div><div><span className="stat-icon lavender"><Clock3 /></span><p><strong>{Math.max(0, completed - 1)}</strong><span>按时完成</span></p></div><div><span className="stat-icon coral"><Bell /></span><p><strong>{overdue}</strong><span>待补上</span></p></div></section>
      <section className="calendar-toolbar"><div className="filter-group"><select value={memberFilter} onChange={(event) => setMemberFilter(event.target.value)} aria-label="按成员筛选"><option>全部成员</option><option>Nicole</option><option>伴侣</option></select><select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)} aria-label="按类型筛选"><option>全部类型</option><option>周期家务</option><option>一次性家事</option></select></div><div className="calendar-legend"><span><i className="mint" />完成</span><span><i className="mauve" />待办</span><span><i className="coral" />逾期</span></div></section>
      <div className="calendar-layout">
        <section className="calendar-card">
          <div className="calendar-weekdays">{WEEK_LABELS.map((day) => <span key={day}>{day}</span>)}</div>
          <div className="calendar-grid">
            {days.map((date, index) => {
              if (!date) return <span className="calendar-day outside" key={`outside-${index}`} />;
              const dateTasks = filtered.filter((task) => task.dueDate === date || task.completedAt?.slice(0, 10) === date);
              return <button key={date} className={`calendar-day ${date === selectedDate ? "selected" : ""} ${date === DEMO_TODAY ? "today" : ""}`} onClick={() => setSelectedDate(date)}><span>{Number(date.slice(-2))}</span><div className="date-dots">{dateTasks.slice(0, 3).map((task) => <i key={task.id} className={taskStatus(task) === "completed" ? "mint" : taskStatus(task) === "overdue" ? "coral" : "mauve"} />)}</div></button>;
            })}
          </div>
        </section>
        <aside className="date-drawer"><div className="drawer-date"><span>{month} 月</span><strong>{Number(selectedDate.slice(-2))}</strong><em>{selectedDate === DEMO_TODAY ? "今天" : WEEK_LABELS[(new Date(`${selectedDate}T12:00:00`).getDay() + 6) % 7]}</em></div><div className="drawer-section-title"><h2>这一天的家事</h2><span>{selectedTasks.length}</span></div><div className="drawer-tasks">{selectedTasks.length ? selectedTasks.map((task) => <button key={task.id} onClick={() => onOpen(task)}><span className={`drawer-status ${taskStatus(task)}`}><Check /></span><div><strong>{task.title}</strong><span>{task.status === "completed" ? task.completedAt?.slice(0, 10) === task.dueDate ? "按时完成" : "补做完成" : isOverdue(task) ? "等待补上" : "计划事项"}</span>{task.note && <small>{task.note}</small>}</div></button>) : <EmptyState message="这一天没有安排，留给生活一点空白。" />}</div></aside>
      </div>
    </div>
  );
}

function AllTasksView({ tasks, onToggle, onOpen, onAdd }: { tasks: AppTask[]; onToggle: (task: AppTask) => void; onOpen: (task: AppTask) => void; onAdd: () => void }) {
  const [tab, setTab] = useState<"recurring" | "one_off" | "archived">("recurring");
  const [query, setQuery] = useState("");
  const visible = tasks.filter((task) => tab === "archived" ? false : task.type === tab).filter((task) => task.title.includes(query));
  return (
    <div className="page-shell all-tasks-page">
      <section className="page-heading"><div><p className="eyebrow">家庭清单</p><h1>全部事项</h1><p className="heading-copy">长期节奏和临时小事，都在这里看得清楚。</p></div><button className="primary-button" onClick={onAdd}><Plus />添加事项</button></section>
      <div className="task-tools"><div className="segmented-control tabs"><button className={tab === "recurring" ? "active" : ""} onClick={() => setTab("recurring")}>周期家务 <span>{tasks.filter((task) => task.type === "recurring").length}</span></button><button className={tab === "one_off" ? "active" : ""} onClick={() => setTab("one_off")}>一次性家事 <span>{tasks.filter((task) => task.type === "one_off").length}</span></button><button className={tab === "archived" ? "active" : ""} onClick={() => setTab("archived")}>已归档</button></div><label className="search-box"><Search /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索事项" /><span className="sr-only">搜索事项</span></label></div>
      {tab === "recurring" && <div className="list-summary"><div><Repeat2 /><p><strong>让家务有自己的节奏</strong><span>完成后会根据实际日期计算下一次。</span></p></div><span>{visible.filter((task) => task.status === "pending").length} 项待处理</span></div>}
      <section className="catalog-list">{visible.length ? visible.map((task) => <TaskRow key={task.id} task={task} onToggle={onToggle} onOpen={onOpen} />) : <EmptyState message={tab === "archived" ? "这里还没有归档事项。" : "没有找到符合条件的事项。"} />}</section>
    </div>
  );
}

function SettingsView({ isDemo, snapshot, session, members }: { isDemo: boolean; snapshot: HouseholdSnapshot | null; session: Session | null; members: HouseholdMember[] }) {
  const [inviteCode, setInviteCode] = useState(isDemo ? "NICOLE26" : "");
  const [copied, setCopied] = useState(false);
  const [weekStart, setWeekStart] = useState("monday");
  const [theme, setTheme] = useState("system");
  const [message, setMessage] = useState("");

  async function generateInvite() {
    if (isDemo) { setInviteCode("NICOLE26"); return; }
    if (!snapshot) return;
    try { setInviteCode(await createInvite(snapshot.householdId)); }
    catch (caught) { setMessage(caught instanceof Error ? caught.message : "暂时无法生成邀请码"); }
  }

  async function copyInvite() {
    if (!inviteCode) await generateInvite();
    const value = inviteCode || "NICOLE26";
    await navigator.clipboard?.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  async function signOut() { await getSupabaseClient()?.auth.signOut(); }

  return (
    <div className="page-shell settings-page">
      <section className="page-heading"><div><p className="eyebrow">我们的家</p><h1>设置</h1><p className="heading-copy">成员、时间和偏好，都可以慢慢调整。</p></div><span className={`connection-pill ${isDemo ? "demo" : "live"}`}>{isDemo ? <WifiOff /> : <Wifi />}{isDemo ? "演示模式" : "已连接 Supabase"}</span></section>
      <div className="settings-grid">
        <section className="settings-card"><div className="settings-card-heading"><span className="setting-icon mauve"><CircleUserRound /></span><div><h2>家庭成员</h2><p>双方拥有完整协作权限</p></div></div><div className="member-list">{members.map((member, index) => <div key={member.id}><Avatar name={member.displayName} /><p><strong>{member.displayName}</strong><span>{index === 0 ? session?.user.email ?? "家庭管理员" : "家庭成员"}</span></p><span className="role-pill">{index === 0 ? "你" : "成员"}</span></div>)}</div><div className="invite-box"><div><UserPlus /><p><strong>邀请伴侣加入</strong><span>邀请码 7 天内有效，仅可使用一次。</span></p></div>{inviteCode ? <div className="invite-code"><strong>{inviteCode}</strong><button onClick={copyInvite}>{copied ? <Check /> : <Copy />}{copied ? "已复制" : "复制"}</button></div> : <button className="secondary-button" onClick={generateInvite}>生成邀请码</button>}</div></section>
        <section className="settings-card"><div className="settings-card-heading"><span className="setting-icon lavender"><CalendarDays /></span><div><h2>日期与时间</h2><p>决定周视图和日期边界</p></div></div><div className="setting-row"><div><strong>每周从哪天开始</strong><span>影响本周分组与月历排列</span></div><select aria-label="每周开始日" value={weekStart} onChange={(event) => setWeekStart(event.target.value)}><option value="monday">周一</option><option value="sunday">周日</option></select></div><div className="setting-row"><div><strong>家庭时区</strong><span>完成时间统一保存，按此时区显示</span></div><span className="value-chip">{snapshot?.timezone ?? "America/Chicago"}</span></div></section>
        <section className="settings-card"><div className="settings-card-heading"><span className="setting-icon mint"><Sun /></span><div><h2>外观</h2><p>选择更舒服的阅读方式</p></div></div><div className="theme-options"><button className={theme === "light" ? "active" : ""} onClick={() => setTheme("light")}><Sun />浅色</button><button className={theme === "system" ? "active" : ""} onClick={() => setTheme("system")}><Sparkles />跟随系统</button><button className={theme === "dark" ? "active" : ""} onClick={() => setTheme("dark")}><Moon />深色</button></div><div className="toggle-row"><div><strong>轻量庆祝动效</strong><span>完成任务时显示不超过 500ms</span></div><input aria-label="轻量庆祝动效" type="checkbox" defaultChecked /><i /></div></section>
        <section className="settings-card"><div className="settings-card-heading"><span className="setting-icon cream"><Bell /></span><div><h2>提醒</h2><p>这个功能会在后续版本开放</p></div></div><div className="coming-soon"><Bell /><div><strong>每日摘要与到期提醒</strong><span>现在先保持安静，需要时再打开。</span></div><span>P2</span></div></section>
      </div>
      {isDemo && <div className="demo-callout"><WifiOff /><div><strong>你正在使用可操作的演示数据</strong><span>配置 Supabase 环境变量并执行 schema.sql 后，登录、双人同步和行级权限会自动启用。</span></div></div>}
      {!isDemo && <button className="sign-out-button" onClick={signOut}><LogOut />退出登录</button>}
      {message && <p className="form-message error">{message}</p>}
    </div>
  );
}

function AddTaskModal({ members, onClose, onSave }: { members: HouseholdMember[]; onClose: () => void; onSave: (task: AppTask) => void }) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<AppTask["type"]>("one_off");
  const [date, setDate] = useState(DEMO_TODAY);
  const [assignee, setAssignee] = useState("shared");
  const [interval, setInterval] = useState(14);

  function submit(event: FormEvent) {
    event.preventDefault();
    const selected = members.find((member) => member.id === assignee);
    const shared = assignee === "shared";
    onSave({
      id: `new-${Date.now()}`,
      title: title.trim(),
      category: "home",
      type,
      assignee: shared ? "共同" : selected?.displayName ?? "未分配",
      assigneeId: selected?.id ?? null,
      assigneeMode: shared ? "shared" : selected ? "member" : "unassigned",
      dueDate: date,
      status: "pending",
      recurrence: type === "recurring" ? `每 ${interval} 天` : undefined,
      recurrenceRule: type === "recurring" ? { kind: "interval_days", interval, keep_schedule: false } : null,
    });
  }

  return (
    <div className="modal-backdrop">
      <section className="modal-card add-modal" role="dialog" aria-modal="true" aria-labelledby="add-title">
        <div className="modal-heading"><div><span className="modal-icon"><Plus /></span><div><p>快速添加</p><h2 id="add-title">家里有什么要做？</h2></div></div><button className="icon-button" onClick={onClose} aria-label="关闭"><X /></button></div>
        <form onSubmit={submit}>
          <label className="field"><span>事项名称</span><input required maxLength={80} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="例如：联系物业" /></label>
          <div className="field"><span>类型</span><div className="type-picker"><button type="button" className={type === "one_off" ? "active" : ""} onClick={() => setType("one_off")}><ClipboardCheck />一次性家事<small>完成后不再重复</small></button><button type="button" className={type === "recurring" ? "active" : ""} onClick={() => setType("recurring")}><Repeat2 />周期家务<small>按节奏自动出现</small></button></div></div>
          <div className="form-grid"><label className="field"><span>计划日期</span><input type="date" required value={date} onChange={(event) => setDate(event.target.value)} /></label><label className="field"><span>负责人</span><select value={assignee} onChange={(event) => setAssignee(event.target.value)}><option value="shared">共同</option>{members.map((member) => <option key={member.id} value={member.id}>{member.displayName}</option>)}<option value="unassigned">未分配</option></select></label></div>
          {type === "recurring" && <label className="field recurrence-field"><span>重复节奏</span><div><span>每</span><input type="number" min={1} max={365} value={interval} onChange={(event) => setInterval(Number(event.target.value))} /><span>天一次</span></div><small>默认从实际完成日重新计算下一次。</small></label>}
          <div className="modal-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button className="primary-button"><Plus />加入清单</button></div>
        </form>
      </section>
    </div>
  );
}

function CompletionSheet({ task, onClose, onSave }: { task: AppTask; onClose: () => void; onSave: (note: string) => void }) {
  const [note, setNote] = useState(task.note ?? "");
  return (
    <div className="modal-backdrop celebration-backdrop">
      <section className="completion-sheet" role="dialog" aria-modal="true" aria-labelledby="complete-title">
        <div className="celebration-burst" aria-hidden="true"><Sparkles /><Heart /><Sparkles /></div>
        <button className="icon-button close-sheet" onClick={onClose} aria-label="关闭"><X /></button>
        <span className="complete-check"><Check /></span>
        <p>完成啦</p><h2 id="complete-title">{task.title}</h2><span className="completion-meta">由你完成 · 刚刚</span>
        <label className="field note-field"><span>留一句完成备注 <em>可选</em></span><textarea value={note} onChange={(event) => setNote(event.target.value)} maxLength={500} placeholder="例如：滤芯快用完了，下次记得补充" /></label>
        <div className="modal-actions"><button className="secondary-button" onClick={() => onSave("")}>跳过备注</button><button className="primary-button" onClick={() => onSave(note)}>保存备注</button></div>
      </section>
    </div>
  );
}

function TaskDetail({ task, onClose, onToggle }: { task: AppTask; onClose: () => void; onToggle: (task: AppTask) => void }) {
  const Icon = CATEGORY_ICONS[task.category] ?? Sparkles;
  return (
    <div className="detail-backdrop">
      <aside className="detail-panel" role="dialog" aria-modal="true" aria-labelledby="detail-title">
        <div className="detail-top"><span className="task-icon large"><Icon /></span><button className="icon-button" onClick={onClose} aria-label="关闭详情"><X /></button></div>
        <div className="detail-title"><p>{task.type === "recurring" ? "周期家务" : "一次性家事"}</p><h2 id="detail-title">{task.title}</h2><span className={`status-label ${taskStatus(task)}`}>{task.status === "completed" ? "已完成" : isOverdue(task) ? "等待补上" : task.dueDate === DEMO_TODAY ? "今天" : "待办"}</span></div>
        {task.description && <p className="detail-description">{task.description}</p>}
        <div className="detail-facts"><div><Clock3 /><span>计划日期</span><strong>{formatShortDate(task.dueDate)}</strong></div><div><CircleUserRound /><span>负责人</span><strong>{task.assignee}</strong></div>{task.recurrence && <div><Repeat2 /><span>重复规则</span><strong>{task.recurrence}</strong></div>}</div>
        {task.type === "recurring" && <section className="rhythm-card"><h3>这个事项的节奏</h3><div><p><span>上次完成</span><strong>{task.lastCompleted ?? "还没有记录"}</strong></p><i /><p><span>下次应做</span><strong>{task.nextDue ?? formatShortDate(task.dueDate)}</strong></p></div><small>提前完成后，默认从实际完成日重新计算。</small></section>}
        <section className="history-section"><h3>最近记录</h3>{task.status === "completed" ? <div className="history-item"><span><Check /></span><div><strong>{task.completedAt ? formatShortDate(task.completedAt.slice(0, 10)) : "今天"} 完成</strong><p>{task.note || "没有添加备注"}</p></div></div> : <EmptyState message="完成后会在这里留下记录。" />}</section>
        <div className="detail-actions"><button className={task.status === "completed" ? "secondary-button wide" : "primary-button wide"} onClick={() => onToggle(task)}>{task.status === "completed" ? "撤销完成" : <><Check />标记完成</>}</button></div>
      </aside>
    </div>
  );
}

function Avatar({ name, small = false }: { name: string; small?: boolean }) {
  const tone = name === "Nicole" ? "rose" : name === "共同" ? "shared" : "lavender";
  return <span className={`avatar ${tone} ${small ? "small" : ""}`} aria-label={name}>{name === "共同" ? <Heart /> : initials(name)}</span>;
}

function EmptyState({ message }: { message: string }) {
  return <div className="empty-state"><span><Heart /></span><p>{message}</p></div>;
}
