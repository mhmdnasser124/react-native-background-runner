package com.backgroundrunner.tracker;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.Manifest;
import androidx.core.content.ContextCompat;
import androidx.core.app.ActivityCompat;

public class ProviderLocationTracker implements LocationListener, LocationTracker {

  private static final long MIN_UPDATE_DISTANCE = 1;

  private static final long MIN_UPDATE_TIME = 10;

  private LocationManager lm;

  public enum ProviderType{
    NETWORK,
    GPS
  };
  private String provider;

  private Location lastLocation;
  private long lastTime;

  private boolean isRunning;

  private LocationUpdateListener listener;

  private Context context;

  public ProviderLocationTracker(Context context, ProviderType type) {
    this.context = context;
    lm = (LocationManager)context.getSystemService(Context.LOCATION_SERVICE);
    if(type == ProviderType.NETWORK){
      provider = LocationManager.NETWORK_PROVIDER;
    }
    else{
      provider = LocationManager.GPS_PROVIDER;
    }
  }

  public void start(){
    if(isRunning){
      return;
    }

    Log.d("checkLocationPermission", String.valueOf(checkLocationPermission()));
    if (checkLocationPermission()) {
      isRunning = true;
      Log.d("requestLocation ", provider);
      lm.requestLocationUpdates(provider, MIN_UPDATE_TIME, MIN_UPDATE_DISTANCE, this);
      lastLocation = null;
      lastTime = 0;
    }else{
      requestLocationPermission();
    }
  }

  public void start(LocationUpdateListener update) {
    start();
    listener = update;
  }

  private boolean checkLocationPermission() {
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
      int coarseLocationPermission = context.checkSelfPermission(Manifest.permission.ACCESS_COARSE_LOCATION);
      int fineLocationPermission = context.checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION);

      return coarseLocationPermission == PackageManager.PERMISSION_GRANTED &&
        fineLocationPermission == PackageManager.PERMISSION_GRANTED;
    }
    return true;
  }

private void requestLocationPermission() {
  int coarseLocationPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_COARSE_LOCATION);
  int fineLocationPermission = ContextCompat.checkSelfPermission(context, Manifest.permission.ACCESS_FINE_LOCATION);

  // if (coarseLocationPermission != PackageManager.PERMISSION_GRANTED ||
  //     fineLocationPermission != PackageManager.PERMISSION_GRANTED) {
  //   ActivityCompat.requestPermissions(
  //     context.getCurrentActivity(),
  //     new String[]{
  //       Manifest.permission.ACCESS_COARSE_LOCATION,
  //       Manifest.permission.ACCESS_FINE_LOCATION
  //     },
  //     PERMISSION_REQUEST_CODE
  //   );
  // }
}


  public void stop(){
    if(isRunning){
      lm.removeUpdates(this);
      isRunning = false;
      listener = null;
    }
  }

  public boolean hasLocation(){
    if(lastLocation == null){
      return false;
    }
    if(System.currentTimeMillis() - lastTime >  MIN_UPDATE_TIME){
      return false; //stale
    }
    return true;
  }

  public boolean hasPossiblyStaleLocation(){
    if(lastLocation != null){
      return true;
    }
    return lm.getLastKnownLocation(provider)!= null;
  }

  public Location getLocation(){
    if(lastLocation == null){
      return null;
    }
    if(System.currentTimeMillis() - lastTime >  MIN_UPDATE_TIME){
      return null; //stale
    }
    return lastLocation;
  }

  public Location getPossiblyStaleLocation(){
    if(lastLocation != null){
      return lastLocation;
    }
    return lm.getLastKnownLocation(provider);
  }

  public void onLocationChanged(Location newLoc) {
    long now = System.currentTimeMillis();
    if(listener != null){
      listener.onUpdate(lastLocation, lastTime, newLoc, now);
    }
    lastLocation = newLoc;
    lastTime = now;
  }

  public void onProviderDisabled(String arg0) {

  }

  public void onProviderEnabled(String arg0) {

  }

  public void onStatusChanged(String arg0, int arg1, Bundle arg2) {
  }
}
