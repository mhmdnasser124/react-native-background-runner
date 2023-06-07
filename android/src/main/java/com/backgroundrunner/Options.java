package com.backgroundrunner;

import android.os.Bundle;
import android.util.Log;

import com.facebook.react.bridge.Arguments;
import com.facebook.react.bridge.ReactContext;
import com.facebook.react.bridge.ReadableMap;


public final class Options{
    private final Bundle params;

    public Options(final Bundle params) {
        this.params = params;
    }

    public Options(final ReactContext reactContext, final ReadableMap options) {
        this.params = Arguments.toBundle(options);
      for (String key: this.params.keySet())
      {
        Log.d ("Optionssss", key + " is a key in the bundle");
      }

    }

    public Bundle getParams(){
        return params;
    }

    public String getNotificationTitle() {
        return params.getString("taskTitle", "");
    }

    public String getNotificationDescription() {
        return params.getString("taskDesc", "");
    }
}
