const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const app = express();
const path = require("path");
const fs = require("fs");
const tasksFile = path.join(__dirname, "tasks.json");
const historyFile = path.join(__dirname, "history.json");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
// const tasksFile = path.join(__dirname, "tasks.json");
const completedFile = path.join(__dirname, "completedTasks.json");

// Helper to read JSON
function readJSON(file) {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

// Helper to write JSON
function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

// Home - active tasks list
app.get("/", (req, res) => {
  const tasks = readJSON(tasksFile);
  res.render("index", { tasks });
});

// Add new task
app.post("/add", (req, res) => {
  const tasks = readJSON(tasksFile);
  const newTask = {
    id: tasks.length ? tasks[tasks.length - 1].id + 1 : 1,
    title: req.body.title,
    completedAt: null,
  };
  tasks.push(newTask);
  writeJSON(tasksFile, tasks);
  res.redirect("/");
});

// Edit task form
app.get("/edit/:id", (req, res) => {
  const tasks = readJSON(tasksFile);
  const task = tasks.find((t) => t.id == req.params.id);
  if (!task) return res.send("Task not found");
  res.render("edit", { task });
});

// Update edited task
app.post("/edit/:id", (req, res) => {
  const tasks = readJSON(tasksFile);
  const index = tasks.findIndex((t) => t.id == req.params.id);
  if (index === -1) return res.send("Task not found");

  tasks[index].title = req.body.title;
  writeJSON(tasksFile, tasks);
  res.redirect("/");
});

// Complete a task
app.post("/complete/:id", (req, res) => {
  let tasks = readJSON(tasksFile);
  let completedTasks = readJSON(completedFile);

  const index = tasks.findIndex((t) => t.id == req.params.id);
  if (index === -1) return res.send("Task not found");

  const completedTask = tasks.splice(index, 1)[0];
  completedTask.completedAt = new Date().toISOString();

  completedTasks.push(completedTask);

  writeJSON(tasksFile, tasks);
  writeJSON(completedFile, completedTasks);

  res.redirect("/");
});

// Delete task (from active)
app.post("/delete/:id", (req, res) => {
  let tasks = readJSON(tasksFile);
  tasks = tasks.filter((t) => t.id != req.params.id);
  writeJSON(tasksFile, tasks);
  res.redirect("/");
});

// View completed tasks (history)
app.get("/history", (req, res) => {
  const completedTasks = readJSON(completedFile);
  res.render("history", { completedTasks });
});

// View stats
app.get("/stats", (req, res) => {
  const tasks = readJSON(tasksFile);
  const completedTasks = readJSON(completedFile);

  res.render("stats", {
    totalTasks: tasks.length + completedTasks.length,
    activeCount: tasks.length,
    completedCount: completedTasks.length,
  });
});
module.exports = app;
