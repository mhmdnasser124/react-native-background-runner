package com.backgroundrunner.tracker;

import android.content.Context;
import android.location.Location;
import android.location.LocationManager;

public class FallbackLocationTracker  implements LocationTracker, LocationTracker.LocationUpdateListener {


  private boolean isRunning;

  private ProviderLocationTracker gps;
  private ProviderLocationTracker net;

  private LocationUpdateListener listener;

  Location lastLoc;
  long lastTime;

  public FallbackLocationTracker(Context context, ProviderLocationTracker.ProviderType type) {
    gps = new ProviderLocationTracker(context, ProviderLocationTracker.ProviderType.GPS);
    net = new ProviderLocationTracker(context, ProviderLocationTracker.ProviderType.NETWORK);
  }

  public void start(){
    if(isRunning){
      //Already running, do nothing
      return;
    }

    //Start both
    gps.start(this);
    net.start(this);
    isRunning = true;
  }



  public void start(LocationUpdateListener update) {
    start();
    listener = update;
  }


  public void stop(){
    if(isRunning){
      gps.stop();
      net.stop();
      isRunning = false;
      listener = null;
    }
  }

  public boolean hasLocation(){
    return gps.hasLocation() || net.hasLocation();
  }

  public boolean hasPossiblyStaleLocation(){
    return gps.hasPossiblyStaleLocation() || net.hasPossiblyStaleLocation();
  }

  public Location getLocation(){
    Location ret = gps.getLocation();
    if(ret == null){
      ret = net.getLocation();
    }
    return ret;
  }

  public Location getPossiblyStaleLocation(){
    Location ret = gps.getPossiblyStaleLocation();
    if(ret == null){
      ret = net.getPossiblyStaleLocation();
    }
    return ret;
  }

  public void onUpdate(Location oldLoc, long oldTime, Location newLoc, long newTime) {
    boolean update = false;

    //We should update only if there is no last location, the provider is the same, or the provider is more accurate, or the old location is stale
    if(lastLoc == null){
      update = true;
    }
    else if(lastLoc != null && lastLoc.getProvider().equals(newLoc.getProvider())){
      update = true;
    }
    else if(newLoc.getProvider().equals(LocationManager.GPS_PROVIDER)){
      update = true;
    }
    else if (newTime - lastTime > 5 * 60 * 1000){
      update = true;
    }

    if(update){
      if(listener != null){
        listener.onUpdate(lastLoc, lastTime, newLoc, newTime);
      }
      lastLoc = newLoc;
      lastTime = newTime;
    }
  }
}
