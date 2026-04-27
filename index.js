const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("Student Budget API is running");
});

//DATA
let goals = [];
let weeks = [];

let goalId = 1;
let weekId = 1;

// GET all weeks
app.get("/weeks", (req, res) => {
  res.json(weeks);
});

// CREATE week
app.post("/weeks", (req, res) => {
  const { weekLabel, allowance, spent, saveTarget } = req.body;

  if (!weekLabel)
    return res.status(400).json({ error: "Week label required" });

  if (!Number.isFinite(allowance) || allowance <= 0)
    return res.status(400).json({ error: "Invalid allowance" });

  if (!Number.isFinite(spent) || spent < 0 || spent > allowance)
    return res.status(400).json({ error: "Invalid spent" });

  const saved = allowance - spent;
  const metTarget = saved >= saveTarget;

  const week = {
    id: weekId++,
    weekLabel,
    allowance,
    spent,
    saved,
    saveTarget,
    metTarget,
    createdAt: new Date()
  };

  weeks.push(week);
  res.status(201).json(week);
});

// GET all goals
app.get("/goals", (req, res) => {
  res.json(goals);
});

// CREATE goal
app.post("/goals", (req, res) => {
  const { name, targetAmount } = req.body;

  if (!name)
    return res.status(400).json({ error: "Goal name required" });

  if (!Number.isFinite(targetAmount) || targetAmount <= 0)
    return res.status(400).json({ error: "Invalid target amount" });

  const goal = {
    id: goalId++,
    name,
    targetAmount,
    currentAmount: 0,
    remaining: targetAmount,
    progressPercent: 0,
    achieved: false
  };

  goals.push(goal);
  res.status(201).json(goal);
});

// CONTRIBUTE
app.post("/goals/:id/contribute", (req, res) => {
  const id = Number(req.params.id);
  const { amount } = req.body;

  const goal = goals.find(g => g.id === id);
  if (!goal)
    return res.status(404).json({ error: "Goal not found" });

  if (!Number.isFinite(amount) || amount <= 0)
    return res.status(400).json({ error: "Invalid amount" });

  if (goal.achieved)
    return res.status(400).json({ error: "Goal already achieved" });

  goal.currentAmount += amount;

  goal.remaining = Math.max(goal.targetAmount - goal.currentAmount, 0);
  goal.progressPercent = Math.min(
    (goal.currentAmount / goal.targetAmount) * 100,
    100
  );
  goal.achieved = goal.currentAmount >= goal.targetAmount;

  res.json({ message: "Updated", goal });
});

// DELETE goal
app.delete("/goals/:id", (req, res) => {
  const id = Number(req.params.id);

  const before = goals.length;
  goals = goals.filter(g => g.id !== id);

  if (before === goals.length)
    return res.status(404).json({ error: "Goal not found" });

  res.json({ message: "Deleted" });
});

//SUMMARY

app.get("/summary/all", (req, res) => {
  const totalWeeks = weeks.length;

  const totalAllowance = weeks.reduce((a, w) => a + w.allowance, 0);
  const totalSpent = weeks.reduce((a, w) => a + w.spent, 0);
  const totalSaved = weeks.reduce((a, w) => a + w.saved, 0);

  const weeksMetTarget = weeks.filter(w => w.metTarget).length;

  res.json({
    totalWeeks,
    totalAllowance,
    totalSpent,
    totalSaved,
    weeksMetTarget,
    weeksMissed: totalWeeks - weeksMetTarget
  });
});

// SERVER
const PORT = process.env.PORT || 3000;

app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);