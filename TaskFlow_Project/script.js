const STORAGE_KEY = "taskflow_tasks_v1";
let tasks = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let currentFilter = "all";
let editingId = null;

const $ = (id) => document.getElementById(id);
const form = $("taskForm");
const titleInput = $("taskTitle");
const categoryInput = $("taskCategory");
const dueInput = $("taskDue");

$("todayDate").textContent = new Date().toLocaleDateString("en-IN", {
  weekday: "short", day: "numeric", month: "short", year: "numeric"
});

function saveTasks() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  render();
}

function formatDate(date) {
  if (!date) return "No due date";
  return new Date(date + "T00:00:00").toLocaleDateString("en-IN", {
    day: "numeric", month: "short", year: "numeric"
  });
}

function openForm(task = null) {
  editingId = task ? task.id : null;
  $("formTitle").textContent = task ? "Edit task" : "Create a task";
  titleInput.value = task ? task.title : "";
  categoryInput.value = task ? task.category : "Personal";
  dueInput.value = task ? task.dueDate : "";
  form.classList.remove("hidden");
  titleInput.focus();
}
function closeForm() {
  form.classList.add("hidden");
  form.reset();
  editingId = null;
}

$("openFormBtn").addEventListener("click", () => openForm());
$("emptyAddBtn").addEventListener("click", () => openForm());
$("closeFormBtn").addEventListener("click", closeForm);
$("cancelBtn").addEventListener("click", closeForm);

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title) return;
  if (editingId) {
    tasks = tasks.map(task => task.id === editingId
      ? {...task, title, category: categoryInput.value, dueDate: dueInput.value}
      : task);
  } else {
    tasks.unshift({
      id: (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : String(Date.now()),
      title,
      category: categoryInput.value,
      dueDate: dueInput.value,
      completed: false,
      createdAt: new Date().toISOString()
    });
  }
  closeForm();
  saveTasks();
});

function setFilter(filter) {
  currentFilter = filter;
  $("filterSelect").value = filter;
  document.querySelectorAll(".nav").forEach(button =>
    button.classList.toggle("active", button.dataset.filter === filter));
  render();
}
document.querySelectorAll(".nav").forEach(button =>
  button.addEventListener("click", () => setFilter(button.dataset.filter)));
$("filterSelect").addEventListener("change", event => setFilter(event.target.value));
$("searchInput").addEventListener("input", render);

function render() {
  const completed = tasks.filter(task => task.completed).length;
  $("totalCount").textContent = tasks.length;
  $("completedCount").textContent = completed;
  $("pendingCount").textContent = tasks.length - completed;

  const search = $("searchInput").value.trim().toLowerCase();
  const visibleTasks = tasks.filter(task => {
    const matchesFilter = currentFilter === "all" ||
      (currentFilter === "completed" && task.completed) ||
      (currentFilter === "pending" && !task.completed);
    return matchesFilter && task.title.toLowerCase().includes(search);
  });

  $("taskList").innerHTML = "";
  $("emptyState").classList.toggle("hidden", visibleTasks.length > 0);
  if (visibleTasks.length === 0 && (tasks.length > 0 || search)) {
    $("emptyState").querySelector("h3").textContent = "No matching tasks";
    $("emptyState").querySelector("p").textContent = "Try another search or filter.";
    $("emptyAddBtn").classList.add("hidden");
  } else {
    $("emptyState").querySelector("h3").textContent = "No tasks yet";
    $("emptyState").querySelector("p").textContent = "Add your first task and make today productive.";
    $("emptyAddBtn").classList.remove("hidden");
  }

  visibleTasks.forEach(task => {
    const item = document.createElement("article");
    item.className = `task-item ${task.completed ? "done" : ""}`;
    const check = document.createElement("input");
    check.type = "checkbox";
    check.className = "task-check";
    check.checked = task.completed;
    check.setAttribute("aria-label", "Mark task completed");
    check.addEventListener("change", () => {
      tasks = tasks.map(t => t.id === task.id ? {...t, completed: check.checked} : t);
      saveTasks();
    });

    const info = document.createElement("div");
    info.className = "task-info";
    const name = document.createElement("div");
    name.className = "task-name";
    name.textContent = task.title;
    const meta = document.createElement("div");
    meta.className = "task-meta";
    meta.textContent = task.category;
    info.append(name, meta);

    const category = document.createElement("span");
    category.className = "category";
    category.textContent = task.category;
    const due = document.createElement("span");
    due.className = "task-due";
    due.textContent = formatDate(task.dueDate);

    const edit = document.createElement("button");
    edit.className = "icon-btn";
    edit.textContent = "✎";
    edit.title = "Edit task";
    edit.addEventListener("click", () => openForm(task));

    const remove = document.createElement("button");
    remove.className = "icon-btn";
    remove.textContent = "×";
    remove.title = "Delete task";
    remove.addEventListener("click", () => {
      if (confirm(`Delete "${task.title}"?`)) {
        tasks = tasks.filter(t => t.id !== task.id);
        saveTasks();
      }
    });
    item.append(check, info, category, due, edit, remove);
    $("taskList").append(item);
  });
}
render();
