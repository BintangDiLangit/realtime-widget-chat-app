/**
 * Embeddable Widget Script Generator
 * Generates a JavaScript file that can be embedded on external websites
 */

import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // Get configuration from query params
  const position = searchParams.get("position") || "bottom-right";
  const primaryColor = searchParams.get("color") || "";
  const headerText = searchParams.get("header") || "Support Chat";
  const welcomeMessage = searchParams.get("welcome") || "Hi there! 👋 How can we help you today?";
  const requireName = searchParams.get("requireName") === "true";
  const requireEmail = searchParams.get("requireEmail") === "true";

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

  // Generate the embed script
  const script = `
(function() {
  // Configuration
  var config = {
    appUrl: "${appUrl}",
    position: "${position}",
    primaryColor: "${primaryColor}",
    headerText: "${headerText}",
    welcomeMessage: "${welcomeMessage}",
    requireName: ${requireName},
    requireEmail: ${requireEmail}
  };

  // Create widget container
  var container = document.createElement('div');
  container.id = 'chat-widget-container';
  document.body.appendChild(container);

  // Create iframe
  var iframe = document.createElement('iframe');
  iframe.id = 'chat-widget-iframe';
  iframe.src = config.appUrl + '/widget?' + new URLSearchParams({
    position: config.position,
    color: config.primaryColor,
    header: config.headerText,
    welcome: config.welcomeMessage,
    requireName: config.requireName,
    requireEmail: config.requireEmail
  }).toString();
  iframe.style.cssText = 'position:fixed;bottom:0;' + (config.position === 'bottom-left' ? 'left:0;' : 'right:0;') + 'width:100%;height:100%;max-width:420px;max-height:700px;border:none;z-index:999999;background:transparent;pointer-events:none;';
  iframe.allow = 'microphone; camera';
  
  container.appendChild(iframe);

  // Enable pointer events when widget is open
  window.addEventListener('message', function(event) {
    if (event.origin !== config.appUrl) return;
    
    if (event.data.type === 'widget-open') {
      iframe.style.pointerEvents = 'auto';
    } else if (event.data.type === 'widget-close') {
      iframe.style.pointerEvents = 'none';
    }
  });

  // Expose API
  window.ChatWidget = {
    open: function() {
      iframe.contentWindow.postMessage({ type: 'open' }, config.appUrl);
    },
    close: function() {
      iframe.contentWindow.postMessage({ type: 'close' }, config.appUrl);
    },
    toggle: function() {
      iframe.contentWindow.postMessage({ type: 'toggle' }, config.appUrl);
    }
  };
})();
`.trim();

  return new NextResponse(script, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
