//
//  TaskHandler.swift
//  BackgroundRunner
//
//  Created by Mohammed Nofal on 7/7/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

class TaskHandler {
    var isRunning: Bool = false
    
    func startTask(callback: @escaping () -> Void) {
        isRunning = true
        
        // Run the task in a bacåkground queue
        DispatchQueue.global().async {
            while self.isRunning {
                // Perform the task
                callback()
                
                // Add delay between iterations
                Thread.sleep(forTimeInterval: 1.0)
            }
        }
    }
    
    func stopTask() {
        isRunning = false
    }
}
