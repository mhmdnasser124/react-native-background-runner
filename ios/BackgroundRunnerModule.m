//
//  BackgroundRunnerModule.m
//  BackgroundRunner
//
//  Created by Mohammed Nofal on 6/25/23.
//  Copyright © 2023 Facebook. All rights reserved.
//


#import "React/RCTBridgeModule.h"

@interface RCT_EXTERN_REMAP_MODULE(BackgroundRunner, BackgroundRunnerService, NSObject)

_RCT_EXTERN_REMAP_METHOD(inc, increment, false)

//_RCT_EXTERN_REMAP_METHOD(start, startLongProcess, false)

_RCT_EXTERN_REMAP_METHOD(init, registerTask, false)

_RCT_EXTERN_REMAP_METHOD(deInit, deregisterTask, false)

_RCT_EXTERN_REMAP_METHOD(stop, stopSim, false)

_RCT_EXTERN_REMAP_METHOD(setup, setupNotificationCenterManager, false)

//_RCT_EXTERN_REMAP_METHOD(getCurrentLocation, getCoordinates, false)

_RCT_EXTERN_REMAP_METHOD(backgroundCallBack, enteredBackground, false)

_RCT_EXTERN_REMAP_METHOD(foregroundCallBack, enteredForeground, false)

//_RCT_EXTERN_REMAP_METHOD(requestBackgroundAccess, requestAccess, false)

RCT_EXTERN_METHOD(getCount: (RCTResponseSenderBlock)callback)

RCT_EXTERN_METHOD(
                  startLongProcess:
//                  (NSNumber *)delay
//                  callback:
                  (RCTResponseSenderBlock)callback)


RCT_EXTERN_METHOD(
                  hasAccess: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )

RCT_EXTERN_METHOD(
                  requestAccess: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )


RCT_EXTERN_METHOD(
                  decrement: (RCTPromiseResolveBlock)resolve
                  rejecter: (RCTPromiseRejectBlock)reject
                  )


@end
