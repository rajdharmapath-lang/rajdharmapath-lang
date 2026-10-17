package org.rajdharma.airlearn

import android.app.Activity
import android.content.Intent
import android.net.Uri
import com.facebook.react.bridge.ActivityEventListener
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.module.annotations.ReactModule
import java.io.File
import java.io.FileInputStream
import java.io.IOException
import java.util.concurrent.Executors

@ReactModule(name = PdfSaveModule.NAME)
class PdfSaveModule(
  private val reactContext: ReactApplicationContext
) : ReactContextBaseJavaModule(reactContext), ActivityEventListener {
  private var pendingPromise: Promise? = null
  private var pendingSource: File? = null
  private val ioExecutor = Executors.newSingleThreadExecutor()

  init {
    reactContext.addActivityEventListener(this)
  }

  override fun getName() = NAME

  @ReactMethod
  fun saveToLocation(sourceUri: String, fileName: String, promise: Promise) {
    if (pendingPromise != null) {
      promise.reject("SAVE_IN_PROGRESS", "Another PDF save is already in progress.")
      return
    }

    val source = runCatching { Uri.parse(sourceUri).path?.let(::File) }.getOrNull()
    if (source == null || !source.isFile || !source.canRead()) {
      promise.reject("SOURCE_UNAVAILABLE", "The downloaded PDF is not available to save.")
      return
    }

    val activity = currentActivity
    if (activity == null) {
      promise.reject("ACTIVITY_UNAVAILABLE", "The save dialog cannot be opened right now.")
      return
    }

    val intent = Intent(Intent.ACTION_CREATE_DOCUMENT).apply {
      addCategory(Intent.CATEGORY_OPENABLE)
      type = "application/pdf"
      putExtra(Intent.EXTRA_TITLE, fileName)
    }

    pendingSource = source
    pendingPromise = promise
    try {
      activity.startActivityForResult(intent, REQUEST_CODE)
    } catch (error: Exception) {
      pendingSource = null
      pendingPromise = null
      promise.reject("SAVE_DIALOG_FAILED", "Could not open the save location picker.", error)
    }
  }

  override fun onActivityResult(
    activity: Activity,
    requestCode: Int,
    resultCode: Int,
    data: Intent?
  ) {
    if (requestCode != REQUEST_CODE) return

    val promise = pendingPromise ?: return
    val source = pendingSource
    pendingPromise = null
    pendingSource = null

    if (resultCode != Activity.RESULT_OK || data?.data == null) {
      promise.resolve("cancelled")
      return
    }

    val destination = data.data!!
    ioExecutor.execute {
      try {
        val output = reactContext.contentResolver.openOutputStream(destination, "w")
          ?: throw IOException("Could not open the selected save location.")
        output.use { outputStream ->
          FileInputStream(source ?: throw IOException("The downloaded PDF is unavailable.")).use { input ->
            input.copyTo(outputStream, DEFAULT_BUFFER_SIZE)
          }
        }
        promise.resolve("saved")
      } catch (error: Exception) {
        promise.reject("SAVE_FAILED", "Could not save the PDF to the selected location.", error)
      }
    }
  }

  override fun onNewIntent(intent: Intent) = Unit

  companion object {
    const val NAME = "PdfSave"
    private const val REQUEST_CODE = 7314
  }
}
