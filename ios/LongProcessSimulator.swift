//
//  LongProcessSimulator.swift
//  BackgroundRunner
//
//  Created by Mohammed Nofal on 7/2/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

// MARK: - Declartions
/// Mock Class for simulating long running operations
class LongProcessSimulator {
    typealias JobId = Int
    typealias TickBlock = (_ progress: Int64, _ total: Int64, _ isDone: Bool) -> Bool?
    
    static let shared = LongProcessSimulator()
    private var jobs: [JobId: Bool] = [:]
    private var incremental = 1
    private var syncGroup = DispatchGroup()
    
    
    private init() {}
}


// MARK: - Jobs
extension LongProcessSimulator {
    private func newJob() -> JobId {
        defer {
            self.incremental += 1
            self.syncGroup.leave()
        }
        self.syncGroup.wait()
        self.syncGroup.enter()
        
        let job = JobId(self.incremental)
        self.jobs[job] = true
        return job
    }
    
    func stopAllTasks() {
        self.jobs.removeAll()
    }
    
    public func resetJobs() {
        defer {
            self.syncGroup.leave()
        }
        self.syncGroup.wait()
        self.syncGroup.enter()
        self.jobs = [:]
        self.incremental = 1
    }
    
    func isJobRunning(id: JobId) -> Bool {
        if let j = self.jobs[id] {
            return j
        }
        return false
    }
    
}

extension LongProcessSimulator {
    func tick(withDelay delay: TimeInterval,_ callback: @escaping RCTResponseSenderBlock) -> JobId {
        let id = newJob()
        let queue = DispatchQueue(label: "LongProcessJob \(id)")
        
        queue.async {
            let delayParam: [String: Any] = ["delay": delay]
            callback([delayParam])
        }
        
        return id
    }
    
    
    func tickSimulate(withInterval interval: TimeInterval = 1.0, block: @escaping TickBlock) -> JobId {
        let id = newJob()
        // create new queue
        let queue = DispatchQueue(label: "LongProcessJob \(id)")
        
        queue.async {
            var lastProgress: Int64 = 0
            var shouldContinue = true
            
            while shouldContinue {
                Thread.sleep(forTimeInterval: interval)
                
                guard self.jobs[id] ?? false else {
                    shouldContinue = false
                    break
                }
                
                if let cancel = block(lastProgress, 0, false), cancel {
                    // job got cancelled
                    self.jobs[id] = false
                    shouldContinue = false
                    break
                }
                
                lastProgress += 1
            }
            
            let _ = block(lastProgress, 0, true)
            
            self.jobs.removeValue(forKey: id)
        }
        
        return id
    }
    
}
