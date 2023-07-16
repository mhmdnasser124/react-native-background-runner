//
//  BackgroundRunnerModule.swift
//  BackgroundRunner
//
//  Created by Mohammed Nofal on 6/25/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation
import React

let DID_APP_ENTER_BG_WHILE_PROCESSING = "DID_APP_ENTER_BG_WHILE_PROCESSING"


@objc(BackgroundRunnerService)
class BackgroundRunnerService: RCTEventEmitter {
    
    private var count = 0
    var longTaskdId: LongProcessSimulator.JobId?
    private var taskHandler: TaskHandler?
    
    typealias Subs = KeyValuePairs<NotificationCenterManager.Events, (Notification) -> Void>
    var subs: Subs = [:]
    private var Desubsrcibers: [NotificationCenterManager.Unsubscriber?] = []
    
    private var desubscribers: [NotificationCenterManager.Unsubscriber?] = []
    
    var SubscriptionEvents: Subs {
        return subs
    }
    
    @objc
    func enteredBackground() {
        print("VC: App entered background")
        let gps = LocationManager.shared
        if gps.isHasAccess() && isSimulating() { gps.startMonitoring() }
        self.didEnterBgWhileProcessing = isSimulating()
    }
    
    @objc
    func enteredForeground() {
        print("VC: App entered foreground")
        let gps = LocationManager.shared
        let cache = UserDefaults.standard
        self.didEnterBgWhileProcessing = cache.bool(forKey: DID_APP_ENTER_BG_WHILE_PROCESSING)
        if !gps.isHasAccess() && self.didEnterBgWhileProcessing {
            //            self.updateHintLabel(setHidden: false, setText: WARNING_HINT_TEXT)
        } else if gps.state == .Monitoring {
            gps.stopMonitoring()
        }
    }
    
//    _ delay: NSNumber,
    @objc
    func startLongProcess(_ callback: @escaping RCTResponseSenderBlock) {
//        let delayInterval = TimeInterval(delay.doubleValue / 1000)
        
        self.startSim(withDelay: 1000, callback)
    }
    
    @objc
    func cancelLongProcess() {
        self.stopSim()
    }
    
    var didEnterBgWhileProcessing: Bool = false {
        didSet {
            // save the didEnterBgWhileProcessing value on each change
            if self.didEnterBgWhileProcessing != oldValue {
                DispatchQueue.global().async { [unowned self] in
                    UserDefaults.standard.setValue(
                        self.didEnterBgWhileProcessing,
                        forKey: DID_APP_ENTER_BG_WHILE_PROCESSING
                    )
                    UserDefaults.standard.synchronize()
                }
            }
        }
    }
    
    @objc
    func increment() {
        count += 1
        print("count is \(count)")
    }
    
    
    @objc
    func decrement(
        _ resolve: RCTPromiseResolveBlock,
        rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
        if (count == 0) {
            let error = NSError(domain: "", code: 200, userInfo: nil)
            reject("E_COUNT", "count cannot be negative", error)
        } else {
            count -= 1
            resolve("count was decremented")
        }
    }
    
    
    @objc
    func requestAccess(
        _ resolve: RCTPromiseResolveBlock,
        rejecter reject: RCTPromiseRejectBlock) -> Void {
            print("request started")
            var (granted, message) = LocationManager.shared.requestAccess()
            
            if granted == false && message == "Requesting location access..." {
                let (retryGranted, retryMessage) = LocationManager.shared.requestAccess()
                granted = retryGranted
                message = retryMessage
            }
            
            let result: [String: Any] = ["granted": granted, "message": message]
            resolve(result)
            print("request ended")
        }
    
    @objc
    func hasAccess(
        _ resolve: RCTPromiseResolveBlock,
        rejecter reject: RCTPromiseRejectBlock
    ) -> Void {
        if(LocationManager.shared.isHasAccess()){
            resolve("Location Access is true");
        }else{
            let error = NSError(domain: "", code: 200, userInfo: nil)
            reject("E_HAS_ACCESS", "Location Access is false", error)
        }
    }
    
    func startSim(withDelay delay: TimeInterval, _ callback: @escaping RCTResponseSenderBlock) {
        guard !self.isSimulating() else {
            /// error:  Task already running
            return
        }
        let lpSim = LongProcessSimulator.shared
        
        //    withInterval: 1.5,
        //    block: { progress, total, isDone in
        //        return self.simluationTick(progress: progress, total: total, isDone: isDone)
        //    }
        self.longTaskdId = lpSim.tick(
            withDelay: delay,
            callback
        )
    }
    
    @objc
    func getCoordinates() {
        print("getCoordinates in =>>>> ")
        LocationManager.shared.getCoordinatesWithHighAccuracy { (coordinates, error) in
            if let error = error {
                print("Error: \(error.localizedDescription)")
                self.sendLocationEvent(CLLocation(), error: error) // call sendLocationEvent method with error parameter
                // Handle the error
            } else if let coordinates = coordinates {
                let location = CLLocation(latitude: coordinates.latitude, longitude: coordinates.longitude)
                print("Latitude: \(coordinates.latitude), Longitude: \(coordinates.longitude)")
                self.sendLocationEvent(location) // call sendLocationEvent method with location parameter
                // Use the latitude and longitude values as needed
            }
        }
    }
    
    @objc
    func stopSim() {
        guard self.isSimulating() else {
            /// error: No task running
            return
        }
        let lpSim = LongProcessSimulator.shared
        lpSim.stopAllTasks()
        // cancel
        self.longTaskdId = nil
    }
    
    func isSimulating() -> Bool {
        return self.longTaskdId != nil
    }
    
    override func supportedEvents() -> [String] {
        return ["BackgroundEventCallBack", "location"]
    }
    
    func sendLocationEvent(_ location: CLLocation, error: Error? = nil) {
        var body: [String: Any] = ["latitude": location.coordinate.latitude,
                                   "longitude": location.coordinate.longitude]
        if let error = error {
            body["error"] = error.localizedDescription
        }
        sendEvent(withName: "location", body: body)
    }
    
    
    func simluationTick(progress: Int64, total: Int64, isDone: Bool
                        
    ) -> Bool? {
        
        let tickData = ["ticks": "\(progress)"]
        
        //        sendEvent(withName: "BackgroundEventCallBack", body: tickData)
        
        if isDone {
            self.longTaskdId = nil
            /// reset the proccess here
            LocationManager.shared.stopMonitoring()
        }
        return !self.isSimulating() // returning true cancels run
    }
    
    @objc
    static override func requiresMainQueueSetup() -> Bool {
        return false
    }
    
    @objc func stopTask() {
        // Stop the task
        taskHandler?.stopTask()
        taskHandler = nil
    }
}

extension BackgroundRunnerService {
    
    @objc
    func setupNotificationCenterManager() {
        print("in setup start")
        self.subs = [
            .LocationAuthUpdate: self.locationAccessChanged(notification:),
        ]
        
        for element in self.subs {
            print("in setup element ")
            print(element)
        }
    }
    
    
    
    private func locationAccessChanged(notification: Notification) {
        let info = notification.userInfo
        if let state = info?["status"] as? LocationManager.LocationAuthStatus {
        }
    }
}


extension BackgroundRunnerService {
    private func register() {
        for sub in self.SubscriptionEvents {
            self.Desubsrcibers.append(NotificationCenterManager.shared.on(event: sub.key, cb: sub.value))
        }
        
    }
    
    private func deregister() {
        let cnt = self.Desubsrcibers.count
        for i in 0 ..< cnt {
            var m = self.Desubsrcibers[i]
            m?()
            self.Desubsrcibers[i] = nil
            m = nil
        }
    }
}

extension BackgroundRunnerService {
    
    @objc
    func registerTask(){
        register();
    }
    
    @objc
    func deregisterTask(){
        deregister();
    }
}



