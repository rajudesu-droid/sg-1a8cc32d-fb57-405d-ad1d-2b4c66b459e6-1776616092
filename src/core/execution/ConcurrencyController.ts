// ============================================================================
// CONCURRENCY CONTROLLER
// Manages job locks and conflict prevention
// ============================================================================

import type { ExecutionJob, JobLock, TargetEntityType } from "./ExecutionJob";

export class ConcurrencyController {
  private activeLocks = new Map<string, JobLock>();
  
  /**
   * Attempt to acquire a lock for an execution job
   */
  acquireLock(job: ExecutionJob): boolean {
    const lockKey = this.generateLockKey(job.targetEntityType, job.targetEntityId);
    
    // Clean up expired locks
    this.cleanupExpiredLocks();
    
    if (this.activeLocks.has(lockKey)) {
      const existingLock = this.activeLocks.get(lockKey)!;
      console.log(`[Concurrency] Lock collision for ${lockKey}. Held by job ${existingLock.jobId}`);
      return false; // Lock acquisition failed
    }
    
    const lock: JobLock = {
      jobId: job.id,
      targetEntityType: job.targetEntityType,
      targetEntityId: job.targetEntityId,
      lockedBy: job.sourceEngine,
      lockedAt: new Date(),
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 minute max lock time
    };
    
    this.activeLocks.set(lockKey, lock);
    job.isLocked = true;
    job.lockedBy = job.sourceEngine;
    job.lockedAt = lock.lockedAt;
    
    console.log(`[Concurrency] Lock acquired for ${lockKey} by job ${job.id}`);
    return true;
  }
  
  /**
   * Release a previously acquired lock
   */
  releaseLock(job: ExecutionJob): void {
    const lockKey = this.generateLockKey(job.targetEntityType, job.targetEntityId);
    
    if (this.activeLocks.has(lockKey)) {
      const lock = this.activeLocks.get(lockKey)!;
      
      // Ensure only the job that acquired the lock can release it
      if (lock.jobId === job.id) {
        this.activeLocks.delete(lockKey);
        job.isLocked = false;
        console.log(`[Concurrency] Lock released for ${lockKey} by job ${job.id}`);
      } else {
        console.warn(`[Concurrency] Security: Job ${job.id} attempted to release lock owned by ${lock.jobId}`);
      }
    }
  }
  
  /**
   * Determine if a job conflicts with any active execution
   */
  hasConflict(job: ExecutionJob): boolean {
    const lockKey = this.generateLockKey(job.targetEntityType, job.targetEntityId);
    return this.activeLocks.has(lockKey);
  }
  
  private generateLockKey(type: TargetEntityType, id: string): string {
    return `${type}:${id}`;
  }
  
  private cleanupExpiredLocks(): void {
    const now = new Date();
    for (const [key, lock] of this.activeLocks.entries()) {
      if (lock.expiresAt < now) {
        console.warn(`[Concurrency] Auto-releasing expired lock ${key} from job ${lock.jobId}`);
        this.activeLocks.delete(key);
      }
    }
  }
}

export const concurrencyController = new ConcurrencyController();