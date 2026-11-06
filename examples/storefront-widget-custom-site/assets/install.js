// Loads the assistant for this demo.
//
// On your real site you do NOT need this file: paste the install code from your dashboard
// just before </body> on every page. This loader only exists so the demo's two pages can share
// one config file.
//
// The values come from assets/config.js and nowhere else. They are deliberately NOT read from the
// page address: a link must never be able to choose which script a page loads.
(function () {
  var config = window.DEMO_CONFIG || {};

  var status = document.getElementById("demo-status");
  function say(text) {
    if (status) status.textContent = text;
  }

  if (!config.widgetKey || config.widgetKey === "wgt_YOUR_KEY") {
    say("No assistant key yet. Edit assets/config.js (see README.md). The two report calls still queue.");
    return;
  }

  // Same three attributes as the install code from the dashboard.
  var script = document.createElement("script");
  script.src = config.widgetSrc;
  script.setAttribute("data-widget-key", config.widgetKey);
  script.setAttribute("data-api-base", config.apiBase);
  document.body.appendChild(script);
  say("Assistant loading from " + config.apiBase + " (key ending " + String(config.widgetKey).slice(-4) + ").");
})();
