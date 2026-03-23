package com.fufufang86.toastmastertimer;

import android.os.Bundle;
import android.view.View;
import androidx.core.splashscreen.SplashScreen;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // 1. Initialize the Splash Screen library BEFORE super.onCreate()
        // This ensures the theme switches correctly from the splash theme to the app theme.
        SplashScreen.installSplashScreen(this);
        
        // 2. Disable system-enforced window fitting so we can handle insets ourselves.
        // This is the modern way to enable edge-to-edge and avoids the "malformed bar" layout issues.
        WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        
        super.onCreate(savedInstanceState);

        // 3. Apply padding to the root view so it doesn't overlap with status or navigation bars.
        View rootView = findViewById(android.R.id.content);
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
            int statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int navigationBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            v.setPadding(0, statusBarHeight, 0, navigationBarHeight);
            return insets;
        });
    }
}
