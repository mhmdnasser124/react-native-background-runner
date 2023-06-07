package com.backgroundrunner;

import android.annotation.SuppressLint;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;

import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.core.app.NotificationCompat;

import com.facebook.react.HeadlessJsTaskService;
import com.facebook.react.bridge.Arguments;
import com.facebook.react.jstasks.HeadlessJsTaskConfig;

final public class BackgroundRunnerTask extends HeadlessJsTaskService {

    public static final int SERVICE_NOTIFICATION_ID = 92901;
    private static final String CHANNEL_ID = "BACKGROUND_RUNNER_CHANNEL";

    @SuppressLint("UnspecifiedImmutableFlag")
    @NonNull
    public static Notification buildNotification(@NonNull Context context, @NonNull final Options options) {

        final String notificationTitle = options.getNotificationTitle();
        final String notificationDescription = options.getNotificationDescription();

        Notification.Builder builder;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            builder = new Notification.Builder(context, CHANNEL_ID);
        } else {
            builder = new Notification.Builder(context);
        }
        builder
                .setContentTitle(notificationTitle)
                .setContentText(notificationDescription);

        return builder.build();
    }

    @Override
    protected @Nullable
    HeadlessJsTaskConfig getTaskConfig(Intent intent) {
        final Bundle extras = intent.getExtras();
        if (extras != null) {
            return new HeadlessJsTaskConfig(extras.getString("taskName"), Arguments.fromBundle(extras), 0, true);
        }
        return null;
    }

    @Override
    public int onStartCommand(Intent intent, int flags, int startId) {
        final Bundle extras = intent.getExtras();
        if (extras != null) {
            final Options options = new Options(extras);
            createNotificationChannel(options.getNotificationTitle(), options.getNotificationDescription());

            final Notification notification = buildNotification(this, options);

            startForeground(SERVICE_NOTIFICATION_ID, notification);
        }
       return super.onStartCommand(intent, flags, startId);
    }
    

  private void createNotificationChannel(final String title, final String desc) {
    Log.d("createNotification", title + " , " + desc );
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
      int importance = NotificationManager.IMPORTANCE_DEFAULT;
      NotificationChannel notificationChannel = new NotificationChannel(CHANNEL_ID, title, importance);
      notificationChannel.setDescription(desc);
      NotificationManager notificationManager = getSystemService(NotificationManager.class);
      notificationManager.createNotificationChannel(notificationChannel);
    }
  }
}
