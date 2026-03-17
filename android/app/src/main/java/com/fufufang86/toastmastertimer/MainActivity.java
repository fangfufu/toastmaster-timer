package com.fufufang86.toastmastertimer;

import android.os.Bundle;
import android.view.View;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        // Ensure the window fits system windows BEFORE the activity is created/content is set
        WindowCompat.setDecorFitsSystemWindows(getWindow(), true);
        
        super.onCreate(savedInstanceState);

        // Force the root view to respect system insets to avoid overlapping status/nav bars
        View rootView = getWindow().getDecorView();
        ViewCompat.setOnApplyWindowInsetsListener(rootView, (v, insets) -> {
            int statusBarHeight = insets.getInsets(WindowInsetsCompat.Type.statusBars()).top;
            int navigationBarHeight = insets.getInsets(WindowInsetsCompat.Type.navigationBars()).bottom;
            v.setPadding(0, statusBarHeight, 0, navigationBarHeight);
            return insets;
        });
    }
}
