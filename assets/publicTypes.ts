"use strict";

import HomeySettings from "homey/lib/HomeySettings";
import HomeyWidget from "homey/lib/HomeyWidget";

// Declaring interface for widgets & settings
declare global {
  interface Window {
    onHomeyReady: (homey: HomeySettings | HomeyWidget) => Promise<void>;
  }
}
