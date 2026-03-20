const STORAGE_KEY = "taskboard-lite.tasks";

const form = document.querySelector("#task-form");
const taskInput = document.querySelector("#task-input");
const formFeedback = document.querySelector("#form-feedback");
const taskList = document.querySelector("#task-list");
const totalCount = document.querySelector("#total-count");
const openCount = document.querySelector("#open-count");
const doneCount = document.querySelector("#done-count");
const heroOpenCount = document.querySelector("#hero-open-count");
const heroProgress = document.querySelector("#hero-progress");
const heroProgressCopy = document.querySelector("#hero-progress-copy");
const boardSummary = document.querySelector("#board-summary");
const progressBar = document.querySelector("#progress-bar");
const filterButtons = document.querySelectorAll("[data-filter]");
const suggestionButtons = document.querySelectorAll("[data-suggestion]");
const clearCompletedButton = document.querySelector("#clear-completed");

let activeFilter = "all";
let tasks = loadTasks();

function loadTasks() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed)
      ? parsed.filter((task) => task && typeof task.title === "string")
      : [];
  } catch {
    return [];
  }
}

function saveTasks() {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function setFeedback(message, tone = "neutral") {
  formFeedback.textContent = message;
  formFeedback.dataset.tone = tone;
}

function buildTaskId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function formatDate(value) {
  if (!value) {
    return "Created just now";
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function getCounts() {
  const completed = tasks.filter((task) => task.done).length;
  const open = tasks.length - completed;
  return { completed, open, total: tasks.length };
}

function getFilteredTasks() {
  if (activeFilter === "open") {
    return tasks.filter((task) => !task.done);
  }

  if (activeFilter === "done") {
    return tasks.filter((task) => task.done);
  }

  return tasks;
}

function updateStats() {
  const { completed, open, total } = getCounts();
  const progress = total ? Math.round((completed / total) * 100) : 0;

  totalCount.textContent = String(total);
  openCount.textContent = String(open);
  doneCount.textContent = String(completed);
  heroOpenCount.textContent = String(open);
  heroProgress.textContent = `${progress}%`;
  heroProgressCopy.textContent = total
    ? `${completed} completed out of ${total} tasks.`
    : "No completed tasks yet.";
  boardSummary.textContent = total
    ? `${open} open task${open === 1 ? "" : "s"} and ${completed} completed.`
    : "No tasks added yet.";
  progressBar.style.width = `${progress}%`;
}

function renderEmptyState() {
  const messages = {
    all: "Start with the next priority to turn this board into a working queue.",
    open: "Nothing is open right now. The board is fully clear.",
    done: "Complete at least one task to build your finished list.",
  };

  taskList.innerHTML = `
    <li class="empty-state">
      <strong>No tasks in this view</strong>
      <p class="empty-copy">${messages[activeFilter]}</p>
    </li>
  `;
}

function renderTasks() {
  const filteredTasks = getFilteredTasks();

  updateStats();

  if (!filteredTasks.length) {
    renderEmptyState();
    return;
  }

  taskList.innerHTML = filteredTasks
    .map((task) => {
      const safeTitle = escapeHtml(task.title);
      const statusCopy = task.done
        ? `Completed on ${formatDate(task.completedAt)}`
        : `Created ${formatDate(task.createdAt)}`;

      return `
        <li class="task-item ${task.done ? "is-done" : ""}" data-task-id="${task.id}">
          <input
            class="task-toggle"
            type="checkbox"
            ${task.done ? "checked" : ""}
            aria-label="Toggle ${safeTitle}"
          />
          <div>
            <span class="task-title">${safeTitle}</span>
            <span class="task-meta">${statusCopy}</span>
          </div>
          <button class="task-action" type="button">Remove</button>
        </li>
      `;
    })
    .join("");
}

function addTask(title) {
  tasks.unshift({
    id: buildTaskId(),
    title,
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: null,
  });

  saveTasks();
  renderTasks();
}

function toggleTask(taskId) {
  tasks = tasks.map((task) => {
    if (task.id !== taskId) {
      return task;
    }

    const nextDone = !task.done;
    return {
      ...task,
      done: nextDone,
      completedAt: nextDone ? new Date().toISOString() : null,
    };
  });

  saveTasks();
  renderTasks();
}

function removeTask(taskId) {
  tasks = tasks.filter((task) => task.id !== taskId);
  saveTasks();
  renderTasks();
}

function addTaskFromCurrentInput(value) {
  const title = value.trim();

  if (!title) {
    setFeedback("Type a task title before creating it.", "error");
    taskInput.focus();
    return;
  }

  addTask(title);
  taskInput.value = "";
  setFeedback("Task created successfully.", "success");
}

form?.addEventListener("submit", (event) => {
  event.preventDefault();
  addTaskFromCurrentInput(taskInput.value);
});

taskList?.addEventListener("click", (event) => {
  const taskItem = event.target.closest("[data-task-id]");
  if (!taskItem) {
    return;
  }

  const taskId = taskItem.dataset.taskId;

  if (event.target.classList.contains("task-action")) {
    removeTask(taskId);
    setFeedback("Task removed.", "success");
  }
});

taskList?.addEventListener("change", (event) => {
  const taskItem = event.target.closest("[data-task-id]");
  if (!taskItem || !event.target.classList.contains("task-toggle")) {
    return;
  }

  toggleTask(taskItem.dataset.taskId);
});

filterButtons.forEach((button) => {
  button.addEventListener("click", () => {
    activeFilter = button.dataset.filter || "all";

    filterButtons.forEach((item) => {
      item.classList.toggle("is-active", item === button);
    });

    renderTasks();
  });
});

suggestionButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const title = button.dataset.suggestion || "";
    addTaskFromCurrentInput(title);
  });
});

clearCompletedButton?.addEventListener("click", () => {
  const completedTasks = tasks.filter((task) => task.done).length;

  if (!completedTasks) {
    setFeedback("There are no completed tasks to clear.", "error");
    return;
  }

  tasks = tasks.filter((task) => !task.done);
  saveTasks();
  renderTasks();
  setFeedback("Completed tasks cleared.", "success");
});

renderTasks();
