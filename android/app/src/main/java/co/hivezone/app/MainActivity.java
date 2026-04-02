package co.hivezone.app;

import android.os.Bundle;
import android.graphics.Color;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        androidx.core.splashscreen.SplashScreen.installSplashScreen(this);
        super.onCreate(savedInstanceState);
        // Match brand color dashboard cream (#fcf6de) for smooth transitions
        if (this.bridge != null && this.bridge.getWebView() != null) {
            this.bridge.getWebView().setBackgroundColor(Color.parseColor("#fcf6de"));
        }
        // Force total Edge-to-Edge immersion! This physically pulls the layout entirely to the bottom of the screen, completely deleting the massive gap.
        androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        getWindow().setNavigationBarColor(Color.TRANSPARENT);
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) {
            androidx.core.view.WindowCompat.setDecorFitsSystemWindows(getWindow(), false);
        }
    }
}




