//
//  NotificationCenterManager.swift
//  BackgroundRunner
//
//  Created by Mohammed Nofal on 6/22/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation

class NotificationCenterManager {
    typealias Unsubscriber = () -> Void
    static let shared = NotificationCenterManager()
    private init() {}
}

extension NotificationCenterManager {
    func on(event: Events, object: Any? = nil, queue: OperationQueue? = nil, cb: @escaping (Notification) -> Void) -> Unsubscriber {
        let center = NotificationCenter.default
        let notificationName = event.notifciationName()
        
        let observer = center.addObserver(forName: notificationName, object: object, queue: queue, using: cb)
        return {
            if object != nil {
                center.removeObserver(observer, name: notificationName, object: object)
            } else {
                center.removeObserver(observer)
            }
        }
    }
    
    /// Post event
    func post(event: Events, object: Any? = nil, userInfo: [AnyHashable: Any]? = nil) {
        guard event.isManualPostSupported() else { return }
        let center = NotificationCenter.default
        print("Event dispatch:", event)
        center.post(name: event.notifciationName(), object: object, userInfo: userInfo)
    }
}

extension NotificationCenterManager {
    enum Events: String {
        // Location Events
        case LocationUpdate
        case LocationAuthUpdate
        case LocationManagerStateChange
        // Builtin Events
        case AppEnteredBackground // is mapped to the real sys event
        case AppEnteredForeground
    }
    
}

extension NotificationCenterManager.Events {
    
    func notifciationName() -> Notification.Name {
        switch self {
        case .AppEnteredBackground:
            return Notification.Name("AppEnteredBackground")
        case .AppEnteredForeground:
            return Notification.Name("AppEnteredForeground")
        default:
            return Notification.Name(self.rawValue)
        }
    }
    
    func isManualPostSupported() -> Bool {
        let name = Notification.Name(self.rawValue)
        let actualNotificationName = self.notifciationName()
        let isSupported = name == actualNotificationName
        if !isSupported {
            print("WARN: Event \"", self, "\" Wrapps the System Event \"", actualNotificationName.rawValue, "\" And should not be posted manually")
        }
        return isSupported
    }
}
