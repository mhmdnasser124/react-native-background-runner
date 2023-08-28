package com.backgroundrunner;

import android.app.Notification;
import android.app.NotificationManager;
import android.content.Context;
import android.content.Intent;

import com.backgroundrunner.tracker.FallbackLocationTracker;

import android.location.LocationListener;
import android.location.Location;
import android.location.LocationManager;

import androidx.annotation.NonNull;

import com.backgroundrunner.tracker.LocationTracker;
import com.backgroundrunner.tracker.ProviderLocationTracker;
import com.facebook.react.bridge.Promise;
import com.facebook.react.bridge.ReactApplicationContext;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContextBaseJavaModule;
import com.facebook.react.bridge.ReactMethod;
import com.facebook.react.bridge.ReadableMap;
import com.facebook.react.bridge.WritableMap;
import com.facebook.react.modules.core.DeviceEventManagerModule;

public class BackgroundRunnerModule extends ReactContextBaseJavaModule implements LocationTracker.LocationUpdateListener {
  public static final String NAME = "BackgroundRunner";
  private final ReactContext context;
  private Intent currentService;
  private FallbackLocationTracker locationTracker;

  public BackgroundRunnerModule(ReactApplicationContext reactContext) {
    super(reactContext);
    this.context = reactContext;
  }

  @ReactMethod
  public void startLocationTracking() {
    locationTracker = new FallbackLocationTracker(context, ProviderLocationTracker.ProviderType.GPS);
    locationTracker.start(this);
  }

  @ReactMethod
  public void stopLocationTracking() {
    if (locationTracker != null) {
      locationTracker.stop();
    }
  }

  @Override
  public void onUpdate(Location oldLoc, long oldTime, Location newLoc, long newTime) {
    WritableMap params = Arguments.createMap();
    params.putDouble("latitude", newLoc.getLatitude());
    params.putDouble("longitude", newLoc.getLongitude());

    getReactApplicationContext().getJSModule(DeviceEventManagerModule.RCTDeviceEventEmitter.class)
      .emit("locationUpdate", params);
  }

  @ReactMethod
  public void getCurrentLocation(final Promise promise) {
    try {
      if (locationTracker != null) {
        Location location = locationTracker.getPossiblyStaleLocation();
        if (location != null) {
          // Create a new writable map to hold the location data
          WritableMap locationData = Arguments.createMap();

          locationData.putDouble("latitude", location.getLatitude());
          locationData.putDouble("longitude", location.getLongitude());
          locationData.putDouble("accuracy", location.getAccuracy());
          locationData.putDouble("heading", location.getBearing());
          locationData.putDouble("speed", location.getSpeed());
          locationData.putDouble("time", location.getTime());
           promise.resolve(locationData);

//        promise.resolve(location);
        }
      }
      promise.resolve(null);
    } catch (Exception e) {
      promise.reject(e);
    }

  }

  @ReactMethod
  public void start(final ReadableMap backOptions, final Promise promise) {
    try {
      if (currentService != null) context.stopService(currentService);
      currentService = new Intent(context, BackgroundRunnerTask.class);
      final Options options = new Options(context, backOptions);
      currentService.putExtras(options.getParams());
      context.startService(currentService);
      promise.resolve(null);

    } catch (Exception e) {
      promise.reject(e);
    }
  }

  @ReactMethod
  public void stop(@NonNull final Promise promise) {
    if (currentService != null)
      context.stopService(currentService);
    promise.resolve(null);
  }

  @Override
  @NonNull
  public String getName() {
    return NAME;
  }


  @ReactMethod
  public void addListener(String eventName) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

  @ReactMethod
  public void removeListeners(Integer count) {
    // Keep: Required for RN built in Event Emitter Calls.
  }

}
