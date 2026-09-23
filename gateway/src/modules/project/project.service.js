import mongoose from 'mongoose';
import { Project } from '../../models/Project.model.js';
import { Task } from '../../models/Task.model.js';
import { Commit } from '../../models/Commit.model.js';
import { isDbConnected } from '../../config/db.js';

// In-memory store (empty by default, only used as temporary fallback if Atlas is offline)
let inMemoryProjects = [];
let inMemoryTasks = {};

export class ProjectService {
  /**
   * Normalize and parse repository data safely
   */
  static parseRepo(repoData) {
    if (!repoData) {
      return { owner: '', name: '', fullName: '', url: '', branch: 'main', lastSync: new Date() };
    }

    let url = repoData.url || (typeof repoData === 'string' ? repoData : '');
    let fullName = repoData.fullName || '';
    let owner = repoData.owner || '';
    let name = repoData.name || '';
    const branch = repoData.branch || 'main';

    const raw = url || fullName || '';
    if (raw) {
      const clean = raw.trim().replace(/^https?:\/\/github\.com\//i, '').replace(/\.git$/i, '').replace(/\/+$/, '');
      const parts = clean.split('/');
      if (parts.length >= 2 && parts[0] !== 'undefined' && parts[1] !== 'undefined') {
        owner = parts[0];
        name = parts[1];
        fullName = `${owner}/${name}`;
        url = `https://github.com/${owner}/${name}`;
      } else if (clean && clean !== 'undefined/undefined') {
        fullName = clean;
        name = clean;
        url = clean.startsWith('http') ? clean : `https://github.com/${clean}`;
      }
    }

    if (!url && fullName && fullName !== 'undefined/undefined') {
      url = `https://github.com/${fullName}`;
    }

    return {
      owner: (owner && owner !== 'undefined') ? owner : '',
      name: (name && name !== 'undefined') ? name : '',
      fullName: (fullName && fullName !== 'undefined/undefined') ? fullName : '',
      url: (url && !url.includes('undefined/undefined')) ? url : '',
      branch,
      lastSync: new Date(),
    };
  }

  /**
   * Get all projects for a specific user
   */
  static async getAllProjects(userId = null) {
    if (!userId) {
      return [];
    }

    if (!isDbConnected()) {
      return inMemoryProjects.filter(
        (p) => p.userId && p.userId.toString() === userId.toString()
      );
    }
    try {
      const dbProjects = await Project.find({ userId })
        .sort({ updatedAt: -1 })
        .lean();
      if (dbProjects) {
        dbProjects.forEach((p) => {
          if (p.repo && (p.repo.fullName === 'undefined/undefined' || !p.repo.fullName)) {
            p.repo = this.parseRepo(p.repo);
          }
        });
      }
      return dbProjects || [];
    } catch {
      return inMemoryProjects.filter(
        (p) => p.userId && p.userId.toString() === userId.toString()
      );
    }
  }

  /**
   * Find project by slug or ObjectId
   */
  static async getProjectByIdOrSlug(idOrSlug) {
    if (!idOrSlug) return null;

    if (!isDbConnected()) {
      return inMemoryProjects.find((p) => p._id === idOrSlug || p.slug === idOrSlug) || null;
    }

    try {
      let project = null;
      if (mongoose.Types.ObjectId.isValid(idOrSlug)) {
        project = await Project.findById(idOrSlug).lean();
      }
      if (!project) {
        project = await Project.findOne({ slug: idOrSlug }).lean();
      }
      if (project && project.repo && (project.repo.fullName === 'undefined/undefined' || !project.repo.fullName)) {
        project.repo = this.parseRepo(project.repo);
      }
      return project || inMemoryProjects.find((p) => p._id === idOrSlug || p.slug === idOrSlug) || null;
    } catch {
      return inMemoryProjects.find((p) => p._id === idOrSlug || p.slug === idOrSlug) || null;
    }
  }

  /**
   * Get tasks for a given project
   */
  static async getTasks(projectIdOrSlug) {
    if (!projectIdOrSlug) return [];

    if (!isDbConnected()) {
      return inMemoryTasks[projectIdOrSlug] || [];
    }

    try {
      let filter = { projectId: projectIdOrSlug };
      if (!mongoose.Types.ObjectId.isValid(projectIdOrSlug)) {
        const proj = await Project.findOne({ slug: projectIdOrSlug }).select('_id').lean();
        if (proj) {
          filter = { projectId: proj._id };
        }
      }
      const tasks = await Task.find(filter).sort({ dayNumber: 1 }).lean();
      return tasks || [];
    } catch {
      return inMemoryTasks[projectIdOrSlug] || [];
    }
  }

  /**
   * Get commits for a given project
   */
  static async getCommits(projectId) {
    if (!projectId || !isDbConnected()) {
      return [];
    }
    try {
      return await Commit.find({ projectId }).sort({ timestamp: -1 }).limit(30).lean();
    } catch {
      return [];
    }
  }

  /**
   * Create a new project with its initial tasks
   */
  static async createProjectWithTasks(projectData, tasksList = []) {
    const baseSlug = (projectData.title || 'new-project')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const slug = `${baseSlug}-${Date.now().toString(36)}`;
    projectData.slug = slug;

    if (!isDbConnected()) {
      const newProj = {
        _id: `proj-${Date.now()}`,
        ...projectData,
        createdAt: new Date(),
      };
      inMemoryProjects.unshift(newProj);
      inMemoryTasks[newProj._id] = tasksList.map((t, idx) => ({
        _id: `task-${Date.now()}-${idx}`,
        projectId: newProj._id,
        dayNumber: t.dayNumber || idx + 1,
        title: t.title,
        description: t.description || '',
        estimate: t.estimate || '2h',
        targetFiles: t.targetFiles || [],
        status: t.status || (idx === 0 ? 'In Progress' : 'Pending'),
      }));
      inMemoryTasks[newProj.slug] = inMemoryTasks[newProj._id];
      return newProj;
    }

    const project = await Project.create(projectData);

    if (tasksList && tasksList.length > 0) {
      const taskDocs = tasksList.map((t, idx) => ({
        projectId: project._id,
        dayNumber: t.dayNumber || idx + 1,
        title: t.title,
        description: t.description || '',
        estimate: t.estimate || '2h',
        targetFiles: t.targetFiles || [],
        status: t.status || (idx === 0 ? 'In Progress' : 'Pending'),
      }));

      await Task.insertMany(taskDocs);
    }

    return project;
  }

  /**
   * Link public repository to project
   */
  static async connectRepo(projectIdOrSlug, repoData) {
    const project = await this.getProjectByIdOrSlug(projectIdOrSlug);
    if (!project) throw new Error('Project not found');

    const updatedRepo = this.parseRepo(repoData);

    if (!isDbConnected()) {
      project.repo = updatedRepo;
      project.status = 'Active Sync';
      return project;
    }

    return Project.findByIdAndUpdate(
      project._id,
      { repo: updatedRepo, status: 'Active Sync' },
      { new: true }
    );
  }

  /**
   * Delete a project and its associated tasks and commits
   */
  static async deleteProject(projectIdOrSlug) {
    const project = await this.getProjectByIdOrSlug(projectIdOrSlug);
    if (!project) throw new Error('Project not found');

    if (!isDbConnected()) {
      inMemoryProjects = inMemoryProjects.filter(
        (p) => p._id !== project._id && p.slug !== project.slug
      );
      delete inMemoryTasks[project._id];
      delete inMemoryTasks[project.slug];
      return { success: true, message: 'Project deleted successfully' };
    }

    await Promise.all([
      Project.findByIdAndDelete(project._id),
      Task.deleteMany({ projectId: project._id }),
      Commit.deleteMany({ projectId: project._id }),
    ]);

    return { success: true, message: 'Project deleted successfully' };
  }
}
