//
//  LocationManager.swift
//  BackgroundRunner
//
//  Created by Mohammed Nofal on 6/22/23.
//  Copyright © 2023 Facebook. All rights reserved.
//

import Foundation
import CoreLocation

class LocationManager: NSObject {
    typealias LocationAuthStatus = CLAuthorizationStatus
    enum State {
        case Idle, Monitoring
    }
    
    static let shared = LocationManager()
    
    private var _state: State = .Idle {
        didSet {
            NotificationCenterManager.shared.post(event: .LocationManagerStateChange, userInfo: ["state": _state ])
        }
    }
    public var state: State {
        get { return _state }
    }
    private var manager: CLLocationManager!
    
    private override init() {
        super.init()
        self.setup()
    }
    
    deinit {
        self.teardown()
        print("Location Manager Killed")
    }
}

private extension LocationManager {
    func setup() {
        manager = CLLocationManager()
        if #available(iOS 14.0, *) {
            manager.desiredAccuracy = kCLLocationAccuracyReduced
        } else {
            // Fallback on earlier versions
        }
        manager?.delegate = self
        if #available(iOS 9.0, *) {
            manager?.allowsBackgroundLocationUpdates = true
        } else {
            // Fallback on earlier versions
        }
        manager?.pausesLocationUpdatesAutomatically = false
        manager?.distanceFilter = kCLDistanceFilterNone
    }
    
    func teardown() {
        self.stopMonitoring()
        self.manager.delegate = nil
        self.manager = nil
    }
}

extension LocationManager {
    
    func isHasAccess() -> Bool {
        var isHas = true
        if #available(iOS 14.0, *) {
            if let authStatus = self.manager?.authorizationStatus {
                if authStatus == .notDetermined || authStatus == .denied || authStatus == .restricted {
                    isHas = false
                }
                return isHas
            }
        } else {
        }
        return false
    }
    
    func requestAccess() -> (Bool, String) {
        print("requestAccess entering")
        let status = CLLocationManager.authorizationStatus()
        
        switch status {
        case .authorizedAlways, .authorizedWhenInUse:
            print("Location access granted")
            return (true, "Location access granted")
        case .denied:
            print("Location access denied")
            return (false, "Location access denied")
        case .restricted:
            print("Location access restricted")
            return (false, "Location access restricted")
        case .notDetermined:
            manager?.requestAlwaysAuthorization()
            print("Requesting location access...")
            return (false, "Requesting location access...")
        @unknown default:
            print("Unknown location access status")
            return (false, "Unknown location access status")
        }
    }
    func startMonitoring() {
        guard self.isHasAccess() else {
            print("WARN: App Doesnt have access to CoreLocation, please call LocationManager.shared.isHasAccess() first")
            return
        }
        guard self.state == .Idle else {
            print("WARN: LocationManager already running")
            return
        }
        
        DispatchQueue.global().async {
            guard CLLocationManager.locationServicesEnabled() else {
                
                return
            }
            self._state = .Monitoring
            self.manager?.startUpdatingLocation()
            /// turn on blue indicator
            if #available(iOS 11.0, *) {
                //                self.manager.showsBackgroundLocationIndicator = true
            } else {
                // Fallback on earlier versions
            }
        }
    }
    
    func stopMonitoring() {
        guard self.state != .Idle else {
            print("WARN: LocationManager already stopped")
            return
        }
        self.manager?.stopUpdatingLocation()
        self._state = .Idle
        /// turn off blue indicator
        if #available(iOS 11.0, *) {
            self.manager.showsBackgroundLocationIndicator = false
        } else {
            // Fallback on earlier versions
        }
    }
}

extension LocationManager: CLLocationManagerDelegate {
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        if #available(iOS 14.0, *) {
            print("locationManagerDidChangeAuthorization" , manager.authorizationStatus)
        } else {
            // Fallback on earlier versions
        }
        if #available(iOS 14.0, *) {
            NotificationCenterManager.shared.post(event: .LocationAuthUpdate, userInfo: ["status": manager.authorizationStatus, "state": self.state])
        } else {
            // Fallback on earlier versions
        }
    }
    
    func startTrackingLocation(completion: @escaping (CLLocationCoordinate2D?, Error?) -> Void) {
           manager.desiredAccuracy = kCLLocationAccuracyBest
           
           if CLLocationManager.locationServicesEnabled() {
               manager.requestWhenInUseAuthorization()
               
               manager.startUpdatingLocation()
               
               if let currentLocation = manager.location?.coordinate {
                   completion(currentLocation, nil)
               } else {
                   let error = NSError(domain: "LocationManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to retrieve location."])
                   completion(nil, error)
               }
           } else {
               let error = NSError(domain: "LocationManager", code: 2, userInfo: [NSLocalizedDescriptionKey: "Location services are disabled."])
               completion(nil, error)
           }
       }
    
    func getCoordinatesWithHighAccuracy(completion: @escaping (CLLocationCoordinate2D?, Error?) -> Void) {
        
        manager.desiredAccuracy = kCLLocationAccuracyBest
        
        if CLLocationManager.locationServicesEnabled() {
          
            manager.startUpdatingLocation()
            
            if let currentLocation = manager.location?.coordinate {
                completion(currentLocation, nil)
            } else {
                let error = NSError(domain: "LocationManager", code: 1, userInfo: [NSLocalizedDescriptionKey: "Failed to retrieve location."])
                completion(nil, error)
            }
        } else {
            let error = NSError(domain: "LocationManager", code: 2, userInfo: [NSLocalizedDescriptionKey: "Location services are disabled."])
            completion(nil, error)
        }
    }

    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        NotificationCenterManager.shared.post(event: .LocationUpdate, userInfo: ["locations": locations, "state": self.state])
    }
    
    
    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        switch status {
        case .authorizedAlways:
            // User has allowed location access
            handleLocationAccess(true)
        case .denied, .restricted:
            // User has denied or restricted location access
            handleLocationAccess(false)
        default:
            break
        }
    }
    
    func handleLocationAccess(_ granted: Bool) {
        if granted {
            // Handle logic when the user has allowed location access
            print("User allowed location access")
        } else {
            // Handle logic when the user has denied or restricted location access
            print("User denied or restricted location access")
        }
    }
    
    
    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        if let clError = error as? CLError {
            switch clError.code {
            case CLError.Code.denied:
                
                fallthrough
            default:
                print("locationManager: didFailWithError", clError)
            }
            // reset state
            self._state = .Idle
        }
    }
}


extension LocationManager.LocationAuthStatus: CustomStringConvertible {
    public var description: String {
        get {
            switch self {
            case .notDetermined: return "NotDetermined"
            case .denied: return "Denied"
            case .restricted: return "Restricted"
            case .authorizedAlways: return "AuthorizedAlways"
            case .authorizedWhenInUse: return "AuthorizedWhenInUse"
            default: return "CLAuthorizationStatus"
            }
        }
    }
    
}

