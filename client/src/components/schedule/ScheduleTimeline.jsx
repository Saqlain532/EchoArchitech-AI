import React from 'react';
import TodayFocus from './TodayFocus';
import TaskCard from './TaskCard';

export default function ScheduleTimeline({
  tasks = [],
  currentDay = 1,
  totalDays = 14,
  milestone,
}) {
  const completedCount = tasks.filter((t) => t.status === 'Completed').length;
  const currentDayTasks = tasks.filter((t) => (t.dayNumber || 1) === currentDay);

  const focusMilestone = milestone || (currentDayTasks.length > 0
    ? currentDayTasks[0].title
    : `Sprint Day ${currentDay} Core Implementation`);

  const focusDesc = currentDayTasks.length > 0 && currentDayTasks[0].description
    ? currentDayTasks[0].description
    : `Implement target files scheduled for Day ${currentDay} and push commits to public repository.`;

  return (
    <div className="space-y-6">
      {/* Active Sprint Focus Banner */}
      <TodayFocus
        currentDay={currentDay}
        totalDays={totalDays}
        milestone={focusMilestone}
        description={focusDesc}
        completedTasks={completedCount}
        totalTasks={tasks.length}
      />

      {/* Task List Header */}
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs sm:text-sm font-semibold uppercase tracking-wider theme-text-muted">
              Sprint Execution Tasks ({tasks.length})
            </h3>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-cyan-500/10 text-cyan-500 font-bold">
              Day {currentDay} Active
            </span>
          </div>
          <span className="text-xs font-mono theme-text-muted">
            {completedCount}/{tasks.length} Complete
          </span>
        </div>

        {/* Chronological List of TaskCards */}
        {tasks.length > 0 ? (
          <div className="space-y-3">
            {tasks.map((task, idx) => (
              <div key={task._id || task.id || idx} className="space-y-1">
                <div className="flex items-center justify-between px-1 text-[11px] font-mono theme-text-muted">
                  <span>Day {task.dayNumber || idx + 1}</span>
                  {task.linkedCommits?.length > 0 && (
                    <span className="text-emerald-500 font-medium">
                      ✓ Linked to commit {task.linkedCommits[0].hash}
                    </span>
                  )}
                </div>
                <TaskCard
                  title={task.title}
                  description={task.description}
                  status={task.status}
                  estimate={task.estimate}
                  targetFiles={task.targetFiles}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center rounded-xl border border-dashed theme-border-subtle text-xs theme-text-muted">
            No scheduled tasks found for this project.
          </div>
        )}
      </div>
    </div>
  );
}
